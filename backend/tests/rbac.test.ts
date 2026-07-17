import request from "supertest";
import app = require("../index");
import pool = require("../config/database");
import bcrypt from "bcryptjs";

describe("RBAC and Multi-Role Authentication", () => {
  const testUser = {
    name: "Test Customer",
    email: `customer_${Date.now()}@example.com`,
    phone: "09123456789",
    password: "userpassword123",
  };

  const testAdmin = {
    username: `rbacadmin_${Date.now()}`,
    password: "adminpassword123",
  };

  const testBarberEmail = `barber_${Date.now()}@example.com`;
  const testBarberPassword = "barberpassword123";
  let barberId: string;

  let userCookie: string;
  let barberCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    // 1. Create Admin directly in users table
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash(testAdmin.password, salt);
    await pool.query(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)",
      [
        testAdmin.username,
        `${testAdmin.username}@example.com`,
        "0000000000",
        adminHash,
        "admin",
      ],
    );

    // 2. Create Barber user and barber record
    const barberHash = await bcrypt.hash(testBarberPassword, salt);
    const userRes = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      ["RBAC Barber", testBarberEmail, "09999999999", barberHash, "barber"],
    );
    const res = await pool.query(
      "INSERT INTO barbers (user_id, name, email) VALUES ($1, $2, $3) RETURNING id",
      [userRes.rows[0].id, "RBAC Barber", testBarberEmail],
    );
    barberId = res.rows[0].id;
  });

  afterAll(async () => {
    await pool.query(
      "DELETE FROM users WHERE email = $1 OR email = $2 OR name = $3",
      [testUser.email, testBarberEmail, testAdmin.username],
    );
    if (barberId) {
      await pool.query("DELETE FROM barbers WHERE id = $1", [barberId]);
    }
  });

  it("should register a new user and set token cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.role).toBe("user");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=/);
    userCookie = cookies[0];
  });

  it("should login as user and get role user", async () => {
    const res = await request(app)
      .post("/api/auth/user/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("user");
  });

  it("should login as barber and get role barber", async () => {
    const res = await request(app)
      .post("/api/auth/barber/login")
      .send({ email: testBarberEmail, password: testBarberPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("barber");

    const cookies = res.headers["set-cookie"];
    barberCookie = cookies[0];
  });

  it("should login as admin and get role admin", async () => {
    const res = await request(app).post("/api/auth/login").send(testAdmin);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("admin");

    const cookies = res.headers["set-cookie"];
    adminCookie = cookies[0];
  });

  it("should allow admin to create barber, deny user and barber", async () => {
    // User attempt -> 403 Forbidden
    const userRes = await request(app)
      .post("/api/barbers")
      .set("Cookie", [userCookie])
      .send({ name: "Denied Barber" });
    expect(userRes.statusCode).toBe(403);

    // Barber attempt -> 403 Forbidden
    const barberRes = await request(app)
      .post("/api/barbers")
      .set("Cookie", [barberCookie])
      .send({ name: "Denied Barber" });
    expect(barberRes.statusCode).toBe(403);

    // Admin attempt -> 201 Created
    const adminRes = await request(app)
      .post("/api/barbers")
      .set("Cookie", [adminCookie])
      .send({ name: "Allowed Barber" });
    expect(adminRes.statusCode).toBe(201);

    // Cleanup
    if (adminRes.body.id) {
      await pool.query("DELETE FROM barbers WHERE id = $1", [adminRes.body.id]);
    }
  });

  it("should protect role-specific dashboard APIs", async () => {
    const adminDashboard = await request(app)
      .get("/api/admin/dashboard")
      .set("Cookie", [adminCookie]);
    expect(adminDashboard.statusCode).toBe(200);

    const barberDenied = await request(app)
      .get("/api/admin/dashboard")
      .set("Cookie", [barberCookie]);
    expect(barberDenied.statusCode).toBe(403);

    const barberDashboard = await request(app)
      .get("/api/barber/dashboard")
      .set("Cookie", [barberCookie]);
    expect(barberDashboard.statusCode).toBe(200);

    const userDenied = await request(app)
      .get("/api/barber/dashboard")
      .set("Cookie", [userCookie]);
    expect(userDenied.statusCode).toBe(403);
  });

  it("should prevent a barber from reading another barber appointment", async () => {
    const otherBarber = await pool.query(
      "INSERT INTO barbers (name, email) VALUES ($1,$2) RETURNING id",
      ["Other RBAC Barber", `other_${Date.now()}@example.com`],
    );
    const service = await pool.query(
      "INSERT INTO services (barber_id,name,total_price,downpayment_amount,duration_mins) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [otherBarber.rows[0].id, "Other Service", 500, 100, 30],
    );
    const appointment = await pool.query(
      "INSERT INTO appointments (customer_name,customer_phone,customer_email,barber_id,service_id,appointment_date,start_time,end_time,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [
        "Private Customer",
        "09000000000",
        "private@example.com",
        otherBarber.rows[0].id,
        service.rows[0].id,
        "2027-02-01",
        "10:00",
        "10:30",
        "confirmed",
      ],
    );
    const denied = await request(app)
      .get(`/api/barber/appointments/${appointment.rows[0].id}`)
      .set("Cookie", [barberCookie]);
    expect(denied.statusCode).toBe(404);
    await pool.query("DELETE FROM barbers WHERE id=$1", [
      otherBarber.rows[0].id,
    ]);
  });

  it("should check session via GET /api/auth/me", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [userCookie]);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("user");
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("should logout and clear token cookie", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.statusCode).toBe(200);
    const cookies = res.headers["set-cookie"];
    expect(cookies[0]).toMatch(/token=;/);
  });
});
