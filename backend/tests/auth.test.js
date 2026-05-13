const request = require('supertest');
const app = require('../index');
const pool = require('../config/database');

describe('Authentication and Protected Routes', () => {
    let token;
    const testAdmin = {
        username: `testadmin_${Date.now()}`,
        password: 'password123'
    };

    beforeAll(async () => {
        // Create a test admin directly in DB for testing login
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(testAdmin.password, salt);
        await pool.query('INSERT INTO Admins (username, password_hash) VALUES ($1, $2)', [testAdmin.username, passwordHash]);
    });

    afterAll(async () => {
        // Cleanup test admin
        await pool.query('DELETE FROM Admins WHERE username = $1', [testAdmin.username]);
    });

    it('should login the admin and return a JWT', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send(testAdmin);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('should fail to access protected routes without token', async () => {
        const res = await request(app)
            .post('/api/barbers')
            .send({ name: 'Unauthorized Barber' });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.error).toBe('No token, authorization denied');
    });

    it('should fail to access protected routes with invalid token', async () => {
        const res = await request(app)
            .post('/api/barbers')
            .set('Authorization', 'Bearer invalid_token')
            .send({ name: 'Unauthorized Barber' });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.error).toBe('Token is not valid');
    });

    it('should access protected routes with valid token', async () => {
        const res = await request(app)
            .post('/api/barbers')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Authorized Barber' });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.name).toBe('Authorized Barber');

        // Cleanup
        const barberId = res.body.id;
        await request(app)
            .delete(`/api/barbers/${barberId}`)
            .set('Authorization', `Bearer ${token}`);
    });
});
