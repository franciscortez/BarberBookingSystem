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
  const [barbers, payments] = await Promise.all([
    StaffModel.listBarbers(),
    StaffModel.listPayments(),
  ]);
  return {
    ...summary,
    active_barbers: barbers.filter((b) => b.is_active).length,
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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await AppointmentModel.lockBarber(current.barber_id, client);
    const free = await AppointmentModel.isSlotAvailable(
      current.barber_id,
      input.appointment_date,
      input.start_time,
      end,
      client,
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
      client,
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
  const duplicate = await pool.query(
    "SELECT 1 FROM users WHERE LOWER(email)=LOWER($1) UNION SELECT 1 FROM barber_invitations WHERE LOWER(email)=LOWER($1) AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP",
    [input.email],
  );
  if (duplicate.rowCount)
    throw AppError.conflict("Email already registered or invited");
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await pool.query(
    "INSERT INTO barber_invitations (email,name,phone,token_hash,invited_by,expires_at) VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP + INTERVAL '48 hours') RETURNING id,email,name,phone,expires_at,created_at",
    [input.email, input.name, input.phone, hash, invitedBy],
  );
  await sendBarberInvitationEmail(input.email, input.name, token);
  return result.rows[0];
};
export const revokeInvitation = async (id: string) => {
  const result = await pool.query(
    "UPDATE barber_invitations SET revoked_at=CURRENT_TIMESTAMP WHERE id=$1 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING id",
    [id],
  );
  if (!result.rowCount) throw AppError.notFound("Pending invitation not found");
};
export const resendInvitation = async (id: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await pool.query(
    "UPDATE barber_invitations SET token_hash=$2, expires_at=CURRENT_TIMESTAMP + INTERVAL '48 hours', updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING email,name,expires_at",
    [id, hash],
  );
  if (!result.rowCount) throw AppError.notFound("Pending invitation not found");
  await sendBarberInvitationEmail(
    result.rows[0].email,
    result.rows[0].name,
    token,
  );
  return result.rows[0];
};
export const validateInvitation = async (token: string) => {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await pool.query(
    "SELECT email,name,phone,expires_at FROM barber_invitations WHERE token_hash=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP",
    [hash],
  );
  if (!result.rowCount)
    throw AppError.badRequest("Invitation is invalid or expired");
  return result.rows[0];
};

export const acceptInvitation = async (token: string, password: string) => {
  const invite = await validateInvitation(token);
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      "SELECT * FROM barber_invitations WHERE token_hash=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP FOR UPDATE",
      [hash],
    );
    if (!locked.rowCount)
      throw AppError.badRequest("Invitation is invalid or expired");
    const user = await client.query(
      "INSERT INTO users (name,email,phone,password_hash,role) VALUES ($1,$2,$3,$4,'barber') RETURNING id,name,email,phone,role",
      [invite.name, invite.email, invite.phone, passwordHash],
    );
    await client.query(
      "INSERT INTO barbers (user_id,name,email,phone) VALUES ($1,$2,$3,$4)",
      [user.rows[0].id, invite.name, invite.email, invite.phone],
    );
    await client.query(
      "UPDATE barber_invitations SET accepted_at=CURRENT_TIMESTAMP WHERE token_hash=$1",
      [hash],
    );
    await client.query("COMMIT");
    return user.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
