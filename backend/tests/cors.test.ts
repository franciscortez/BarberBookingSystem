import express from "express";
import cors from "cors";
import { buildCorsOptions } from "../config/cors";
import request from "supertest";

describe("CORS configuration", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalCorsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  const buildApp = () => {
    const app = express();
    app.use(cors(buildCorsOptions()));
    app.get("/cors-test", (req, res) => res.json({ ok: true }));
    return app;
  };

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.FRONTEND_URL = originalFrontendUrl;
    process.env.CORS_ALLOWED_ORIGINS = originalCorsAllowedOrigins;
  });

  it("allows the configured production frontend origin", async () => {
    process.env.NODE_ENV = "production";
    process.env.FRONTEND_URL = "https://frontend.example.com/";
    delete process.env.CORS_ALLOWED_ORIGINS;

    const res = await request(buildApp())
      .get("/cors-test")
      .set("Origin", "https://frontend.example.com")
      .expect(200);

    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://frontend.example.com",
    );
  });

  it("omits CORS headers for disallowed production origins", async () => {
    process.env.NODE_ENV = "production";
    process.env.FRONTEND_URL = "https://frontend.example.com";
    delete process.env.CORS_ALLOWED_ORIGINS;

    const res = await request(buildApp())
      .get("/cors-test")
      .set("Origin", "https://evil.example.com")
      .expect(200);

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("allows arbitrary development origins", async () => {
    process.env.NODE_ENV = "development";

    const res = await request(buildApp())
      .get("/cors-test")
      .set("Origin", "http://localhost:5173")
      .expect(200);

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });
});
