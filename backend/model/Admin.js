const pool = require('../config/database');
const db = pool.db;
const { admins } = require('../config/db/schema');
const { eq } = require('drizzle-orm');

/**
 * Find an admin by username
 * @param {string} username - The username to search for
 * @returns {Promise<Object|null>} Admin object or null
 */
const findByUsername = async (username) => {
    const rows = await db.select().from(admins).where(eq(admins.username, username));
    return rows[0] || null;
};

/**
 * Create a new admin
 * @param {string} username - The admin username
 * @param {string} passwordHash - The hashed password
 * @returns {Promise<Object>} Created admin object
 */
const createAdmin = async (username, passwordHash) => {
    const rows = await db.insert(admins).values({
        username,
        password_hash: passwordHash
    }).returning({
        id: admins.id,
        username: admins.username,
        created_at: admins.created_at
    });

    return rows[0];
};

/**
 * Find an admin by ID
 * @param {string} adminId - UUID of the admin
 * @returns {Promise<Object|null>} Admin object or null
 */
const findById = async (adminId) => {
    const rows = await db.select({
        id: admins.id,
        username: admins.username,
        created_at: admins.created_at
    }).from(admins).where(eq(admins.id, adminId));

    return rows[0] || null;
};

module.exports = {
    findByUsername,
    createAdmin,
    findById
};
