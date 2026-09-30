import type { Request, Response, NextFunction } from "express";
import * as AppointmentModel from "../model/appointment.model";
import {
  getBookingStatus,
  getManagedBooking,
} from "../services/appointment.services";
import { getBookingStatus as statusController } from "../controller/appointment.controller";
import { errorHandler } from "../middleware/errorHandler";

jest.mock("../config/database", () => ({ db: { select: jest.fn() } }));
jest.mock("../utils/emailQueue", () => ({ enqueueEmailJob: jest.fn() }));
jest.mock("../config/paymongo", () => ({}));

const token = "8d3a7256-8aad-4f3f-81e4-010726c109a7";
const future = new Date(Date.now() + 30 * 60 * 1000);
const row = {
  status: "confirmed",
  customer_name: "Status Test",
  customer_email: "status@example.test",
  barber_name: "Status Barber",
  service_name: "Haircut",
  appointment_date: [
    future.getFullYear(),
    String(future.getMonth() + 1).padStart(2, "0"),
    String(future.getDate()).padStart(2, "0"),
  ].join("-"),
  start_time: future.toTimeString().slice(0, 8),
  end_time: future.toTimeString().slice(0, 8),
  payment_reference_number: "payment-reference",
  downpayment_amount: "100.00",
  payment_status: "paid",
};

describe("Read-only booking status", () => {
  afterEach(() => jest.restoreAllMocks());

  it("projects only public receipt fields and uses recorded payment amount", async () => {
    const pool = require("../config/database");
    const chain: Record<string, jest.Mock> = {};
    for (const method of ["from", "leftJoin", "where"])
      chain[method] = jest.fn(() => chain);
    chain.limit = jest.fn().mockResolvedValue([row]);
    pool.db.select.mockReturnValue(chain);
    expect(await AppointmentModel.getPublicBookingStatus(token)).toEqual(row);
    const projection = pool.db.select.mock.calls.at(-1)[0];
    expect(Object.keys(projection).sort()).toEqual(Object.keys(row).sort());
    expect(projection.downpayment_amount.name).toBe("amount");
    expect(chain.where).toHaveBeenCalledTimes(1);
  });

  it.each([
    "pending",
    "confirmed",
    "checked_in",
    "completed",
    "no_show",
    "cancelled",
  ])("returns %s without applying management restrictions", async (status) => {
    jest
      .spyOn(AppointmentModel, "getPublicBookingStatus")
      .mockResolvedValue({ ...row, status });
    const result = await getBookingStatus(token);
    expect(result.appointment.status).toBe(status);
    expect(result.payment_status).toBe("paid");
    expect(result.appointment.downpayment_amount).toBe("100.00");
    expect(result.appointment).not.toHaveProperty("management_token");
    expect(result.appointment).not.toHaveProperty("paymongo_checkout_id");
    expect(result.appointment).not.toHaveProperty("customer_phone");
  });

  it.each(["pending", "paid", "failed", null])(
    "returns payment status %s independently",
    async (payment_status) => {
      jest
        .spyOn(AppointmentModel, "getPublicBookingStatus")
        .mockResolvedValue({ ...row, payment_status });
      expect((await getBookingStatus(token)).payment_status).toBe(
        payment_status,
      );
    },
  );

  it("returns 404 for an unknown token", async () => {
    jest
      .spyOn(AppointmentModel, "getPublicBookingStatus")
      .mockResolvedValue(null);
    await expect(getBookingStatus(token)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("preserves the two-hour management restriction", async () => {
    jest
      .spyOn(AppointmentModel, "getAppointmentByManagementToken")
      .mockResolvedValue({
        ...row,
        id: "booking",
        user_id: null,
        customer_phone: "09000000000",
        barber_id: "barber",
        service_id: "service",
        management_token: token,
        created_at: null,
        updated_at: null,
      });
    await expect(getManagedBooking(token)).rejects.toMatchObject({
      statusCode: 400,
      message:
        "Appointments can only be rescheduled or cancelled at least 2 hours in advance",
    });
  });

  it.each([undefined, "", "not-a-token", [token]])(
    "rejects malformed token %s through global validation handling",
    async (input) => {
      const req = { query: { token: input } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
      } as unknown as Response;
      const next = jest.fn();
      await statusController(req, res, next as NextFunction);
      expect(next).toHaveBeenCalledTimes(1);
      errorHandler(next.mock.calls[0][0], req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.setHeader).not.toHaveBeenCalled();
    },
  );

  it("returns no-store receipt data without mutating bookings", async () => {
    jest
      .spyOn(AppointmentModel, "getPublicBookingStatus")
      .mockResolvedValue(row);
    const mutate = jest.spyOn(AppointmentModel, "updateAppointmentStatus");
    const req = { query: { token } } as unknown as Request;
    const res = {
      json: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();
    await statusController(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: "paid" }),
    );
    expect(mutate).not.toHaveBeenCalled();
  });
});
