const Appointment = require('../model/Appointment');
const Payment = require('../model/Payment');
const Service = require('../model/Service');
const crypto = require('crypto');
const paymongoConfig = require('../config/paymongo');
const pool = require('../config/database');
const {
    sendRescheduleConfirmationEmail,
    sendCancellationConfirmationEmail
} = require('../utils/emailService');

const appointmentDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const startTimePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const hasValidAppointmentDate = (appointmentDate) => {
    if (!appointmentDatePattern.test(appointmentDate)) {
        return false;
    }

    const [year, month, day] = appointmentDate.split('-').map(Number);
    const parsedDate = new Date(`${appointmentDate}T00:00:00`);

    return !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() + 1 === month &&
        parsedDate.getDate() === day;
};

const hasValidStartTime = (startTime) => startTimePattern.test(startTime);

const buildAppointmentEndTime = (appointmentDate, startTime, durationMins) => {
    const normalizedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const startDateTime = new Date(`${appointmentDate}T${normalizedStartTime}`);

    if (Number.isNaN(startDateTime.getTime())) {
        return null;
    }

    const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);
    return endDateTime.toTimeString().split(' ')[0];
};

const isConfirmedAppointment = (appointment) => appointment && appointment.status === 'confirmed';

// Utility to create PayMongo Checkout Session
const createPayMongoCheckout = async (amount, description, customer_email, customer_name, customer_phone, referenceNumber) => {
    const secretKey = paymongoConfig.secretKey;
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;


    // Amount should be in cents (e.g., PHP 100 = 10000 cents)
    const amountInCents = Math.round(amount * 100);

    const payload = {
        data: {
            attributes: {
                billing: {
                    email: customer_email,
                    name: customer_name,
                    phone: customer_phone
                },
                send_email_receipt: true,
                show_description: true,
                show_line_items: true,
                line_items: [
                    {
                        currency: 'PHP',
                        amount: amountInCents,
                        description: description,
                        name: 'Barber Appointment Downpayment',
                        quantity: 1
                    }
                ],
                payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
                description: description,
                reference_number: referenceNumber
            }
        }
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayMongo API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.data; // The checkout session object
};

/**
 * Handle booking creation and checkout initialization
 */
const createBooking = async (req, res) => {
    try {
        const {
            customer_name,
            customer_phone,
            customer_email,
            barber_id,
            service_id,
            appointment_date,
            start_time
        } = req.body;

        // 1. Basic validation
        if (!customer_name || !customer_phone || !customer_email || !barber_id || !service_id || !appointment_date || !start_time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const service = await Service.getServiceById(service_id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        if (service.barber_id !== barber_id) {
            return res.status(400).json({ error: 'Service does not belong to the selected barber' });
        }

        if (!hasValidAppointmentDate(appointment_date) || !hasValidStartTime(start_time)) {
            return res.status(400).json({ error: 'Invalid appointment date or start time' });
        }

        const durationMins = service.duration_mins;
        const end_time = buildAppointmentEndTime(appointment_date, start_time, durationMins);

        if (!end_time) {
            return res.status(400).json({ error: 'Invalid appointment date or start time' });
        }

        // Acquire a database client for the transaction
        const client = await pool.connect();
        let newAppointment, newPayment, checkoutSession;

        try {
            await client.query('BEGIN');

            // Lock the barber row to prevent concurrent bookings for the same barber
            await Appointment.lockBarber(barber_id, client);

            // 3. Double-check availability to prevent double-booking
            const isAvailable = await Appointment.isSlotAvailable(barber_id, appointment_date, start_time, end_time, client);
            if (!isAvailable) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(409).json({ error: 'The requested time slot is no longer available' });
            }

            // 4. Create pending Appointment
            const managementToken = crypto.randomUUID();
            newAppointment = await Appointment.createAppointment({
                customer_name,
                customer_phone,
                customer_email,
                barber_id,
                service_id,
                appointment_date,
                start_time,
                end_time,
                management_token: managementToken
            }, client);

            // 5. Create pending Payment record
            const idempotencyKey = crypto.randomUUID();
            newPayment = await Payment.createPayment({
                appointment_id: newAppointment.id,
                amount: service.downpayment_amount,
                idempotency_key: idempotencyKey
            }, client);

            await client.query('COMMIT');
        } catch (dbErr) {
            await client.query('ROLLBACK');
            client.release();
            console.error('Database transaction error:', dbErr);
            return res.status(500).json({ error: 'Failed to process booking in database', details: dbErr.message });
        }

        // Release client back to the pool
        client.release();

        try {
            // 6. Call PayMongo to create Checkout Session (Outside DB Transaction)
            const description = `Downpayment for ${service.name} on ${appointment_date} at ${start_time}`;
            checkoutSession = await createPayMongoCheckout(
                service.downpayment_amount,
                description,
                customer_email,
                customer_name,
                customer_phone,
                newPayment.id
            );

            // 7. Update Payment record with checkout ID
            await Payment.updatePayment(newPayment.id, {
                paymongo_checkout_id: checkoutSession.id
            });

            // 8. Return response
            res.status(201).json({
                message: 'Booking created and checkout session initialized',
                appointment: newAppointment,
                checkout_url: checkoutSession.attributes.checkout_url
            });
        } catch (paymongoErr) {
            console.error('PayMongo API error after DB insert:', paymongoErr);
            await Payment.updatePayment(newPayment.id, { status: 'failed' });
            await Appointment.updateAppointmentStatus(newAppointment.id, 'cancelled');
            return res.status(502).json({ error: 'Booking recorded but failed to initialize payment gateway', details: paymongoErr.message });
        }

    } catch (err) {
        console.error('Unexpected error in createBooking:', err);
        res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
    }
};

/**
 * Return confirmed booking details for the customer-management flow
 */
const getManagedBooking = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Management token is required' });
        }

        const appointment = await Appointment.getAppointmentByManagementToken(token);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (!isConfirmedAppointment(appointment)) {
            return res.status(409).json({ error: 'Only confirmed appointments can be managed' });
        }

        const fullDetails = await Appointment.getAppointmentDetails(appointment.id);
        return res.json(fullDetails);
    } catch (err) {
        console.error('Unexpected error in getManagedBooking:', err);
        return res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
    }
};

