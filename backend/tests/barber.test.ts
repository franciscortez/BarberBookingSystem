import request from 'supertest';
import app = require('../index');
import pool = require('../config/database');
import bcrypt from 'bcryptjs';

describe('Barber API Endpoints', () => {
  let token: string;
  const testAdmin = {
    username: `barbertest_${Date.now()}`,
    password: 'password123'
  };

  beforeAll(async () => {
    // Create a test admin directly in DB for testing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testAdmin.password, salt);
    await pool.query('INSERT INTO Admins (username, password_hash) VALUES ($1, $2)', [testAdmin.username, passwordHash]);
    
    const loginRes = await request(app).post('/api/auth/login').send(testAdmin);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup test admin
    await pool.query('DELETE FROM Admins WHERE username = $1', [testAdmin.username]);
  });

  // Test listing barbers
  it('GET /api/barbers should return all barbers', async () => {
    const res = await request(app).get('/api/barbers');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test creating a barber
  it('POST /api/barbers should create a new barber', async () => {
    const res = await request(app)
      .post('/api/barbers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Automated Test Barber' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Automated Test Barber');
    
    // Cleanup: we'll use the ID to delete it
    const barberId = res.body.id;
    await request(app)
      .delete(`/api/barbers/${barberId}`)
      .set('Authorization', `Bearer ${token}`);
  });

  // Test getting a specific barber
  it('GET /api/barbers/:id should return a barber if it exists', async () => {
    // First create one
    const createRes = await request(app)
      .post('/api/barbers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Find Me' });
    
    const barberId = createRes.body.id;
    
    const res = await request(app).get(`/api/barbers/${barberId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe('Find Me');
    
    // Cleanup
    await request(app)
      .delete(`/api/barbers/${barberId}`)
      .set('Authorization', `Bearer ${token}`);
  });

  // Test 404 for non-existent barber
  it('GET /api/barbers/:id should return 404 for non-existent ID', async () => {
    const res = await request(app).get('/api/barbers/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toEqual(404);
  });
});
