import pool = require("../config/database");
const db = pool.db;
import {
  appointments,
  services,
  barber_working_hours,
  barber_availability_blocks,
} from "../config/db/schema";
import { getPendingHoldMinutes } from "../utils/bookingRules";
import { eq, and, or, sql } from "drizzle-orm";

import { OccupiedSlot } from "../types";

export const getOccupiedSlots = async (
  barberId: string,
  date: string,
): Promise<OccupiedSlot[]> => {
  const holdMinutes = getPendingHoldMinutes();

  const activeCondition = or(
    eq(appointments.status, "confirmed"),
    and(
      eq(appointments.status, "pending"),
      sql`${appointments.created_at} > CURRENT_TIMESTAMP - (${holdMinutes} * INTERVAL '1 minute')`,
    ),
  );

  const rows = await db
    .select({
      start_time: appointments.start_time,
      end_time: appointments.end_time,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.barber_id, barberId),
        eq(appointments.appointment_date, date),
        activeCondition,
      ),
    );

  return rows as OccupiedSlot[];
};

export const getServiceDuration = async (
  serviceId: string,
): Promise<number | null> => {
  const rows = await db
    .select({ duration_mins: services.duration_mins })
    .from(services)
    .where(eq(services.id, serviceId));

  return rows.length > 0 ? rows[0].duration_mins : null;
};

export const getWorkingHours = async (
  barberId: string,
  weekday: number,
): Promise<OccupiedSlot[]> => {
  const rows = await db
    .select({
      start_time: barber_working_hours.start_time,
      end_time: barber_working_hours.end_time,
    })
    .from(barber_working_hours)
    .where(
      and(
        eq(barber_working_hours.barber_id, barberId),
        eq(barber_working_hours.weekday, weekday),
      ),
    );
  if (rows.length) return rows as OccupiedSlot[];
  const configured = await db
    .select({ one: sql`1` })
    .from(barber_working_hours)
    .where(eq(barber_working_hours.barber_id, barberId))
    .limit(1);
  return configured.length
    ? []
    : [{ start_time: "09:00:00", end_time: "18:00:00" }];
};

export const getBlocks = async (
  barberId: string,
  blockDate: string,
): Promise<OccupiedSlot[]> => {
  return (await db
    .select({
      start_time: barber_availability_blocks.start_time,
      end_time: barber_availability_blocks.end_time,
    })
    .from(barber_availability_blocks)
    .where(
      and(
        eq(barber_availability_blocks.barber_id, barberId),
        eq(barber_availability_blocks.block_date, blockDate),
      ),
    )) as OccupiedSlot[];
};
