const pool = require('../config/database');

/**
 * Fetch occupied time slots for a barber on a specific date
 * @param {string} barberId - UUID of the barber
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} List of occupied slots with start and end times
 */
const getOccupiedSlots = async (barberId, date) => {
    const query = `
        SELECT start_time, end_time 
        FROM Appointments 
        WHERE barber_id = $1 
        AND appointment_date = $2 
        AND status IN ('pending', 'confirmed')
    `;
    const { rows } = await pool.query(query, [barberId, date]);
    return rows;
}; 

/**
 * Fetch the duration of a specific service
 * @param {string} serviceId - UUID of the service
 * @returns {Promise<number|null>} Duration in minutes or null if not found
 */
const getServiceDuration = async (serviceId) => {
    const query = 'SELECT duration_mins FROM Services WHERE id = $1';
    const { rows } = await pool.query(query, [serviceId]);
    return rows.length > 0 ? rows[0].duration_mins : null;
};

module.exports = {
    getOccupiedSlots,
    getServiceDuration
};
