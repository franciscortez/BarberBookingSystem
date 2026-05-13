const pool = require('../config/database');

/**
 * Find an admin by username
 * @param {string} username - The username to search for
 * @returns {Promise<Object|null>} Admin object or null
 */
const findByUsername = async (username) => {
    const query = 'SELECT * FROM Admins WHERE username = $1';
    const { rows } = await pool.query(query, [username]);

    return rows[0] || null;
};

/**
 * Create a new admin
 * @param {string} username - The admin username
 * @param {string} passwordHash - The hashed password
 * @returns {Promise<Object>} Created admin object
 */
const createAdmin = async (username, passwordHash) => {
    const query = 'INSERT INTO Admins (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at';
    const { rows } = await pool.query(query, [username, passwordHash]);

    return rows[0];
};

/**
 * Find an admin by ID
 * @param {string} adminId - UUID of the admin
 * @returns {Promise<Object|null>} Admin object or null
 */
const findById = async (adminId) => {
    const query = 'SELECT id, username, created_at FROM Admins WHERE id = $1';
    const { rows } = await pool.query(query, [adminId]);

    return rows[0] || null;
};

module.exports = {
    findByUsername,
    createAdmin,
    findById
};
