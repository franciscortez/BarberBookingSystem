import request from 'supertest';
import app = require('../index');
import pool = require('../config/database');
import bcrypt from 'bcryptjs';

describe('Service API Endpoints', () => {
  let token: string;
  let testBarberId: string;
  const testAdmin = {
    name: `Service Test Admin ${Date.now()}`,
    email: `servicetest_${Date.now()}@test.com`,
    phone: '09000000000',
    password: 'password123'
  };

  beforeAll(async () => {
    // 1. Create a test admin directly in DB for testing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testAdmin.password, salt);
    await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [testAdmin.name, testAdmin.email, testAdmin.phone, passwordHash, 'admin']
    );
    
    // 2. Login to get token
    const loginRes = await request(app).post('/api/auth/login').send({
      identifier: testAdmin.email,
      password: testAdmin.password
    });
    token = loginRes.body.token;

    // 3. Create a test barber to associate services with
    const barberRes = await request(app)
      .post('/api/barbers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Service Test Barber' });
    testBarberId = barberRes.body.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testBarberId) {
      await pool.query('DELETE FROM barbers WHERE id = $1', [testBarberId]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [testAdmin.email]);
  });

  // Test Listing Services (Public)
  it('GET /api/services should return all services', async () => {
    const res = await request(app).get('/api/services');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test Creating a Service (Protected)
  it('POST /api/services should create a new service', async () => {
    const newService = {
      barber_id: testBarberId,
      name: 'Test Haircut',
      description: 'A test haircut service',
      total_price: 500.00,
      downpayment_amount: 100.00,
      duration_mins: 30
    };

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send(newService);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(newService.name);
    expect(parseFloat(res.body.total_price)).toBe(newService.total_price);
  });

  // Test Filtering by Barber
  it('GET /api/services?barberId=... should filter services', async () => {
    const res = await request(app).get(`/api/services?barberId=${testBarberId}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0].barber_id).toBe(testBarberId);
    }
  });

  // Test Getting a Specific Service
  it('GET /api/services/:id should return a service if it exists', async () => {
    // Create one first
    const createRes = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        barber_id: testBarberId,
        name: 'Single Service Test',
        total_price: 300,
        downpayment_amount: 50,
        duration_mins: 20
      });
    
    const serviceId = createRes.body.id;
    
    const res = await request(app).get(`/api/services/${serviceId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe('Single Service Test');
  });

  // Test Updating a Service
  it('PUT /api/services/:id should update service details', async () => {
     // Create one first
     const createRes = await request(app)
     .post('/api/services')
     .set('Authorization', `Bearer ${token}`)
     .send({
       barber_id: testBarberId,
       name: 'Original Name',
       total_price: 300,
       downpayment_amount: 50,
       duration_mins: 20
     });
    
    const serviceId = createRes.body.id;

    const res = await request(app)
      .put(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        total_price: 350,
        downpayment_amount: 60,
        duration_mins: 25
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe('Updated Name');
    expect(parseFloat(res.body.total_price)).toBe(350);
  });

  // Test Deleting a Service
  it('DELETE /api/services/:id should remove the service', async () => {
    const createRes = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        barber_id: testBarberId,
        name: 'To Be Deleted',
        total_price: 100,
        downpayment_amount: 20,
        duration_mins: 10
      });
    
    const serviceId = createRes.body.id;

    const res = await request(app)
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Service removed successfully');

    // Verify deletion
    const verifyRes = await request(app).get(`/api/services/${serviceId}`);
    expect(verifyRes.statusCode).toEqual(404);
  });

  // Test Error Cases
  it('POST /api/services without token should return 401', async () => {
    const res = await request(app)
      .post('/api/services')
      .send({ name: 'Unauthorized' });
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/services/:id with invalid ID should return 404', async () => {
    const res = await request(app).get('/api/services/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toEqual(404);
  });

  it('POST /api/services with missing fields should return 400', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Missing Fields' });
    expect(res.statusCode).toEqual(400);
  });
});
