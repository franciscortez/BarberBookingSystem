const request = require('supertest');
const app = require('../index');
const pool = require('../config/database');

describe('Catalog API Endpoint', () => {
    let barberId;

    beforeAll(async () => {
        const barberRes = await pool.query(
            'INSERT INTO Barbers (name) VALUES ($1) RETURNING id',
            ['Catalog Test Barber']
        );
        barberId = barberRes.rows[0].id;

        await pool.query(`
            INSERT INTO Services (barber_id, name, description, total_price, downpayment_amount, duration_mins)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [barberId, 'Catalog Test Service', 'Catalog test description', 500, 100, 30]);
    });

    afterAll(async () => {
        await pool.query('DELETE FROM Barbers WHERE id = $1', [barberId]);
    });

    it('GET /api/catalog should return barbers and services together', async () => {
        const res = await request(app).get('/api/catalog');

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.barbers)).toBe(true);
        expect(Array.isArray(res.body.services)).toBe(true);
        expect(res.body.barbers.some(barber => barber.id === barberId)).toBe(true);
        expect(res.body.services.some(service => service.barber_id === barberId)).toBe(true);
        expect(res.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=300');
    });
});
