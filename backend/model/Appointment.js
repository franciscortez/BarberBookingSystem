const pool = require('../config/database');

/**
 * Create a new appointment (status defaults to 'pending')
 * @param {Object} appointmentData 
 * @returns {Promise<Object>} Created appointment
 */
const createAppointment = async (appointmentData, client = pool) => {
    const { 
        customer_name, 
        customer_phone, 
        customer_email, 
        barber_id, 
        service_id, 
        appointment_date, 
        start_time, 
        end_time,
        management_token
    } = appointmentData;

    const query = `
        INSERT INTO Appointments (
            customer_name, customer_phone, customer_email, 
            barber_id, service_id, appointment_date, start_time, end_time,
            management_token
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const values = [
        customer_name, customer_phone, customer_email, 
        barber_id, service_id, appointment_date, start_time, end_time,
        management_token
    ];

    const { rows } = await client.query(query, values);
    return rows[0];
};

/**
 * Get appointment by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getAppointmentById = async (id) => {
    const query = 'SELECT * FROM Appointments WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
};

/**
 * Update appointment status
 * @param {string} id 
 * @param {string} status - 'pending', 'confirmed', 'cancelled'
 * @returns {Promise<Object|null>}
 */
const updateAppointmentStatus = async (id, status) => {
    const query = 'UPDATE Appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, id]);
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
const isSlotAvailable = async (barberId, date, startTime, endTime, client = pool) => {
    const query = `
        SELECT 1 FROM Appointments
        WHERE barber_id = $1
        AND appointment_date = $2
        AND status IN ('pending', 'confirmed')
        AND (
            (start_time < $4 AND end_time > $3)
        )
    `;
    const { rows } = await client.query(query, [barberId, date, startTime, endTime]);
    return rows.length === 0;
};

/**
 * Lock the barber row for the duration of the transaction to prevent race conditions
 * @param {string} barberId 
 * @param {Object} client - The database client within a transaction
 */
const lockBarber = async (barberId, client) => {
    const query = 'SELECT 1 FROM Barbers WHERE id = $1 FOR UPDATE';
    await client.query(query, [barberId]);
};

/**
 * Get full appointment details including barber and service information
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getAppointmentDetails = async (id) => {
    const query = `
        SELECT 
            a.*,
            b.name as barber_name,
            s.name as service_name,
            s.total_price,
            s.downpayment_amount
        FROM Appointments a
        JOIN Barbers b ON a.barber_id = b.id
        JOIN Services s ON a.service_id = s.id
        WHERE a.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
};

module.exports = {
    createAppointment,
    getAppointmentById,
    updateAppointmentStatus,
    isSlotAvailable,
    lockBarber,
    getAppointmentDetails
};
