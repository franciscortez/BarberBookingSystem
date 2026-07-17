import pool = require("../config/database");
const db = pool.db;
import {
  appointments,
  barbers,
  services,
  payments,
  users,
  barber_working_hours,
  barber_availability_blocks,
  barber_invitations,
} from "../config/db/schema";
import { eq, and, or, sql, ilike, desc, asc, gte } from "drizzle-orm";
import {
  AppointmentFilters,
  BarberProfileInput,
  WorkingHourInput,
  AvailabilityBlockInput,
} from "../validation/staff.validation";

export const getBarberIdForUser = async (
  userId: string,
): Promise<string | null> => {
  const result = await db
    .select({ id: barbers.id })
    .from(barbers)
    .where(eq(barbers.user_id, userId));
  return result[0]?.id ?? null;
};

export const listAppointments = async (
  filters: AppointmentFilters,
  ownerBarberId?: string,
) => {
  const conditions = [];
  if (ownerBarberId) {
    conditions.push(eq(appointments.barber_id, ownerBarberId));
  } else if (filters.barberId) {
    conditions.push(eq(appointments.barber_id, filters.barberId));
  }
  if (filters.date) {
    conditions.push(eq(appointments.appointment_date, filters.date));
  }
  if (filters.status) {
    conditions.push(eq(appointments.status, filters.status));
  }
  if (filters.serviceId) {
    conditions.push(eq(appointments.service_id, filters.serviceId));
  }
  if (filters.paymentStatus) {
    conditions.push(eq(payments.status, filters.paymentStatus));
  }
  if (filters.search) {
    const search = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(appointments.customer_name, search),
        ilike(appointments.customer_email, search),
        ilike(appointments.customer_phone, search),
      ),
    );
  }

  const query = db
    .select({
      id: appointments.id,
      customer_name: appointments.customer_name,
      customer_phone: appointments.customer_phone,
      customer_email: appointments.customer_email,
      barber_id: sql<string>`${appointments.barber_id}`,
      service_id: sql<string>`${appointments.service_id}`,
      appointment_date: sql<string>`TO_CHAR(${appointments.appointment_date}, 'YYYY-MM-DD')`,
      start_time: appointments.start_time,
      end_time: appointments.end_time,
      status: appointments.status,
      barber_name: barbers.name,
      service_name: services.name,
      total_price: services.total_price,
      downpayment_amount: services.downpayment_amount,
      payment_status: payments.status,
      payment_amount: payments.amount,
      paymongo_payment_id: payments.paymongo_payment_id,
    })
    .from(appointments)
    .leftJoin(barbers, eq(barbers.id, appointments.barber_id))
    .leftJoin(services, eq(services.id, appointments.service_id))
    .leftJoin(payments, eq(payments.appointment_id, appointments.id));

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  return await query
    .orderBy(desc(appointments.appointment_date), desc(appointments.start_time))
    .limit(250);
};

export const getAppointment = async (id: string, ownerBarberId?: string) => {
  const filters: AppointmentFilters = {};
  const rows = await listAppointments(filters, ownerBarberId);
  return rows.find((row) => row.id === id) ?? null;
};