/**
 * Reschedule a confirmed booking by management token
 */
const rescheduleBooking = async (req, res) => {
    let client;

    try {
        const { token, appointment_date, start_time } = req.body;

        if (!token || !appointment_date || !start_time) {
            return res.status(400).json({ error: 'token, appointment_date, and start_time are required' });
        }

        if (!hasValidAppointmentDate(appointment_date) || !hasValidStartTime(start_time)) {
            return res.status(400).json({ error: 'Invalid appointment date or start time' });
        }

        client = await pool.connect();
        await client.query('BEGIN');

        const appointment = await Appointment.getAppointmentByManagementToken(token, client, true);
        if (!appointment) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (!isConfirmedAppointment(appointment)) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Only confirmed appointments can be managed' });
        }

        const service = await Service.getServiceById(appointment.service_id);
        if (!service) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Service not found' });
        }

        const end_time = buildAppointmentEndTime(appointment_date, start_time, service.duration_mins);
        if (!end_time) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid appointment date or start time' });
        }

        await Appointment.lockBarber(appointment.barber_id, client);

        const isAvailable = await Appointment.isSlotAvailable(
            appointment.barber_id,
            appointment_date,
            start_time,
            end_time,
            client,
            appointment.id
        );

        if (!isAvailable) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'The requested time slot is no longer available' });
        }

        const updatedAppointment = await Appointment.updateAppointmentSchedule(appointment.id, {
            appointment_date,
            start_time,
            end_time
        }, client);

        await client.query('COMMIT');

        const fullDetails = await Appointment.getAppointmentDetails(updatedAppointment.id);
        if (fullDetails) {
            await sendRescheduleConfirmationEmail(fullDetails);
        }

        return res.json({
            message: 'Appointment rescheduled successfully',
            appointment: fullDetails || updatedAppointment
        });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Unexpected error in rescheduleBooking:', err);
        return res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

/**
 * Cancel a confirmed booking by management token without refunding the down payment
 */
const cancelBooking = async (req, res) => {
    let client;

    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Management token is required' });
        }

        client = await pool.connect();
        await client.query('BEGIN');

        const appointment = await Appointment.getAppointmentByManagementToken(token, client, true);
        if (!appointment) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (!isConfirmedAppointment(appointment)) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Only confirmed appointments can be managed' });
        }

        const updatedAppointment = await Appointment.updateAppointmentStatus(appointment.id, 'cancelled', client);
        await client.query('COMMIT');

        const fullDetails = await Appointment.getAppointmentDetails(updatedAppointment.id);
        if (fullDetails) {
            await sendCancellationConfirmationEmail(fullDetails);
        }

        return res.json({
            message: 'Appointment cancelled successfully. Down payment is not refunded.',
            appointment: fullDetails || updatedAppointment
        });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Unexpected error in cancelBooking:', err);
        return res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = {
    createBooking,
    getManagedBooking,
    rescheduleBooking,
    cancelBooking
};
