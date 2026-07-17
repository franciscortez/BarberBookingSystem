import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool = require("../config/database");
import * as StaffModel from "../model/staff.model";
import * as AppointmentModel from "../model/appointment.model";
import * as ServiceModel from "../model/service.model";
import { enqueueEmailJob } from "../utils/emailQueue";
import { sendBarberInvitationEmail } from "../utils/emailService";
import { validateBookableSlot } from "../utils/bookingRules";
import { buildEndTime } from "../validation/appointment.validation";
import { AppError } from "../utils/AppError";
import {
  AppointmentFilters,
  StaffRescheduleInput,
  BarberProfileInput,
  InviteBarberInput,
  WorkingHourInput,
  AvailabilityBlockInput,
} from "../validation/staff.validation";
import { users, barbers, barber_invitations } from "../config/db/schema";
import { eq, and, sql } from "drizzle-orm";

const transitions: Record<string, string[]> = {
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["completed"],
};

export const resolveBarberId = async (userId: string) => {
  const id = await StaffModel.getBarberIdForUser(userId);
  if (!id)
    throw AppError.forbidden("Barber profile is not linked to this account");
  return id;
};

export const listAppointments = (
  filters: AppointmentFilters,
  barberId?: string,
) => StaffModel.listAppointments(filters, barberId);

export const getAppointment = async (id: string, barberId?: string) => {
  const item = await StaffModel.getAppointment(id, barberId);
  if (!item) throw AppError.notFound("Appointment not found");
  return item;
};

export const getDashboard = async (barberId?: string) => {
  const summary = await StaffModel.dashboard(barberId);
  if (barberId) return summary;
  const [barbersList, payments] = await Promise.all([
    StaffModel.listBarbers(),
    StaffModel.listPayments(),
  ]);
  return {
    ...summary,
    active_barbers: barbersList.filter((b) => b.is_active).length,
    payment_total: payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };
};

export const changeStatus = async (
  id: string,
  status: string,
  barberId?: string,
) => {
  const current = await getAppointment(id, barberId);
  if (!transitions[current.status]?.includes(status))
    throw AppError.conflict(
      `Cannot change appointment from ${current.status} to ${status}`,
    );
  await StaffModel.updateAppointmentStatus(id, status);
  const details = await AppointmentModel.getAppointmentDetails(id);
  if (details && status === "cancelled")
    enqueueEmailJob("cancellationConfirmation", details);
  return getAppointment(id, barberId);
};

export const reschedule = async (
  id: string,
  input: StaffRescheduleInput,
  barberId?: string,
) => {
  const current = await getAppointment(id, barberId);

  if (current.status !== "confirmed")
    throw AppError.conflict("Only confirmed appointments can be rescheduled");

  const service = await ServiceModel.getServiceById(current.service_id);
  if (!service) throw AppError.notFound("Service not found");

  const end = buildEndTime(
    input.appointment_date,
    input.start_time,
    service.duration_mins,
  );
  const valid = validateBookableSlot({
    appointmentDate: input.appointment_date,
    startTime: input.start_time,
    durationMins: service.duration_mins,
  });

  if (!valid.valid) throw AppError.badRequest(valid.error!);

  await pool.db.transaction(async (tx) => {
    await AppointmentModel.lockBarber(current.barber_id, tx);
    const free = await AppointmentModel.isSlotAvailable(
      current.barber_id,
      input.appointment_date,
      input.start_time,
      end,
      tx,
      id,
    );
    if (!free)
      throw AppError.conflict("The requested time slot is no longer available");
    await AppointmentModel.updateAppointmentSchedule(
      id,
      {
        appointment_date: input.appointment_date,
        start_time: input.start_time,
        end_time: end,
      },
      tx,
    );
  });

  const details = await AppointmentModel.getAppointmentDetails(id);
  if (details) enqueueEmailJob("rescheduleConfirmation", details);
  return details;
};
export const listBarbers = StaffModel.listBarbers;

