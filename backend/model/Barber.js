const pool = require('../config/database');
const db = pool.db;
const { barbers } = require('../config/db/schema');
const { eq, asc, sql } = require('drizzle-orm');

/**
 * Fetch all barbers from the database
 * @returns {Promise<Array>} List of barbers
 */
const getAllBarber = async () => {
    return db.select().from(barbers).orderBy(asc(barbers.name));
};

/**
 * Fetch a single barber by ID
 * @param {string} barberId - UUID of the barber
 * @returns {Promise<Object|null>} Barber object or null if not found
 */
const getBarberById = async (barberId) => {
    const rows = await db.select().from(barbers).where(eq(barbers.id, barberId));
    return rows[0] || null;
};

/**
 * Create a new barber
 * @param {string} name - Name of the barber
 * @returns {Promise<Object>} The created barber 
 */
const createBarber = async (name) => {
    const rows = await db.insert(barbers).values({ name }).returning();
    return rows[0];
};

/**
 * Update an existing barber
 * @param {string} barberId - UUID of the barber
 * @param {string} name - New name
 * @returns {Promise<Object|null>} The updated barber or null
 */
const updateBarber = async (barberId, name) => {
    const rows = await db.update(barbers)
        .set({ name, updated_at: sql`CURRENT_TIMESTAMP` })
        .where(eq(barbers.id, barberId))
        .returning();

    return rows[0] || null;
};

/**
 * Delete a barber
 * @param {string} barberId - UUID of the barber
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
const deleteBarber = async (barberId) => {
    const rows = await db.delete(barbers).where(eq(barbers.id, barberId)).returning();
    return rows.length > 0;
};

module.exports = {
    getAllBarber,
    getBarberById,
    createBarber,
    updateBarber,
    deleteBarber
};