export const updateAppointmentStatus = async (id: string, status: string) => {
  const result = await db
    .update(appointments)
    .set({ status, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(appointments.id, id))
    .returning();
  return result[0] ?? null;
};

export const dashboard = async (ownerBarberId?: string) => {
  const conditions = [];
  if (ownerBarberId) {
    conditions.push(eq(appointments.barber_id, ownerBarberId));
  }

  const statsQuery = db
    .select({
      today: sql<string>`COUNT(*) FILTER (WHERE ${appointments.appointment_date} = CURRENT_DATE)::text`,
      upcoming: sql<string>`COUNT(*) FILTER (WHERE ${appointments.appointment_date} >= CURRENT_DATE AND ${appointments.status} = 'confirmed')::text`,
      confirmed: sql<string>`COUNT(*) FILTER (WHERE ${appointments.status} = 'confirmed')::text`,
      completed: sql<string>`COUNT(*) FILTER (WHERE ${appointments.status} = 'completed')::text`,
      cancelled: sql<string>`COUNT(*) FILTER (WHERE ${appointments.status} = 'cancelled')::text`,
      no_show: sql<string>`COUNT(*) FILTER (WHERE ${appointments.status} = 'no_show')::text`,
    })
    .from(appointments);

  if (conditions.length > 0) {
    statsQuery.where(and(...conditions));
  }
  const statsResult = await statsQuery;

  const nextConditions = [
    eq(appointments.status, "confirmed"),
    sql`(${appointments.appointment_date} > CURRENT_DATE OR (${appointments.appointment_date} = CURRENT_DATE AND ${appointments.start_time} > CURRENT_TIME))`,
  ];
  if (ownerBarberId) {
    nextConditions.push(eq(appointments.barber_id, ownerBarberId));
  }

  const nextResult = await db
    .select({
      id: appointments.id,
      customer_name: appointments.customer_name,
      appointment_date: sql<string>`TO_CHAR(${appointments.appointment_date}, 'YYYY-MM-DD')`,
      start_time: appointments.start_time,
      service_name: services.name,
    })
    .from(appointments)
    .leftJoin(services, eq(services.id, appointments.service_id))
    .where(and(...nextConditions))
    .orderBy(asc(appointments.appointment_date), asc(appointments.start_time))
    .limit(1);

  return {
    ...statsResult[0],
    next_appointment: nextResult[0] ?? null,
  };
};

export const listBarbers = async () =>
  await db
    .select({
      id: barbers.id,
      user_id: barbers.user_id,
      name: barbers.name,
      email: barbers.email,
      phone: barbers.phone,
      is_active: barbers.is_active,
      created_at: barbers.created_at,
      account_active: users.is_active,
    })
    .from(barbers)
    .leftJoin(users, eq(users.id, barbers.user_id))
    .orderBy(asc(barbers.name));

export const getBarber = async (id: string) => {
  const rows = await db
    .select({
      id: barbers.id,
      user_id: barbers.user_id,
      name: barbers.name,
      email: barbers.email,
      phone: barbers.phone,
      is_active: barbers.is_active,
      created_at: barbers.created_at,
      updated_at: barbers.updated_at,
      user_phone: users.phone,
    })
    .from(barbers)
    .leftJoin(users, eq(users.id, barbers.user_id))
    .where(eq(barbers.id, id));
  return rows[0] ?? null;
};

export const updateBarberProfile = async (
  id: string,
  input: BarberProfileInput,
) => {
  return await db.transaction(async (tx) => {
    const result = await tx
      .update(barbers)
      .set({
        name: input.name,
        phone: input.phone,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(barbers.id, id))
      .returning();

    const barber = result[0];
    if (barber?.user_id) {
      await tx
        .update(users)
        .set({
          name: input.name,
          phone: input.phone,
          updated_at: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, barber.user_id));
    }
    return barber ?? null;
  });
};

export const setBarberActive = async (id: string, active: boolean) => {
  return await db.transaction(async (tx) => {
    const result = await tx
      .update(barbers)
      .set({
        is_active: active,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(barbers.id, id))
      .returning();

    const barber = result[0];
    if (barber?.user_id) {
      await tx
        .update(users)
        .set({
          is_active: active,
          updated_at: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, barber.user_id));
    }
    return barber ?? null;
  });
};

export const deleteBarber = async (id: string) => {
  return await db.transaction(async (tx) => {
    const barber = await tx
      .select({ user_id: barbers.user_id })
      .from(barbers)
      .where(eq(barbers.id, id));
    const userId = barber[0]?.user_id;

    const result = await tx
      .delete(barbers)
      .where(eq(barbers.id, id))
      .returning({ id: barbers.id });

    if (userId) {
      await tx.delete(users).where(eq(users.id, userId));
    }
    return result[0] ?? null;
  });
};

export const listPayments = async () =>
  await db
    .select({
      id: payments.id,
      amount: payments.amount,
      status: payments.status,
      paymongo_checkout_id: payments.paymongo_checkout_id,
      paymongo_payment_id: payments.paymongo_payment_id,
      created_at: payments.created_at,
      appointment_id: appointments.id,
      customer_name: appointments.customer_name,
      customer_email: appointments.customer_email,
      barber_name: barbers.name,
    })
    .from(payments)
    .leftJoin(appointments, eq(appointments.id, payments.appointment_id))
    .leftJoin(barbers, eq(barbers.id, appointments.barber_id))
    .orderBy(desc(payments.created_at))
    .limit(250);

export const getAvailability = async (barberId: string) => ({
  hours: await db
    .select({
      id: barber_working_hours.id,
      weekday: barber_working_hours.weekday,
      start_time: barber_working_hours.start_time,
      end_time: barber_working_hours.end_time,
    })
    .from(barber_working_hours)
    .where(eq(barber_working_hours.barber_id, barberId))
    .orderBy(
      asc(barber_working_hours.weekday),
      asc(barber_working_hours.start_time),
    ),
  blocks: await db
    .select({
      id: barber_availability_blocks.id,
      block_date: sql<string>`TO_CHAR(${barber_availability_blocks.block_date}, 'YYYY-MM-DD')`,
      start_time: barber_availability_blocks.start_time,
      end_time: barber_availability_blocks.end_time,
      reason: barber_availability_blocks.reason,
    })
    .from(barber_availability_blocks)
    .where(
      and(
        eq(barber_availability_blocks.barber_id, barberId),
        gte(barber_availability_blocks.block_date, sql`CURRENT_DATE`),
      ),
    )
    .orderBy(
      asc(barber_availability_blocks.block_date),
      asc(barber_availability_blocks.start_time),
    ),
});

export const replaceWorkingHours = async (
  barberId: string,
  hours: WorkingHourInput[],
) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(barber_working_hours)
      .where(eq(barber_working_hours.barber_id, barberId));
    if (hours.length > 0) {
      await tx.insert(barber_working_hours).values(
        hours.map((hour) => ({
          barber_id: barberId,
          weekday: hour.weekday,
          start_time: hour.start_time,
          end_time: hour.end_time,
        })),
      );
    }
  });
};

