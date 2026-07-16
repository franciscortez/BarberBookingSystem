const pool = require('../config/database');
const db = pool.db;
const { services, barbers } = require('../config/db/schema');
const { eq, asc, sql } = require('drizzle-orm');

/**
 * Fetch all services from the database with barber details
 * @returns {Promise<Array>} List of services
 */
const getAllServices = async () => {
    return db.select({
        id: services.id,
        barber_id: services.barber_id,
        name: services.name,
        description: services.description,
        total_price: services.total_price,
        downpayment_amount: services.downpayment_amount,
        duration_mins: services.duration_mins,
        created_at: services.created_at,
        updated_at: services.updated_at,
        barber_name: barbers.name
    })
    .from(services)
    .innerJoin(barbers, eq(services.barber_id, barbers.id))
    .orderBy(asc(services.name));
};

/**
 * Fetch services for a specific barber with barber details
 * @param {string} barberId - UUID of the barber
 * @returns {Promise<Array>} List of services
 */
const getServicesByBarber = async (barberId) => {
    return db.select({
        id: services.id,
        barber_id: services.barber_id,
        name: services.name,
        description: services.description,
        total_price: services.total_price,
        downpayment_amount: services.downpayment_amount,
        duration_mins: services.duration_mins,
        created_at: services.created_at,
        updated_at: services.updated_at,
        barber_name: barbers.name
    })
    .from(services)
    .innerJoin(barbers, eq(services.barber_id, barbers.id))
    .where(eq(services.barber_id, barberId))
    .orderBy(asc(services.name));
};

/**
 * Fetch a single service by ID
 * @param {string} serviceId - UUID of the service
 * @returns {Promise<Object|null>} Service object or null
 */
const getServiceById = async (serviceId) => {
    const rows = await db.select().from(services).where(eq(services.id, serviceId));
    return rows[0] || null;
};

/**
 * Create a new service
 * @param {Object} serviceData - Data for the new service
 * @returns {Promise<Object>} Created service
 */
const createService = async (serviceData) => {
    const { barber_id, name, description, total_price, downpayment_amount, duration_mins } = serviceData;
    const rows = await db.insert(services).values({
        barber_id,
        name,
        description,
        total_price,
        downpayment_amount,
        duration_mins
    }).returning();

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
    const rows = await db.update(services)
        .set({
            name,
            description,
            total_price,
            downpayment_amount,
            duration_mins,
            updated_at: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(services.id, serviceId))
        .returning();

    return rows[0] || null;
};

/**
 * Delete a service
 * @param {string} serviceId - UUID of the service
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
const deleteService = async (serviceId) => {
    const rows = await db.delete(services).where(eq(services.id, serviceId)).returning();
    return rows.length > 0;
};

module.exports = {
    getAllServices,
    getServicesByBarber,
    getServiceById,
    createService,
    updateService,
    deleteService
};
