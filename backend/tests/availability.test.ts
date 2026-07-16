import request from 'supertest';
import app = require('../index');
import pool = require('../config/database');

describe('Availability API Endpoints', () => {
    let barberId: string;
    let serviceId: string;
    const testDate = '2026-10-10';

    beforeAll(async () => {
        // Create a test barber
        const barberRes = await pool.query('INSERT INTO Barbers (name) VALUES ($1) RETURNING id', ['Test Barber Availability']);
        barberId = barberRes.rows[0].id;

        // Create a test service
        const serviceRes = await pool.query(`
            INSERT INTO Services (barber_id, name, description, total_price, downpayment_amount, duration_mins)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `, [barberId, 'Test Cut', 'Test Description', 500, 100, 60]);
        serviceId = serviceRes.rows[0].id;
    });

    afterAll(async () => {
        // Cleanup: Appointments first due to FK, then Service, then Barber
        await pool.query('DELETE FROM Appointments WHERE barber_id = $1', [barberId]);
        await pool.query('DELETE FROM Services WHERE barber_id = $1', [barberId]);
        await pool.query('DELETE FROM Barbers WHERE id = $1', [barberId]);
    });

    it('GET /api/availability should return all slots when no appointments exist', async () => {
        const res = await request(app)
            .get('/api/availability')
            .query({ barberId, date: testDate });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('availableSlots');
        expect(res.body).toHaveProperty('slots');
        expect(res.body.availableSlots.length).toBeGreaterThan(0);
        expect(res.body.slots.length).toBeGreaterThanOrEqual(res.body.availableSlots.length);
        expect(res.headers['cache-control']).toBe('no-store');
    });

    it('GET /api/availability should exclude occupied slots', async () => {
        // Create an appointment from 10:00 to 11:00
        await pool.query(`
            INSERT INTO Appointments 
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, ['Test Cust', '09123', 'test@test.com', barberId, serviceId, testDate, '10:00:00', '11:00:00', 'confirmed', '550e8400-e29b-41d4-a716-446655440000']);

        const res = await request(app)
            .get('/api/availability')
            .query({ barberId, date: testDate, serviceId });

        expect(res.statusCode).toEqual(200);
        
        // Slot starting at 10:00 and 10:30 should be unavailable if duration is 60 mins (since 10:00-11:00 is occupied)
        // Check if 10:00 is missing
        const isTenAvailable = res.body.availableSlots.some((slot: any) => slot.start === '10:00');
        const isTenThirtyAvailable = res.body.availableSlots.some((slot: any) => slot.start === '10:30');
        const isNineAvailable = res.body.availableSlots.some((slot: any) => slot.start === '09:00');
        const tenSlot = res.body.slots.find((slot: any) => slot.start === '10:00');
        const nineSlot = res.body.slots.find((slot: any) => slot.start === '09:00');

        expect(isTenAvailable).toBe(false);
        expect(isTenThirtyAvailable).toBe(false);
        expect(isNineAvailable).toBe(true);
        expect(tenSlot.available).toBe(false);
        expect(tenSlot.unavailableReason).toBe('booked');
        expect(nineSlot.available).toBe(true);
    });

    it('GET /api/availability should ignore expired pending appointments', async () => {
        await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP - INTERVAL '16 minutes')
        `, ['Expired Pending', '09123', 'expired@test.com', barberId, serviceId, testDate, '12:00:00', '13:00:00', 'pending', '550e8400-e29b-41d4-a716-446655440100']);

        const res = await request(app)
            .get('/api/availability')
            .query({ barberId, date: testDate, serviceId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.availableSlots.some((slot: any) => slot.start === '12:00')).toBe(true);
        expect(res.body.slots.find((slot: any) => slot.start === '12:00').available).toBe(true);
    });

    it('GET /api/availability should keep fresh pending appointments unavailable', async () => {
        await pool.query(`
            INSERT INTO Appointments
            (customer_name, customer_phone, customer_email, barber_id, service_id, appointment_date, start_time, end_time, status, management_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, ['Fresh Pending', '09123', 'fresh@test.com', barberId, serviceId, testDate, '13:00:00', '14:00:00', 'pending', '550e8400-e29b-41d4-a716-446655440101']);

        const res = await request(app)
            .get('/api/availability')
            .query({ barberId, date: testDate, serviceId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.availableSlots.some((slot: any) => slot.start === '13:00')).toBe(false);
        expect(res.body.slots.find((slot: any) => slot.start === '13:00').available).toBe(false);
    });

    it('GET /api/availability should return 400 if params missing', async () => {
        const res = await request(app).get('/api/availability');
        expect(res.statusCode).toEqual(400);
    });
});