export const addAvailabilityBlock = async (
  barberId: string,
  block: AvailabilityBlockInput,
) => {
  const rows = await db
    .insert(barber_availability_blocks)
    .values({
      barber_id: barberId,
      block_date: block.block_date,
      start_time: block.start_time,
      end_time: block.end_time,
      reason: block.reason ?? null,
    })
    .returning();
  return rows[0];
};

export const deleteAvailabilityBlock = async (barberId: string, id: string) => {
  const rows = await db
    .delete(barber_availability_blocks)
    .where(
      and(
        eq(barber_availability_blocks.id, id),
        eq(barber_availability_blocks.barber_id, barberId),
      ),
    )
    .returning({ id: barber_availability_blocks.id });
  return rows[0] ?? null;
};

export const listInvitations = async () =>
  await db
    .select({
      id: barber_invitations.id,
      email: barber_invitations.email,
      name: barber_invitations.name,
      phone: barber_invitations.phone,
      expires_at: barber_invitations.expires_at,
      accepted_at: barber_invitations.accepted_at,
      revoked_at: barber_invitations.revoked_at,
      created_at: barber_invitations.created_at,
      status: sql<string>`
        CASE
          WHEN ${barber_invitations.accepted_at} IS NOT NULL THEN 'accepted'
          WHEN ${barber_invitations.revoked_at} IS NOT NULL THEN 'revoked'
          WHEN ${barber_invitations.expires_at} < CURRENT_TIMESTAMP THEN 'expired'
          ELSE 'pending'
        END
      `,
    })
    .from(barber_invitations)
    .orderBy(desc(barber_invitations.created_at));
