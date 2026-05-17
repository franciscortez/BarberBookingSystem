const crypto = require('crypto');
const Payment = require('../model/Payment');
const Appointment = require('../model/Appointment');
const paymongoConfig = require('../config/paymongo');
const { sendConfirmationEmail } = require('../utils/emailService');

const parseSignatureHeader = (signatureHeader) => {
    return signatureHeader.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        if (key && value) {
            acc[key] = value;
        }
        return acc;
    }, {});
};

const signaturesMatch = (expectedSignature, receivedSignature) => {
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
 * Handle incoming PayMongo Webhooks
 */
const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = paymongoConfig.webhookSecret;
        if (!webhookSecret) {
            console.error('Webhook secret is not configured');
            return res.status(500).json({ error: 'Webhook secret is not configured' });
        }

        const signatureHeader = req.headers['paymongo-signature'];

        if (!signatureHeader) {
            console.warn('Rejected webhook without PayMongo signature header');
            return res.status(400).json({ error: 'Missing PayMongo signature header' });
        }

        const signatureParts = parseSignatureHeader(signatureHeader);
        const timestamp = signatureParts.t;
        const testSignature = signatureParts.te;
        const liveSignature = signatureParts.li;

        if (!timestamp || (!testSignature && !liveSignature)) {
            console.warn('Rejected webhook with malformed PayMongo signature header');
            return res.status(400).json({ error: 'Invalid PayMongo signature header' });
        }

        if (!Buffer.isBuffer(req.body)) {
            console.warn('Rejected webhook because raw body was unavailable');
            return res.status(400).json({ error: 'Raw webhook body is required' });
        }

        const signatureToVerify = process.env.NODE_ENV === 'production' && liveSignature ? liveSignature : testSignature;
        const payloadStr = `${timestamp}.${req.body.toString('utf8')}`;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payloadStr)
            .digest('hex');

        if (!signaturesMatch(expectedSignature, signatureToVerify)) {
            console.warn('Rejected webhook with invalid PayMongo signature');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        let payload;
        try {
            payload = JSON.parse(req.body.toString('utf8'));
        } catch (parseErr) {
            console.warn('Rejected webhook with invalid JSON payload');
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        const event = payload.data;
        if (!event || !event.attributes || !event.attributes.data) {
            console.warn('Rejected webhook with missing event data');
            return res.status(400).json({ error: 'Invalid webhook event payload' });
        }

        const eventType = event.attributes.type;
        const eventData = event.attributes.data;

        if (eventData.type === 'checkout_session') {
            const checkoutSession = eventData.attributes;
            const checkoutId = eventData.id;

            const payment = await Payment.getPaymentByCheckoutId(checkoutId);

            if (payment) {
                if (eventType === 'checkout_session.payment.paid') {
                    if (payment.status === 'paid') {
                        console.log(`Duplicate paid webhook ignored for Payment ID: ${payment.id}`);
                        return res.status(200).json({ message: 'Webhook Received' });
                    }

                    await Payment.updatePayment(payment.id, {
                        status: 'paid',
                        paymongo_payment_id: checkoutSession.payments && checkoutSession.payments[0] ? checkoutSession.payments[0].id : null
                    });

                    await Appointment.updateAppointmentStatus(payment.appointment_id, 'confirmed');

                    console.log(`Payment confirmed for Appointment ID: ${payment.appointment_id}`);

                    const fullDetails = await Appointment.getAppointmentDetails(payment.appointment_id);
                    if (fullDetails) {
                        await sendConfirmationEmail(fullDetails);
                    }
                }
            } else {
                console.warn(`Webhook received for unknown Checkout ID: ${checkoutId}`);
            }
        } else if (eventType === 'payment.failed') {
            const externalPaymentId = eventData.id;
            const referenceNumber = eventData.attributes && eventData.attributes.external_reference_number;
            const payment = referenceNumber ? await Payment.getPaymentById(referenceNumber) : null;

            if (!payment) {
                console.warn(`Payment failure webhook could not be matched: ${externalPaymentId}`);
            } else if (payment.status === 'failed') {
                console.log(`Duplicate failed webhook ignored for Payment ID: ${payment.id}`);
            } else if (payment.status === 'paid') {
                console.warn(`Ignored failed webhook for already paid Payment ID: ${payment.id}`);
            } else {
                await Payment.updatePayment(payment.id, {
                    status: 'failed',
                    paymongo_payment_id: externalPaymentId
                });
                await Appointment.updateAppointmentStatus(payment.appointment_id, 'cancelled');
                console.log(`Payment failed and appointment cancelled for Appointment ID: ${payment.appointment_id}`);
            }
        }

        res.status(200).json({ message: 'Webhook Received' });
    } catch (err) {
        console.error('Error handling webhook:', err);
        res.status(500).json({ error: 'Internal webhook error' });
    }
};

module.exports = {
    handleWebhook
};
