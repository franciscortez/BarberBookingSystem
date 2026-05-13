const pool = require('../config/database');

/**
 * Fetch all barbers from the database
 * @returns {Promise<Array>} List of barbers
 */
const getAllBarber = async () => {
    const query = 'SELECT * FROM Barbers ORDER BY name ASC';
    const { rows } = await pool.query(query);

    return rows;
};

/**
 * Fetch a single barber by ID
 * @param {string} barberId - UUID of the barber
 * @returns {Promise<Object|null>} Barber object or null if not found
 */
const getBarberById = async (barberId) => {
    const query = 'SELECT * FROM Barbers WHERE id = $1';
    const { rows } = await pool.query(query, [barberId]);

    return rows[0] || null;
};

/**
 * Create a new barber
 * @param {string} name - Name of the barber
 * @returns {Promise<Object>} The created barber 
 */
const createBarber = async (name) => {
    const query = 'INSERT INTO Barbers (name) VALUES ($1) RETURNING *';
    const { rows } = await pool.query(query, [name]);

    return rows[0];
};

/**
 * Update an existing barber
 * @param {string} barberId - UUID of the barber
 * @param {string} name - New name
 * @returns {Promise<Object|null>} The updated barber or null
 */
const updateBarber = async (barberId, name) => {
    const query = 'UPDATE Barbers SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [name, barberId]);

    return rows[0] || null;
};

/**
 * Delete a barber
 * @param {string} barberId - UUID of the barber
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
const deleteBarber = async (barberId) => {
    const query = 'DELETE FROM Barbers WHERE id = $1';
    const { rowCount } = await pool.query(query, [barberId]);

    return rowCount > 0;
};

module.exports = {
    getAllBarber,
    getBarberById,
    createBarber,
    updateBarber,
    deleteBarber
};
