import pool = require('../config/database');
const db = pool.db;
import { appointments, services } from '../config/db/schema';
import { getPendingHoldMinutes } from '../utils/bookingRules';
import { eq, and, or, sql } from 'drizzle-orm';

import { OccupiedSlot } from '../types';

export const getOccupiedSlots = async (barberId: string, date: string): Promise<OccupiedSlot[]> => {
    const holdMinutes = getPendingHoldMinutes();

    const activeCondition = or(
        eq(appointments.status, 'confirmed'),
        and(
            eq(appointments.status, 'pending'),
            sql`${appointments.created_at} > CURRENT_TIMESTAMP - (${holdMinutes} * INTERVAL '1 minute')`
        )
    );

    const rows = await db.select({
        start_time: appointments.start_time,
        end_time: appointments.end_time
    })
    .from(appointments)
    .where(and(
        eq(appointments.barber_id, barberId),
        eq(appointments.appointment_date, date),
        activeCondition
    ));

    return rows as OccupiedSlot[];
}; 

export const getServiceDuration = async (serviceId: string): Promise<number | null> => {
    const rows = await db.select({ duration_mins: services.duration_mins })
        .from(services)
        .where(eq(services.id, serviceId));

    return rows.length > 0 ? rows[0].duration_mins : null;
};
