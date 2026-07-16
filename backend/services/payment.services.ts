import crypto from 'crypto';
import { Request } from 'express';
import pool = require('../config/database');
import * as PaymentModel from '../model/payment.model';
import * as AppointmentModel from '../model/appointment.model';
import * as paymongoConfig from '../config/paymongo';
import { enqueueEmailJob } from '../utils/emailQueue';
import { AppError } from '../utils/AppError';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseSignatureHeader = (header: string): Record<string, string> =>
    header.split(',').reduce((acc: Record<string, string>, part) => {
        const [key, value] = part.split('=');
        if (key && value) acc[key] = value;
        return acc;
    }, {});

const signaturesMatch = (expected: string, received: string | undefined): boolean => {
    if (!received) return false;
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(received, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
};

// ─── Service Functions ───────────────────────────────────────────────────────

export const verifyAndParseWebhook = (req: Request, webhookSecret: string): any => {
    const signatureHeader = req.headers['paymongo-signature'] as string | undefined;
    if (!signatureHeader) throw AppError.badRequest('Missing PayMongo signature header');

    const parts = parseSignatureHeader(signatureHeader);
    const { t: timestamp, te: testSig, li: liveSig } = parts;

    if (!timestamp || (!testSig && !liveSig)) {
        throw AppError.badRequest('Invalid PayMongo signature header');
    }

    if (!Buffer.isBuffer(req.body)) {
        throw AppError.badRequest('Raw webhook body is required');
    }

    const sigToVerify = process.env.NODE_ENV === 'production' && liveSig ? liveSig : testSig;
    const payloadStr = `${timestamp}.${req.body.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');

    if (!signaturesMatch(expected, sigToVerify)) {
        throw AppError.badRequest('Invalid webhook signature');
    }

    return JSON.parse(req.body.toString('utf8'));
};

export const processPaymentPaid = async (eventData: any): Promise<string | null> => {
    const checkoutId = eventData.id;
    const externalPaymentId = eventData.attributes?.payments?.[0]?.id ?? null;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const payment = await PaymentModel.getPaymentByCheckoutId(checkoutId, client, true);
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

        await PaymentModel.updatePayment(payment.id, { status: 'paid', paymongo_payment_id: externalPaymentId }, client);

        const appointment = await AppointmentModel.getAppointmentById(payment.appointment_id as string, client, true);
        const slotStillAvailable = appointment && await AppointmentModel.isSlotAvailable(
            appointment.barber_id as string,
            appointment.appointment_date,
            appointment.start_time,
            appointment.end_time,
            client,
            appointment.id
        );

        if (!slotStillAvailable) {
            await AppointmentModel.updateAppointmentStatus(payment.appointment_id as string, 'cancelled', client);
            await client.query('COMMIT');
            console.warn(`Slot no longer available after payment; appointment cancelled: ${payment.appointment_id}`);
            return null;
        }

        await AppointmentModel.updateAppointmentStatus(payment.appointment_id as string, 'confirmed', client);
        await client.query('COMMIT');
        console.log(`Payment confirmed for Appointment ID: ${payment.appointment_id}`);
        return payment.appointment_id;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const processPaymentFailed = async (eventData: any): Promise<void> => {
    const externalPaymentId = eventData.id;
    const referenceNumber = eventData.attributes?.external_reference_number;

    if (!referenceNumber) {
        console.warn(`Payment failure webhook lacks external reference number: ${externalPaymentId}`);
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const payment = await PaymentModel.getPaymentById(referenceNumber, client, true);
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

        await PaymentModel.updatePayment(payment.id, { status: 'failed', paymongo_payment_id: externalPaymentId }, client);
        await AppointmentModel.updateAppointmentStatus(payment.appointment_id as string, 'cancelled', client);
        await client.query('COMMIT');
        console.log(`Payment failed and appointment cancelled for Appointment ID: ${payment.appointment_id}`);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const handleWebhook = async (req: Request): Promise<void> => {
    const webhookSecret = paymongoConfig.webhookSecret;
    if (!webhookSecret) throw AppError.internal('Webhook secret is not configured');

    const payload = verifyAndParseWebhook(req, webhookSecret);

    const event = payload.data;
    if (!event?.attributes?.data) throw AppError.badRequest('Invalid webhook event payload');

    const eventType = event.attributes.type;
    const eventData = event.attributes.data;
    let confirmationAppointmentId: string | null = null;

    if (eventData.type === 'checkout_session' && eventType === 'checkout_session.payment.paid') {
        confirmationAppointmentId = await processPaymentPaid(eventData);
    } else if (eventType === 'payment.failed') {
        await processPaymentFailed(eventData);
    }

    if (confirmationAppointmentId) {
        const fullDetails = await AppointmentModel.getAppointmentDetails(confirmationAppointmentId);
        if (fullDetails) enqueueEmailJob('bookingConfirmation', fullDetails);
    }
};