export const getBarber = async (id: string) => {
  const barber = await StaffModel.getBarber(id);
  if (!barber) throw AppError.notFound("Barber not found");
  return barber;
};
export const updateBarber = async (id: string, input: BarberProfileInput) => {
  await getBarber(id);
  return StaffModel.updateBarberProfile(id, input);
};
export const setBarberActive = async (id: string, active: boolean) => {
  await getBarber(id);
  return StaffModel.setBarberActive(id, active);
};
export const deleteBarber = async (id: string) => {
  const deleted = await StaffModel.deleteBarber(id);
  if (!deleted) throw AppError.notFound("Barber not found");
};
export const listPayments = StaffModel.listPayments;
export const getAvailability = StaffModel.getAvailability;
const assertNoOverlap = (hours: WorkingHourInput[]) => {
  for (const [index, hour] of hours.entries())
    if (
      hours.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          hour.weekday === other.weekday &&
          hour.start_time < other.end_time &&
          hour.end_time > other.start_time,
      )
    )
      throw AppError.conflict("Working hours cannot overlap");
};
export const replaceWorkingHours = async (
  barberId: string,
  hours: WorkingHourInput[],
) => {
  await getBarber(barberId);
  assertNoOverlap(hours);
  await StaffModel.replaceWorkingHours(barberId, hours);
  return StaffModel.getAvailability(barberId);
};
export const addAvailabilityBlock = async (
  barberId: string,
  block: AvailabilityBlockInput,
) => {
  await getBarber(barberId);
  return StaffModel.addAvailabilityBlock(barberId, block);
};
export const deleteAvailabilityBlock = async (barberId: string, id: string) => {
  const deleted = await StaffModel.deleteAvailabilityBlock(barberId, id);
  if (!deleted) throw AppError.notFound("Availability block not found");
};
export const listInvitations = StaffModel.listInvitations;
export const inviteBarber = async (
  input: InviteBarberInput,
  invitedBy: string,
) => {
  const emailLower = input.email.toLowerCase();

  const duplicateUsers = await pool.db
    .select({ id: users.id })
    .from(users)
    .where(sql`LOWER(${users.email}) = ${emailLower}`);

  const duplicateInvitations = await pool.db
    .select({ id: barber_invitations.id })
    .from(barber_invitations)
    .where(
      and(
        sql`LOWER(${barber_invitations.email}) = ${emailLower}`,
        sql`accepted_at IS NULL AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      ),
    );

  if (duplicateUsers.length || duplicateInvitations.length)
    throw AppError.conflict("Email already registered or invited");

  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await pool.db
    .insert(barber_invitations)
    .values({
      email: input.email,
      name: input.name,
      phone: input.phone,
      token_hash: hash,
      invited_by: invitedBy,
      expires_at: sql`CURRENT_TIMESTAMP + INTERVAL '48 hours'`,
    })
    .returning({
      id: barber_invitations.id,
      email: barber_invitations.email,
      name: barber_invitations.name,
      phone: barber_invitations.phone,
      expires_at: barber_invitations.expires_at,
      created_at: barber_invitations.created_at,
    });

  await sendBarberInvitationEmail(input.email, input.name, token);
  return result[0];
};
export const revokeInvitation = async (id: string) => {
  const result = await pool.db
    .update(barber_invitations)
    .set({ revoked_at: sql`CURRENT_TIMESTAMP` })
    .where(
      and(
        eq(barber_invitations.id, id),
        sql`accepted_at IS NULL AND revoked_at IS NULL`,
      ),
    )
    .returning({ id: barber_invitations.id });

  if (!result.length) throw AppError.notFound("Pending invitation not found");
};
export const resendInvitation = async (id: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await pool.db
    .update(barber_invitations)
    .set({
      token_hash: hash,
      expires_at: sql`CURRENT_TIMESTAMP + INTERVAL '48 hours'`,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(
      and(
        eq(barber_invitations.id, id),
        sql`accepted_at IS NULL AND revoked_at IS NULL`,
      ),
    )
    .returning({
      email: barber_invitations.email,
      name: barber_invitations.name,
      expires_at: barber_invitations.expires_at,
    });

  if (!result.length) throw AppError.notFound("Pending invitation not found");
  await sendBarberInvitationEmail(result[0].email, result[0].name, token);
  return result[0];
};
export const validateInvitation = async (token: string) => {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await pool.db
    .select({
      email: barber_invitations.email,
      name: barber_invitations.name,
      phone: barber_invitations.phone,
      expires_at: barber_invitations.expires_at,
    })
    .from(barber_invitations)
    .where(
      and(
        eq(barber_invitations.token_hash, hash),
        sql`accepted_at IS NULL AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      ),
    );

  if (!result.length)
    throw AppError.badRequest("Invitation is invalid or expired");
  return result[0];
};

