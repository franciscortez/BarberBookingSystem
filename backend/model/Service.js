const pool = require('../config/database');

/**
 * Fetch all services from the database with barber details
 * @returns {Promise<Array>} List of services
 */
const getAllServices = async () => {
    const query = `
        SELECT s.*, b.name as barber_name 
        FROM Services s
        JOIN Barbers b ON s.barber_id = b.id
        ORDER BY s.name ASC
    `;
    const { rows } = await pool.query(query);

    return rows;
};

/**
 * Fetch services for a specific barber with barber details
 * @param {string} barberId - UUID of the barber
 * @returns {Promise<Array>} List of services
 */
const getServicesByBarber = async (barberId) => {
    const query = `
        SELECT s.*, b.name as barber_name 
        FROM Services s
        JOIN Barbers b ON s.barber_id = b.id
        WHERE s.barber_id = $1 
        ORDER BY s.name ASC
    `;
    const { rows } = await pool.query(query, [barberId]);

    return rows;
};

/**
 * Fetch a single service by ID
 * @param {string} serviceId - UUID of the service
 * @returns {Promise<Object|null>} Service object or null
 */
const getServiceById = async (serviceId) => {
    const query = 'SELECT * FROM Services WHERE id = $1';
    const { rows } = await pool.query(query, [serviceId]);

    return rows[0] || null;
};

/**
 * Create a new service
 * @param {Object} serviceData - Data for the new service
 * @returns {Promise<Object>} Created service
 */
const createService = async (serviceData) => {
    const { barber_id, name, description, total_price, downpayment_amount, duration_mins } = serviceData;
    const query = `
        INSERT INTO Services (barber_id, name, description, total_price, downpayment_amount, duration_mins)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const { rows } = await pool.query(query, [barber_id, name, description, total_price, downpayment_amount, duration_mins]);

    return rows[0];
};

/**
 * Update an existing service
 * @param {string} serviceId - UUID of the service
 * @param {Object} serviceData - Updated data
 * @returns {Promise<Object|null>} Updated service or null
 */
const updateService = async (serviceId, serviceData) => {
    const { name, description, total_price, downpayment_amount, duration_mins } = serviceData;
    const query = `
        UPDATE Services 
        SET name = $1, description = $2, total_price = $3, downpayment_amount = $4, duration_mins = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
    `;
    const { rows } = await pool.query(query, [name, description, total_price, downpayment_amount, duration_mins, serviceId]);

    return rows[0] || null;
};

/**
 * Delete a service
 * @param {string} serviceId - UUID of the service
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
const deleteService = async (serviceId) => {
    const query = 'DELETE FROM Services WHERE id = $1';
    const { rowCount } = await pool.query(query, [serviceId]);

    return rowCount > 0;
};

module.exports = {
    getAllServices,
    getServicesByBarber,
    getServiceById,
    createService,
    updateService,
    deleteService
};
