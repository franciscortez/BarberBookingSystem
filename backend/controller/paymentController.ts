import { Request, Response } from 'express';
import crypto from 'crypto';
import * as Payment from '../model/Payment';
import * as Appointment from '../model/Appointment';
import * as paymongoConfig from '../config/paymongo';
import { enqueueEmailJob } from '../utils/emailQueue';
import pool = require('../config/database');

const parseSignatureHeader = (signatureHeader: string): Record<string, string> => {
    return signatureHeader.split(',').reduce((acc: Record<string, string>, part) => {
        const [key, value] = part.split('=');
        if (key && value) {
            acc[key] = value;
        }
        return acc;
    }, {});
};

const signaturesMatch = (expectedSignature: string, receivedSignature: string | undefined): boolean => {
    if (!receivedSignature) {
        return false;
    }

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

/**
 * Verifies the PayMongo webhook signature and parses the payload.
 * Throws an Error if verification fails.
 */
const verifyPayMongoSignature = (req: Request, webhookSecret: string): any => {
    const signatureHeader = req.headers['paymongo-signature'] as string | undefined;
    if (!signatureHeader) {
        throw new Error('Missing PayMongo signature header');
    }

    const signatureParts = parseSignatureHeader(signatureHeader);
    const timestamp = signatureParts.t;
    const testSignature = signatureParts.te;
    const liveSignature = signatureParts.li;

    if (!timestamp || (!testSignature && !liveSignature)) {
        throw new Error('Invalid PayMongo signature header');
    }

    if (!Buffer.isBuffer(req.body)) {
        throw new Error('Raw webhook body is required');
    }

    const signatureToVerify = process.env.NODE_ENV === 'production' && liveSignature ? liveSignature : testSignature;
    const payloadStr = `${timestamp}.${req.body.toString('utf8')}`;
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadStr)
        .digest('hex');

    if (!signaturesMatch(expectedSignature, signatureToVerify)) {
        throw new Error('Invalid webhook signature');
    }

    return JSON.parse(req.body.toString('utf8'));
};

/**
 * Processes successful checkout session payments inside a database transaction.
 * Returns the appointment ID if a confirmation email needs to be sent, or null otherwise.
 */
const processPaymentPaid = async (eventData: any): Promise<string | null> => {
    const checkoutSession = eventData.attributes;
    const checkoutId = eventData.id;
    const externalPaymentId = checkoutSession.payments && checkoutSession.payments[0] ? checkoutSession.payments[0].id : null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const payment = await Payment.getPaymentByCheckoutId(checkoutId, client, true);

        if (!payment) {
            await client.query('COMMIT');
            console.warn(`Webhook received for unknown Checkout ID: ${checkoutId}`);
            return null;
        }

        if (payment.status === 'paid') {
            await client.query('COMMIT');
            console.log(`Duplicate paid webhook ignored for Payment ID: ${payment.id}`);
            return null;
        }

        await Payment.updatePayment(payment.id, {
            status: 'paid',
            paymongo_payment_id: externalPaymentId
        }, client);

        const appointment = await Appointment.getAppointmentById(payment.appointment_id as string, client, true);
        const slotIsStillAvailable = appointment && await Appointment.isSlotAvailable(
            appointment.barber_id as string,
            appointment.appointment_date,
            appointment.start_time,
            appointment.end_time,
            client,
            appointment.id
        );

        if (!slotIsStillAvailable) {
            await Appointment.updateAppointmentStatus(payment.appointment_id as string, 'cancelled', client);
            await client.query('COMMIT');
            console.warn(`Payment paid after slot was no longer available; appointment cancelled for manual reconciliation: ${payment.appointment_id}`);
            return null;
        }

        await Appointment.updateAppointmentStatus(payment.appointment_id as string, 'confirmed', client);
        await client.query('COMMIT');
        console.log(`Payment confirmed for Appointment ID: ${payment.appointment_id}`);
        return payment.appointment_id;
    } catch (transactionErr) {
        await client.query('ROLLBACK');
        throw transactionErr;
    } finally {
        client.release();
    }
};

/**
 * Processes failed payments and cancels the corresponding pending appointment inside a database transaction.
 */
const processPaymentFailed = async (eventData: any): Promise<void> => {
    const externalPaymentId = eventData.id;
    const referenceNumber = eventData.attributes && eventData.attributes.external_reference_number;
    if (!referenceNumber) {
        console.warn(`Payment failure webhook lacks external reference number: ${externalPaymentId}`);
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const payment = await Payment.getPaymentById(referenceNumber, client, true);

        if (!payment) {
            await client.query('COMMIT');
            console.warn(`Payment failure webhook could not be matched: ${externalPaymentId}`);
            return;
        }

        if (payment.status === 'failed') {
            await client.query('COMMIT');
            console.log(`Duplicate failed webhook ignored for Payment ID: ${payment.id}`);
            return;
        }

        if (payment.status === 'paid') {
            await client.query('COMMIT');
            console.warn(`Ignored failed webhook for already paid Payment ID: ${payment.id}`);
            return;
        }

        await Payment.updatePayment(payment.id, {
            status: 'failed',
            paymongo_payment_id: externalPaymentId
        }, client);

        await Appointment.updateAppointmentStatus(payment.appointment_id as string, 'cancelled', client);
        await client.query('COMMIT');
        console.log(`Payment failed and appointment cancelled for Appointment ID: ${payment.appointment_id}`);
    } catch (transactionErr) {
        await client.query('ROLLBACK');
        throw transactionErr;
    } finally {
        client.release();
    }
};

/**
 * Handle incoming PayMongo Webhooks
 */
export const handleWebhook = async (req: Request, res: Response): Promise<any> => {
    try {
        const webhookSecret = paymongoConfig.webhookSecret;
        if (!webhookSecret) {
            console.error('Webhook secret is not configured');
            return res.status(500).json({ error: 'Webhook secret is not configured' });
        }

        // 1. Verify signature and extract payload
        let payload;
        try {
            payload = verifyPayMongoSignature(req, webhookSecret);
        } catch (sigError: any) {
            console.warn(`Rejected webhook: ${sigError.message}`);
            return res.status(400).json({ error: sigError.message });
        }

        const event = payload.data;
        if (!event || !event.attributes || !event.attributes.data) {
            console.warn('Rejected webhook with missing event data');
            return res.status(400).json({ error: 'Invalid webhook event payload' });
        }

        const eventType = event.attributes.type;
        const eventData = event.attributes.data;
        let confirmationEmailAppointmentId = null;

        // 2. Route events to specific modular processor handlers
        if (eventData.type === 'checkout_session' && eventType === 'checkout_session.payment.paid') {
            confirmationEmailAppointmentId = await processPaymentPaid(eventData);
        } else if (eventType === 'payment.failed') {
            await processPaymentFailed(eventData);
        }

        // 3. Handle asynchronous post-processing (e.g. Email notifications)
        if (confirmationEmailAppointmentId) {
            const fullDetails = await Appointment.getAppointmentDetails(confirmationEmailAppointmentId);
            if (fullDetails) {
                enqueueEmailJob('bookingConfirmation', fullDetails);
            }
        }

        return res.status(200).json({ message: 'Webhook Received' });
    } catch (err) {
        console.error('Error handling webhook:', err);
        return res.status(500).json({ error: 'Internal webhook error' });
    }
};
