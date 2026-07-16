const pool = require('../config/database');
const db = pool.db;
const { appointments, barbers, services, payments } = require('../config/db/schema');
const { getPendingHoldMinutes } = require('../utils/bookingRules');
const { eq, and, or, sql } = require('drizzle-orm');
const { drizzle } = require('drizzle-orm/node-postgres');

// Utility to acquire the correct drizzle instance depending on client parameter
const getDb = (client) => {
    if (client === pool) return db;
    if (client && typeof client.select === 'function') return client;
    // client is a raw pg client from a pool.connect() transaction
    return drizzle(client, { schema: require('../config/db/schema') });
};

/**
 * Create a new appointment (status defaults to 'pending')
 * @param {Object} appointmentData 
 * @returns {Promise<Object>} Created appointment
 */
const createAppointment = async (appointmentData, client = pool) => {
    const tx = getDb(client);
    const rows = await tx.insert(appointments).values(appointmentData).returning();
    return rows[0];
};

/**
 * Get appointment by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getAppointmentById = async (id, client = pool, forUpdate = false) => {
    const tx = getDb(client);
    let query = tx.select().from(appointments).where(eq(appointments.id, id));
    if (forUpdate) {
        query = query.for('update');
    }
    const rows = await query;
    return rows[0] || null;
};

/**
 * Get appointment by management token
 * @param {string} token
 * @param {Object} client
 * @param {boolean} forUpdate
 * @returns {Promise<Object|null>}
 */
const getAppointmentByManagementToken = async (token, client = pool, forUpdate = false) => {
    const tx = getDb(client);
    let query = tx.select().from(appointments).where(eq(appointments.management_token, token));
    if (forUpdate) {
        query = query.for('update');
    }
    const rows = await query;
    return rows[0] || null;
};

/**
 * Update appointment status
 * @param {string} id 
 * @param {string} status - 'pending', 'confirmed', 'cancelled'
 * @returns {Promise<Object|null>}
 */
const updateAppointmentStatus = async (id, status, client = pool) => {
    const tx = getDb(client);
    const rows = await tx.update(appointments)
        .set({ status, updated_at: sql`CURRENT_TIMESTAMP` })
        .where(eq(appointments.id, id))
        .returning();
    return rows[0] || null;
};

/**
 * Update appointment date and time
 * @param {string} id
 * @param {Object} scheduleData
 * @param {Object} client
 * @returns {Promise<Object|null>}
 */
const updateAppointmentSchedule = async (id, scheduleData, client = pool) => {
    const tx = getDb(client);
    const { appointment_date, start_time, end_time } = scheduleData;
    const rows = await tx.update(appointments)
        .set({
            appointment_date,
            start_time,
            end_time,
            updated_at: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(appointments.id, id))
        .returning();
    return rows[0] || null;
};

/**
 * Check if a slot is available (no overlapping pending or confirmed appointments)
 * @param {string} barberId 
 * @param {string} date 
 * @param {string} startTime 
 * @param {string} endTime 
 * @returns {Promise<boolean>}
 */
const isSlotAvailable = async (barberId, date, startTime, endTime, client = pool, excludeAppointmentId = null) => {
    const tx = getDb(client);
    const holdMinutes = getPendingHoldMinutes();

    const activeCondition = or(
        eq(appointments.status, 'confirmed'),
        and(
            eq(appointments.status, 'pending'),
            sql`${appointments.created_at} > CURRENT_TIMESTAMP - (${holdMinutes} * INTERVAL '1 minute')`
        )
    );

    let conditions = and(
        eq(appointments.barber_id, barberId),
        eq(appointments.appointment_date, date),
        activeCondition,
        sql`start_time < ${endTime} AND end_time > ${startTime}`
    );

    if (excludeAppointmentId) {
        conditions = and(conditions, sql`id <> ${excludeAppointmentId}`);
    }

    const rows = await tx.select({ one: sql`1` })
        .from(appointments)
        .where(conditions);

    return rows.length === 0;
};

/**
 * Lock the barber row for the duration of the transaction to prevent race conditions
 * @param {string} barberId 
 * @param {Object} client - The database client within a transaction
 */
const lockBarber = async (barberId, client) => {
    const tx = getDb(client);
    await tx.select({ one: sql`1` }).from(barbers).where(eq(barbers.id, barberId)).for('update');
};

/**
 * Get full appointment details including barber and service information
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getAppointmentDetails = async (id) => {
    const rows = await db.select({
        id: appointments.id,
        customer_name: appointments.customer_name,
        customer_phone: appointments.customer_phone,
        customer_email: appointments.customer_email,
        barber_id: appointments.barber_id,
        service_id: appointments.service_id,
        appointment_date: sql`TO_CHAR(${appointments.appointment_date}, 'YYYY-MM-DD')`.mapWith(String),
        start_time: appointments.start_time,
        end_time: appointments.end_time,
        status: appointments.status,
        management_token: appointments.management_token,
        created_at: appointments.created_at,
        updated_at: appointments.updated_at,
        barber_name: barbers.name,
        service_name: services.name,
        total_price: services.total_price,
        downpayment_amount: services.downpayment_amount,
        payment_reference_number: payments.id,
        paymongo_checkout_id: payments.paymongo_checkout_id,
        paymongo_payment_id: payments.paymongo_payment_id
    })
    .from(appointments)
    .innerJoin(barbers, eq(appointments.barber_id, barbers.id))
    .innerJoin(services, eq(appointments.service_id, services.id))
    .leftJoin(payments, eq(payments.appointment_id, appointments.id))
    .where(eq(appointments.id, id));

    return rows[0] || null;
};

module.exports = {
    createAppointment,
    getAppointmentById,
    getAppointmentByManagementToken,
    updateAppointmentStatus,
    updateAppointmentSchedule,
    isSlotAvailable,
    lockBarber,
    getAppointmentDetails
};