export const acceptInvitation = async (token: string, password: string) => {
  const invite = await validateInvitation(token);
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const passwordHash = await bcrypt.hash(password, 10);

  return await pool.db.transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(barber_invitations)
      .where(
        and(
          eq(barber_invitations.token_hash, hash),
          sql`accepted_at IS NULL AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
        ),
      )
      .for("update");

    if (!locked.length)
      throw AppError.badRequest("Invitation is invalid or expired");

    const userRows = await tx
      .insert(users)
      .values({
        name: invite.name,
        email: invite.email,
        phone: invite.phone,
        password_hash: passwordHash,
        role: "barber",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
      });

    const user = userRows[0];

    await tx.insert(barbers).values({
      user_id: user.id,
      name: invite.name,
      email: invite.email,
      phone: invite.phone,
    });

    await tx
      .update(barber_invitations)
      .set({ accepted_at: sql`CURRENT_TIMESTAMP` })
      .where(eq(barber_invitations.token_hash, hash));

    return user;
  });
};

export const createWalkinAppointment = async (input: {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
}) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    barber_id,
    service_id,
    appointment_date,
    start_time,
  } = input;

  const service = await ServiceModel.getServiceById(service_id);
  if (!service) throw AppError.notFound("Service not found");
  if (!service.is_active) throw AppError.conflict("Service is inactive");

  const barber = await StaffModel.getBarber(barber_id);
  if (!barber) throw AppError.notFound("Barber not found");
  if (!barber.is_active) throw AppError.conflict("Barber is inactive");
  if (service.barber_id !== barber_id)
    throw AppError.badRequest("Service does not belong to the selected barber");

  const end_time = buildEndTime(
    appointment_date,
    start_time,
    service.duration_mins,
  );

  const slotValidation = validateBookableSlot({
    appointmentDate: appointment_date,
    startTime: start_time,
    durationMins: service.duration_mins,
  });
  if (!slotValidation.valid) throw AppError.badRequest(slotValidation.error!);

  const newAppointment = await pool.db.transaction(async (tx) => {
    await AppointmentModel.lockBarber(barber_id, tx);

    const isAvailable = await AppointmentModel.isSlotAvailable(
      barber_id,
      appointment_date,
      start_time,
      end_time,
      tx,
    );
    if (!isAvailable) {
      throw AppError.conflict("The requested time slot is no longer available");
    }

    const managementToken = crypto.randomUUID();
    const createdAppt = await AppointmentModel.createAppointment(
      {
        customer_name,
        customer_phone,
        customer_email,
        barber_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        management_token: managementToken,
        status: "confirmed",
      },
      tx,
    );

    const PaymentModel = require("../model/payment.model");
    await PaymentModel.createPayment(
      {
        appointment_id: createdAppt.id,
        amount: service.downpayment_amount,
        status: "paid",
        idempotency_key: crypto.randomUUID(),
      },
      tx,
    );

    return createdAppt;
  });

  if (customer_email && customer_email.trim()) {
    const details = await AppointmentModel.getAppointmentDetails(
      newAppointment.id,
    );
    if (details) {
      enqueueEmailJob("bookingConfirmation", details);
    }
  }

  return newAppointment;
};
