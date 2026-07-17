import request from "supertest";
import app = require("../index");
import pool = require("../config/database");

describe("Cron Cleanup API Endpoint", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCronSecret = process.env.CRON_SECRET;

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("should successfully run cleanup in development environment without auth headers", async () => {
    process.env.NODE_ENV = "development";
    const res = await request(app).get("/api/cron/cleanup");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true, message: "Cleanup completed" });
  });

  it("should fail to run cleanup in production environment without valid token", async () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "supersecret";

    const res = await request(app).get("/api/cron/cleanup");
    expect(res.statusCode).toEqual(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("should fail to run cleanup in production environment with incorrect token", async () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "supersecret";

    const res = await request(app)
      .get("/api/cron/cleanup")
      .set("Authorization", "Bearer wrongsecret");
    expect(res.statusCode).toEqual(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("should successfully run cleanup in production environment with valid token", async () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "supersecret";

    const res = await request(app)
      .get("/api/cron/cleanup")
      .set("Authorization", "Bearer supersecret");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true, message: "Cleanup completed" });
  });
});
