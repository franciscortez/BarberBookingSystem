const pool = require('../config/database');
const db = pool.db;
const { appointments, services } = require('../config/db/schema');
const { getPendingHoldMinutes } = require('../utils/bookingRules');
const { eq, and, or, sql } = require('drizzle-orm');

/**
 * Fetch occupied time slots for a barber on a specific date
 * @param {string} barberId - UUID of the barber
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} List of occupied slots with start and end times
 */
const getOccupiedSlots = async (barberId, date) => {
    const holdMinutes = getPendingHoldMinutes();

    const activeCondition = or(
        eq(appointments.status, 'confirmed'),
        and(
            eq(appointments.status, 'pending'),
            sql`${appointments.created_at} > CURRENT_TIMESTAMP - (${holdMinutes} * INTERVAL '1 minute')`
        )
    );

    return db.select({
        start_time: appointments.start_time,
        end_time: appointments.end_time
    })
    .from(appointments)
    .where(and(
        eq(appointments.barber_id, barberId),
        eq(appointments.appointment_date, date),
        activeCondition
    ));
}; 

/**
 * Fetch the duration of a specific service
 * @param {string} serviceId - UUID of the service
 * @returns {Promise<number|null>} Duration in minutes or null if not found
 */
const getServiceDuration = async (serviceId) => {
    const rows = await db.select({ duration_mins: services.duration_mins })
        .from(services)
        .where(eq(services.id, serviceId));

    return rows.length > 0 ? rows[0].duration_mins : null;
};

module.exports = {
    getOccupiedSlots,
    getServiceDuration
};
