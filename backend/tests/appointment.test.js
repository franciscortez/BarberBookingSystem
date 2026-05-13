const request = require('supertest');
const app = require('../index');
const pool = require('../config/database');

describe('Appointment & Payment Integration API Endpoints', () => {
    let testBarberId;
    let testServiceId;
    let createdAppointmentId;

    beforeAll(async () => {
        // 1. Create a test barber
        const barberRes = await pool.query('INSERT INTO Barbers (name) VALUES ($1) RETURNING id', ['Appointment Test Barber']);
        testBarberId = barberRes.rows[0].id;

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
            service_name: 'Test Appointment Service',
            downpayment_amount: 100
        };

        const res = await request(app).post('/api/appointments').send(bookingData);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('appointment');
        expect(res.body.appointment.status).toBe('pending');
        expect(res.body.appointment.customer_name).toBe('John Doe');
        expect(res.body.checkout_url).toBe('https://test.paymongo.com/checkout?id=cs_test_mocked123');

        createdAppointmentId = res.body.appointment.id;

        // Verify that a Payment record was created
        const paymentRes = await pool.query('SELECT * FROM Payments WHERE appointment_id = $1', [createdAppointmentId]);
        expect(paymentRes.rows.length).toBe(1);
        expect(paymentRes.rows[0].status).toBe('pending');
        expect(paymentRes.rows[0].paymongo_checkout_id).toBe('cs_test_mocked123');
    });

    it('POST /api/appointments should return 409 for overlapping slots', async () => {
        const overlappingBookingData = {
            customer_name: 'Jane Smith',
            customer_phone: '09987654321',
            customer_email: 'jane@example.com',
            barber_id: testBarberId,
            service_id: testServiceId,
            appointment_date: '2027-01-01',
            start_time: '10:15:00', // Overlaps with 10:00 to 10:30
            service_name: 'Test Appointment Service',
            downpayment_amount: 100
        };

        const res = await request(app).post('/api/appointments').send(overlappingBookingData);
        
        expect(res.statusCode).toEqual(409);
        expect(res.body.error).toBe('The requested time slot is no longer available');
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

        // For testing, we might need to mock crypto or ensure the validation allows test env bypass, 
        // but the controller handles non-production missing signature by just logging a warning and proceeding (if implemented that way).
        // Let's send the expected signature to pass verification.
        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || 'test_secret';
        process.env.PAYMONGO_WEBHOOK_SECRET = webhookSecret;
        
        const payloadStr = timestamp + '.' + JSON.stringify(webhookPayload);
        const signature = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');
        const signatureHeader = `t=${timestamp},te=${signature},li=`;

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', signatureHeader)
            .send(webhookPayload);
        
        expect(res.statusCode).toEqual(200);

        // Verify status updates in DB
        const appointmentRes = await pool.query('SELECT status FROM Appointments WHERE id = $1', [createdAppointmentId]);
        expect(appointmentRes.rows[0].status).toBe('confirmed');

        const paymentRes = await pool.query('SELECT status, paymongo_payment_id FROM Payments WHERE appointment_id = $1', [createdAppointmentId]);
        expect(paymentRes.rows[0].status).toBe('paid');
        expect(paymentRes.rows[0].paymongo_payment_id).toBe('pay_test123');
    });

    it('POST /api/payments/webhook should handle payment.failed event', async () => {
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
                            status: 'failed'
                        }
                    }
                }
            }
        };

        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || 'test_secret';
        
        const payloadStr = timestamp + '.' + JSON.stringify(webhookPayload);
        const signature = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');
        const signatureHeader = `t=${timestamp},te=${signature},li=`;

        const res = await request(app)
            .post('/api/payments/webhook')
            .set('paymongo-signature', signatureHeader)
            .send(webhookPayload);
        
        expect(res.statusCode).toEqual(200);
        // The controller currently just logs for payment.failed, but we verify the endpoint responds with 200
    });
});

