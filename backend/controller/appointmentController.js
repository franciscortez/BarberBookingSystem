const Appointment = require('../model/Appointment');
const Payment = require('../model/Payment');
const Availability = require('../model/Availability'); // for service duration
const crypto = require('crypto');
const paymongoConfig = require('../config/paymongo');
const pool = require('../config/database');

// Utility to create PayMongo Checkout Session
const createPayMongoCheckout = async (amount, description, customer_email, customer_name, customer_phone) => {
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
                description: description
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
            start_time,
            service_name,
            downpayment_amount
        } = req.body;

        // 1. Basic validation
        if (!customer_name || !customer_phone || !customer_email || !barber_id || !service_id || !appointment_date || !start_time || !downpayment_amount) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // 2. Determine end_time based on service duration
        const durationMins = await Availability.getServiceDuration(service_id);
        if (!durationMins) {
            return res.status(404).json({ error: 'Service not found or invalid duration' });
        }

        // Calculate end_time
        const startDateTime = new Date(`${appointment_date}T${start_time}`);
        const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000);
        const end_time = endDateTime.toTimeString().split(' ')[0]; // HH:MM:SS format

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
                amount: downpayment_amount,
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
            const description = `Downpayment for ${service_name || 'Service'} on ${appointment_date} at ${start_time}`;
            checkoutSession = await createPayMongoCheckout(
                downpayment_amount,
                description,
                customer_email,
                customer_name,
                customer_phone
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
            return res.status(502).json({ error: 'Booking recorded but failed to initialize payment gateway', details: paymongoErr.message });
        }

    } catch (err) {
        console.error('Unexpected error in createBooking:', err);
        res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
    }
};

module.exports = {
    createBooking
};
