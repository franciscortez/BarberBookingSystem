const request = require('supertest');
jest.mock('../utils/emailService', () => ({
    sendConfirmationEmail: jest.fn(() => Promise.resolve()),
    sendRescheduleConfirmationEmail: jest.fn(() => Promise.resolve()),
    sendCancellationConfirmationEmail: jest.fn(() => Promise.resolve())
}));

const app = require('../index');
const pool = require('../config/database');
const {
    sendConfirmationEmail,
    sendRescheduleConfirmationEmail,
    sendCancellationConfirmationEmail
} = require('../utils/emailService');
const { flushEmailJobs } = require('../utils/emailQueue');
const paymongoConfig = require('../config/paymongo');
const Payment = require('../model/Payment');

describe('Appointment & Payment Integration API Endpoints', () => {
    let testBarberId;
    let otherBarberId;
    let testServiceId;
    let createdAppointmentId;
    let createdManagementToken;

    beforeAll(async () => {
        process.env.FRONTEND_URL = 'https://frontend.example.com/';

        // 1. Create a test barber
        const barberRes = await pool.query('INSERT INTO Barbers (name) VALUES ($1) RETURNING id', ['Appointment Test Barber']);
        testBarberId = barberRes.rows[0].id;

        const otherBarberRes = await pool.query('INSERT INTO Barbers (name) VALUES ($1) RETURNING id', ['Other Appointment Test Barber']);
        otherBarberId = otherBarberRes.rows[0].id;

        // 2. Create a test service
        const serviceRes = await pool.query(`
            INSERT INTO Services (barber_id, name, description, total_price, downpayment_amount, duration_mins)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `, [testBarberId, 'Test Appointment Service', 'Desc', 500, 100, 30]);
        testServiceId = serviceRes.rows[0].id;

        // Mock global fetch for PayMongo API
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    data: {
                        id: 'cs_test_mocked123',
                        attributes: {
                            checkout_url: 'https://test.paymongo.com/checkout?id=cs_test_mocked123'
                        }
                    }
                })
            })
        );
    });

    afterAll(async () => {
        // Cleanup test data
        await pool.query('DELETE FROM Barbers WHERE id = $1', [testBarberId]);
        await pool.query('DELETE FROM Barbers WHERE id = $1', [otherBarberId]);
        // Services, Appointments, and Payments should cascade delete
        
        // Restore global fetch
        jest.restoreAllMocks();
    });

    it('POST /api/appointments should create a booking and initialize checkout', async () => {
        const bookingData = {
            customer_name: 'John Doe',
            customer_phone: '09123456789',
            customer_email: 'john@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-01',
            start_time: '10:00:00',
            service_name: 'Tampered Name',
            downpayment_amount: 1
        };

        const res = await request(app).post('/api/appointments').send(bookingData);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('appointment');
        expect(res.body.appointment.status).toBe('pending');
        expect(res.body.appointment.customer_name).toBe('John Doe');
        expect(res.body.checkout_url).toBe('https://test.paymongo.com/checkout?id=cs_test_mocked123');

        createdAppointmentId = res.body.appointment.id;
        createdManagementToken = res.body.appointment.management_token;

        // Verify that a Payment record was created
        const paymentRes = await pool.query('SELECT * FROM Payments WHERE appointment_id = $1', [createdAppointmentId]);
        expect(paymentRes.rows.length).toBe(1);
        expect(paymentRes.rows[0].status).toBe('pending');
        expect(paymentRes.rows[0].paymongo_checkout_id).toBe('cs_test_mocked123');
        expect(parseFloat(paymentRes.rows[0].amount)).toBe(100);

        const checkoutRequest = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(checkoutRequest.data.attributes.description).toContain('Test Appointment Service');
        expect(checkoutRequest.data.attributes.line_items[0].amount).toBe(10000);
        expect(checkoutRequest.data.attributes.reference_number).toBe(paymentRes.rows[0].id);
        expect(checkoutRequest.data.attributes.success_url).toBe(`https://frontend.example.com/success?token=${createdManagementToken}`);
        expect(checkoutRequest.data.attributes.cancel_url).toBe('https://frontend.example.com/book');
    });

    it('POST /api/appointments should return 409 for overlapping slots', async () => {
        const overlappingBookingData = {
            customer_name: 'Jane Smith',
            customer_phone: '09987654321',
            customer_email: 'jane@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-01',
            start_time: '10:00:00', // Exact overlap with 10:00 to 10:30
            service_name: 'Test Appointment Service',
            downpayment_amount: 100
        };

        const res = await request(app).post('/api/appointments').send(overlappingBookingData);
        
        expect(res.statusCode).toEqual(409);
        expect(res.body.error).toBe('The requested time slot is no longer available');
    });

    it('POST /api/appointments should allow rebooking an expired pending slot', async () => {
        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    data: {
                        id: 'cs_test_expired_rebook',
                        attributes: {
                            checkout_url: 'https://test.paymongo.com/checkout?id=cs_test_expired_rebook'
                        }
                    }
                })
            })
        );

        await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP - INTERVAL '16 minutes')
        `, ['Expired Pending Cust', '09123', 'expired-booking@test.com', testBarberId, testServiceId, '2027-01-08', '10:00:00', '10:30:00', 'pending', '550e8400-e29b-41d4-a716-446655440110']);

        const res = await request(app).post('/api/appointments').send({
            customer_name: 'New Booking',
            customer_phone: '09123456789',
            customer_email: 'new-booking@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-08',
            start_time: '10:00:00'
        });

        expect(res.statusCode).toEqual(201);
        expect(res.body.appointment.status).toBe('pending');
    });

    it('POST /api/appointments should reject services that do not belong to the selected barber', async () => {
        const res = await request(app).post('/api/appointments').send({
            customer_name: 'Wrong Barber',
            customer_phone: '09123456789',
            customer_email: 'wrong@example.com',
            barber_id: otherBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-02',
            start_time: '10:00:00'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Service does not belong to the selected barber');
    });

    it('POST /api/appointments should reject malformed appointment times', async () => {
        const res = await request(app).post('/api/appointments').send({
            customer_name: 'Invalid Time',
            customer_phone: '09123456789',
            customer_email: 'invalid@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-02',
            start_time: 'not-a-time'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Invalid appointment date or start time');
    });

    it('POST /api/appointments should reject past appointment starts', async () => {
        const res = await request(app).post('/api/appointments').send({
            customer_name: 'Past Time',
            customer_phone: '09123456789',
            customer_email: 'past@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2025-01-01',
            start_time: '10:00:00'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Appointment start time must be in the future');
    });

    it('POST /api/appointments should reject start times outside working hours', async () => {
        const res = await request(app).post('/api/appointments').send({
            customer_name: 'Before Hours',
            customer_phone: '09123456789',
            customer_email: 'before-hours@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-10',
            start_time: '08:30:00'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Appointment must fit within working hours');
    });

    it('POST /api/appointments should reject non-30-minute start times', async () => {
        const res = await request(app).post('/api/appointments').send({
            customer_name: 'Invalid Interval',
            customer_phone: '09123456789',
            customer_email: 'invalid-interval@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-10',
            start_time: '10:15:00'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Appointment start time must use a 30-minute slot');
    });

    it('POST /api/appointments should reject slots that end after closing', async () => {
        const res = await request(app).post('/api/appointments').send({
            customer_name: 'After Closing',
            customer_phone: '09123456789',
            customer_email: 'after-closing@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-10',
            start_time: '18:00:00'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Appointment must fit within working hours');
    });

    it('POST /api/appointments should cancel the appointment if checkout creation fails', async () => {
        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ errors: [{ detail: 'gateway unavailable' }] })
            })
        );

        const res = await request(app).post('/api/appointments').send({
            customer_name: 'Checkout Failure',
            customer_phone: '09123456789',
            customer_email: 'failure@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-03',
            start_time: '10:00:00'
        });

        expect(res.statusCode).toEqual(502);

        const appointmentRes = await pool.query(`
            SELECT a.status, p.status AS payment_status
            FROM Appointments a
            JOIN Payments p ON p.appointment_id = a.id
            WHERE a.customer_email = $1
        `, ['failure@example.com']);

        expect(appointmentRes.rows[0].status).toBe('cancelled');
        expect(appointmentRes.rows[0].payment_status).toBe('failed');
    });

    it('POST /api/payments/webhook should process successful payment event', async () => {
        const webhookPayload = {
            data: {
                id: 'evt_test123',
                attributes: {
                    type: 'checkout_session.payment.paid',
                    data: {
                        id: 'cs_test_mocked123',
                        type: 'checkout_session',
                        attributes: {
                            payments: [{ id: 'pay_test123' }]
                        }
                    }
                }
            }
        };

        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadBody = JSON.stringify(webhookPayload);
        const webhookSecret = paymongoConfig.webhookSecret;
        const payloadStr = timestamp + '.' + payloadBody;
        const signature = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');
        const signatureHeader = `t=${timestamp},te=${signature},li=`;

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', signatureHeader)
            .set('Content-Type', 'application/json')
            .send(payloadBody);
        
        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();

        // Verify status updates in DB
        const appointmentRes = await pool.query('SELECT status FROM Appointments WHERE id = $1', [createdAppointmentId]);
        expect(appointmentRes.rows[0].status).toBe('confirmed');

        const paymentRes = await pool.query('SELECT id, status, paymongo_payment_id FROM Payments WHERE appointment_id = $1', [createdAppointmentId]);
        expect(paymentRes.rows[0].status).toBe('paid');
        expect(paymentRes.rows[0].paymongo_payment_id).toBe('pay_test123');
        expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
        expect(sendConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
            payment_reference_number: paymentRes.rows[0].id,
            paymongo_checkout_id: 'cs_test_mocked123',
            paymongo_payment_id: 'pay_test123'
        }));
    });

    it('POST /api/payments/webhook should ignore duplicate successful payment events', async () => {
        const webhookPayload = {
            data: {
                id: 'evt_test_duplicate',
                attributes: {
                    type: 'checkout_session.payment.paid',
                    data: {
                        id: 'cs_test_mocked123',
                        type: 'checkout_session',
                        attributes: {
                            payments: [{ id: 'pay_test123' }]
                        }
                    }
                }
            }
        };

        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadBody = JSON.stringify(webhookPayload);
        const payloadStr = timestamp + '.' + payloadBody;
        const signature = crypto.createHmac('sha256', paymongoConfig.webhookSecret).update(payloadStr).digest('hex');

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', `t=${timestamp},te=${signature},li=`)
            .set('Content-Type', 'application/json')
            .send(payloadBody);

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();
        expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
    });

    it('POST /api/payments/webhook should not confirm a late paid appointment when the slot was rebooked', async () => {
        const lateAppointmentRes = await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP - INTERVAL '16 minutes')
            RETURNING id
        `, ['Late Paid Cust', '09123', 'late-paid@test.com', testBarberId, testServiceId, '2027-01-09', '10:00:00', '10:30:00', 'pending', '550e8400-e29b-41d4-a716-446655440120']);

        await pool.query(`
            INSERT INTO Payments (appointment_id, paymongo_checkout_id, amount, idempotency_key)
            VALUES ($1, $2, $3, $4)
        `, [lateAppointmentRes.rows[0].id, 'cs_test_late_paid', 100, '550e8400-e29b-41d4-a716-446655440121']);

        await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, ['Rebooked Cust', '09123', 'rebooked@test.com', testBarberId, testServiceId, '2027-01-09', '10:00:00', '10:30:00', 'confirmed', '550e8400-e29b-41d4-a716-446655440122']);

        const emailCallsBefore = sendConfirmationEmail.mock.calls.length;
        const webhookPayload = {
            data: {
                id: 'evt_test_late_paid',
                attributes: {
                    type: 'checkout_session.payment.paid',
                    data: {
                        id: 'cs_test_late_paid',
                        type: 'checkout_session',
                        attributes: {
                            payments: [{ id: 'pay_late_paid' }]
                        }
                    }
                }
            }
        };

        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadBody = JSON.stringify(webhookPayload);
        const payloadStr = timestamp + '.' + payloadBody;
        const signature = crypto.createHmac('sha256', paymongoConfig.webhookSecret).update(payloadStr).digest('hex');

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', `t=${timestamp},te=${signature},li=`)
            .set('Content-Type', 'application/json')
            .send(payloadBody);

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();

        const appointmentRes = await pool.query('SELECT status FROM Appointments WHERE id = $1', [lateAppointmentRes.rows[0].id]);
        expect(appointmentRes.rows[0].status).toBe('cancelled');

        const paymentRes = await pool.query('SELECT status, paymongo_payment_id FROM Payments WHERE appointment_id = $1', [lateAppointmentRes.rows[0].id]);
        expect(paymentRes.rows[0].status).toBe('paid');
        expect(paymentRes.rows[0].paymongo_payment_id).toBe('pay_late_paid');
        expect(sendConfirmationEmail.mock.calls.length).toBe(emailCallsBefore);
    });

    it('POST /api/payments/webhook should still succeed if confirmation email fails', async () => {
        const emailFailureAppointmentRes = await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, ['Email Failure Cust', '09123', 'email-failure@test.com', testBarberId, testServiceId, '2027-01-05', '10:00:00', '10:30:00', 'pending', '550e8400-e29b-41d4-a716-446655440020']);

        await pool.query(`
            INSERT INTO Payments (appointment_id, paymongo_checkout_id, amount, idempotency_key)
            VALUES ($1, $2, $3, $4)
        `, [emailFailureAppointmentRes.rows[0].id, 'cs_test_email_failure', 100, '550e8400-e29b-41d4-a716-446655440021']);

        sendConfirmationEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));

        const webhookPayload = {
            data: {
                id: 'evt_test_email_failure',
                attributes: {
                    type: 'checkout_session.payment.paid',
                    data: {
                        id: 'cs_test_email_failure',
                        type: 'checkout_session',
                        attributes: {
                            payments: [{ id: 'pay_email_failure' }]
                        }
                    }
                }
            }
        };

        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadBody = JSON.stringify(webhookPayload);
        const payloadStr = timestamp + '.' + payloadBody;
        const signature = crypto.createHmac('sha256', paymongoConfig.webhookSecret).update(payloadStr).digest('hex');

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', `t=${timestamp},te=${signature},li=`)
            .set('Content-Type', 'application/json')
            .send(payloadBody);

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();

        const appointmentRes = await pool.query('SELECT status FROM Appointments WHERE id = $1', [emailFailureAppointmentRes.rows[0].id]);
        expect(appointmentRes.rows[0].status).toBe('confirmed');
    });

    it('POST /api/payments/webhook should not partially update appointment state if payment update fails', async () => {
        const rollbackAppointmentRes = await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, ['Rollback Cust', '09123', 'rollback@test.com', testBarberId, testServiceId, '2027-01-11', '10:00:00', '10:30:00', 'pending', '550e8400-e29b-41d4-a716-446655440130']);

        await pool.query(`
            INSERT INTO Payments (appointment_id, paymongo_checkout_id, amount, idempotency_key)
            VALUES ($1, $2, $3, $4)
        `, [rollbackAppointmentRes.rows[0].id, 'cs_test_rollback', 100, '550e8400-e29b-41d4-a716-446655440131']);

        const updateSpy = jest.spyOn(Payment, 'updatePayment').mockRejectedValueOnce(new Error('simulated payment update failure'));

        const webhookPayload = {
            data: {
                id: 'evt_test_rollback',
                attributes: {
                    type: 'checkout_session.payment.paid',
                    data: {
                        id: 'cs_test_rollback',
                        type: 'checkout_session',
                        attributes: {
                            payments: [{ id: 'pay_rollback' }]
                        }
                    }
                }
            }
        };

        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadBody = JSON.stringify(webhookPayload);
        const payloadStr = timestamp + '.' + payloadBody;
        const signature = crypto.createHmac('sha256', paymongoConfig.webhookSecret).update(payloadStr).digest('hex');

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', `t=${timestamp},te=${signature},li=`)
            .set('Content-Type', 'application/json')
            .send(payloadBody);

        updateSpy.mockRestore();

        expect(res.statusCode).toEqual(500);

        const appointmentRes = await pool.query('SELECT status FROM Appointments WHERE id = $1', [rollbackAppointmentRes.rows[0].id]);
        expect(appointmentRes.rows[0].status).toBe('pending');

        const paymentRes = await pool.query('SELECT status, paymongo_payment_id FROM Payments WHERE appointment_id = $1', [rollbackAppointmentRes.rows[0].id]);
        expect(paymentRes.rows[0].status).toBe('pending');
        expect(paymentRes.rows[0].paymongo_payment_id).toBeNull();
    });

    it('GET /api/appointments/manage should return confirmed booking details by token', async () => {
        const res = await request(app)
            .get('/api/appointments/manage')
            .query({ token: createdManagementToken });

        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toBe(createdAppointmentId);
        expect(res.body.status).toBe('confirmed');
        expect(res.body.service_name).toBe('Test Appointment Service');
        expect(res.body.payment_reference_number).toBeDefined();
        expect(res.body.paymongo_checkout_id).toBe('cs_test_mocked123');
    });

    it('POST /api/appointments/reschedule should reject slots that end after closing', async () => {
        const res = await request(app)
            .post('/api/appointments/reschedule')
            .send({
                token: createdManagementToken,
                appointment_date: '2027-01-02',
                start_time: '18:00:00'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Appointment must fit within working hours');
    });

    it('POST /api/appointments/reschedule should move a confirmed booking and send email', async () => {
        const res = await request(app)
            .post('/api/appointments/reschedule')
            .send({
                token: createdManagementToken,
                appointment_date: '2027-01-02',
                start_time: '11:00:00'
            });

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();
        expect(res.body.message).toBe('Appointment rescheduled successfully');
        expect(res.body.appointment.appointment_date).toMatch(/^2027-01-02/);
        expect(res.body.appointment.start_time).toBe('11:00:00');
        expect(res.body.appointment.end_time).toBe('11:30:00');
        expect(sendRescheduleConfirmationEmail).toHaveBeenCalledTimes(1);
    });

    it('POST /api/appointments/reschedule should ignore the booking itself in overlap checks', async () => {
        const res = await request(app)
            .post('/api/appointments/reschedule')
            .send({
                token: createdManagementToken,
                appointment_date: '2027-01-02',
                start_time: '11:00:00'
            });

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();
        expect(sendRescheduleConfirmationEmail).toHaveBeenCalledTimes(2);
    });

    it('POST /api/appointments/reschedule should reject occupied slots', async () => {
        await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, ['Conflict Cust', '09123', 'conflict@test.com', testBarberId, testServiceId, '2027-01-02', '12:00:00', '12:30:00', 'confirmed', '550e8400-e29b-41d4-a716-446655440010']);

        const res = await request(app)
            .post('/api/appointments/reschedule')
            .send({
                token: createdManagementToken,
                appointment_date: '2027-01-02',
                start_time: '12:00:00'
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body.error).toBe('The requested time slot is no longer available');
    });

    it('POST /api/appointments/cancel should cancel without refunding the paid down payment', async () => {
        const res = await request(app)
            .post('/api/appointments/cancel')
            .send({ token: createdManagementToken });

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();
        expect(res.body.message).toBe('Appointment cancelled successfully. Down payment is not refunded.');
        expect(res.body.appointment.status).toBe('cancelled');
        expect(sendCancellationConfirmationEmail).toHaveBeenCalledTimes(1);

        const paymentRes = await pool.query('SELECT status FROM Payments WHERE appointment_id = $1', [createdAppointmentId]);
        expect(paymentRes.rows[0].status).toBe('paid');
    });

    it('POST /api/appointments/reschedule should still succeed if email fails', async () => {
        const token = '550e8400-e29b-41d4-a716-446655440030';
        await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, ['Reschedule Email Failure', '09123', 'reschedule-email-failure@test.com', testBarberId, testServiceId, '2027-01-06', '10:00:00', '10:30:00', 'confirmed', token]);

        sendRescheduleConfirmationEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));

        const res = await request(app)
            .post('/api/appointments/reschedule')
            .send({
                token,
                appointment_date: '2027-01-06',
                start_time: '11:00:00'
            });

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();
        expect(res.body.appointment.appointment_date).toMatch(/^2027-01-06/);
        expect(res.body.appointment.start_time).toBe('11:00:00');
    });

    it('POST /api/appointments/cancel should still succeed if email fails', async () => {
        const token = '550e8400-e29b-41d4-a716-446655440040';
        await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, ['Cancel Email Failure', '09123', 'cancel-email-failure@test.com', testBarberId, testServiceId, '2027-01-07', '10:00:00', '10:30:00', 'confirmed', token]);

        sendCancellationConfirmationEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));

        const res = await request(app)
            .post('/api/appointments/cancel')
            .send({ token });

        expect(res.statusCode).toEqual(200);
        await flushEmailJobs();
        expect(res.body.appointment.status).toBe('cancelled');
    });

    it('GET /api/appointments/manage should reject cancelled bookings', async () => {
        const res = await request(app)
            .get('/api/appointments/manage')
            .query({ token: createdManagementToken });

        expect(res.statusCode).toEqual(409);
        expect(res.body.error).toBe('Only confirmed appointments can be managed');
    });

    it('POST /api/payments/webhook should reject invalid signatures', async () => {
        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', 't=123,te=invalid,li=')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ data: {} }));

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Invalid webhook signature');
    });

    it('POST /api/payments/webhook should reject missing signatures', async () => {
        const res = await request(app)
            .post('/api/payments/webhook')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ data: {} }));

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Missing PayMongo signature header');
    });

    it('POST /api/payments/webhook should handle payment.failed event', async () => {
        const failedAppointmentRes = await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, ['Failed Cust', '09123', 'failed@test.com', testBarberId, testServiceId, '2027-01-04', '10:00:00', '10:30:00', 'pending', '550e8400-e29b-41d4-a716-446655440001']);

        const failedPaymentRes = await pool.query(`
            INSERT INTO Payments (appointment_id, amount, idempotency_key)
            VALUES ($1, $2, $3)
            RETURNING id
        `, [failedAppointmentRes.rows[0].id, 100, '550e8400-e29b-41d4-a716-446655440002']);

        const webhookPayload = {
            data: {
                id: 'evt_test_failed',
                attributes: {
                    type: 'payment.failed',
                    data: {
                        id: 'pay_test_failed',
                        type: 'payment',
                        attributes: {
                            amount: 10000,
                            status: 'failed',
                            external_reference_number: failedPaymentRes.rows[0].id
                        }
                    }
                }
            }
        };

        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadBody = JSON.stringify(webhookPayload);
        const payloadStr = timestamp + '.' + payloadBody;
        const signature = crypto.createHmac('sha256', paymongoConfig.webhookSecret).update(payloadStr).digest('hex');
        const signatureHeader = `t=${timestamp},te=${signature},li=`;

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', signatureHeader)
            .set('Content-Type', 'application/json')
            .send(payloadBody);
        
        expect(res.statusCode).toEqual(200);

        const appointmentRes = await pool.query('SELECT status FROM Appointments WHERE id = $1', [failedAppointmentRes.rows[0].id]);
        expect(appointmentRes.rows[0].status).toBe('cancelled');

        const paymentRes = await pool.query('SELECT status, paymongo_payment_id FROM Payments WHERE id = $1', [failedPaymentRes.rows[0].id]);
        expect(paymentRes.rows[0].status).toBe('failed');
        expect(paymentRes.rows[0].paymongo_payment_id).toBe('pay_test_failed');
    });
});
