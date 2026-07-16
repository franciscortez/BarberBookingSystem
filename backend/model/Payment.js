const pool = require('../config/database');
const db = pool.db;
const { payments } = require('../config/db/schema');
const { eq, sql } = require('drizzle-orm');
const { drizzle } = require('drizzle-orm/node-postgres');

// Utility to acquire the correct drizzle instance depending on client parameter
const getDb = (client) => {
    if (client === pool) return db;
    if (client && typeof client.select === 'function') return client;
    // client is a raw pg client from a pool.connect() transaction
    return drizzle(client, { schema: require('../config/db/schema') });
};

/**
 * Create a new payment record (status defaults to 'pending')
 * @param {Object} paymentData 
 * @returns {Promise<Object>} Created payment
 */
const createPayment = async (paymentData, client = pool) => {
    const tx = getDb(client);
    const { appointment_id, amount, idempotency_key } = paymentData;
    const rows = await tx.insert(payments).values({
        appointment_id,
        amount,
        idempotency_key
    }).returning();

    return rows[0];
};

/**
 * Get payment by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getPaymentById = async (id, client = pool, forUpdate = false) => {
    const tx = getDb(client);
    let query = tx.select().from(payments).where(eq(payments.id, id));
    if (forUpdate) {
        query = query.for('update');
    }
    const rows = await query;
    return rows[0] || null;
};

/**
 * Get payment by PayMongo Checkout ID
 * @param {string} checkoutId 
 * @returns {Promise<Object|null>}
 */
const getPaymentByCheckoutId = async (checkoutId, client = pool, forUpdate = false) => {
    const tx = getDb(client);
    let query = tx.select().from(payments).where(eq(payments.paymongo_checkout_id, checkoutId));
    if (forUpdate) {
        query = query.for('update');
    }
    const rows = await query;
    return rows[0] || null;
};

/**
 * Update payment with PayMongo info and status
 * @param {string} id 
 * @param {Object} updateData - { paymongo_checkout_id, paymongo_payment_id, status }
 * @returns {Promise<Object|null>}
 */
const updatePayment = async (id, updateData, client = pool) => {
    const tx = getDb(client);
    const { paymongo_checkout_id, paymongo_payment_id, status } = updateData;
    
    const values = {
        updated_at: sql`CURRENT_TIMESTAMP`
    };

    if (paymongo_checkout_id !== undefined) {
        values.paymongo_checkout_id = paymongo_checkout_id;
    }
    if (paymongo_payment_id !== undefined) {
        values.paymongo_payment_id = paymongo_payment_id;
    }
    if (status !== undefined) {
        values.status = status;
    }

    const rows = await tx.update(payments)
        .set(values)
        .where(eq(payments.id, id))
        .returning();

    return rows[0] || null;
};

/**
 * Get payment by Idempotency Key
 * @param {string} idempotencyKey 
 * @returns {Promise<Object|null>}
 */
const getPaymentByIdempotencyKey = async (idempotencyKey) => {
    const rows = await db.select().from(payments).where(eq(payments.idempotency_key, idempotencyKey));
    return rows[0] || null;
};

module.exports = {
    createPayment,
    getPaymentById,
    getPaymentByCheckoutId,
    updatePayment,
    getPaymentByIdempotencyKey
};
