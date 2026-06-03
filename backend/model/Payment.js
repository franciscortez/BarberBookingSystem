const pool = require('../config/database');

/**
 * Create a new payment record (status defaults to 'pending')
 * @param {Object} paymentData 
 * @returns {Promise<Object>} Created payment
 */
const createPayment = async (paymentData, client = pool) => {
    const { 
        appointment_id, 
        amount, 
        idempotency_key 
    } = paymentData;

    const query = `
        INSERT INTO Payments (appointment_id, amount, idempotency_key)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const { rows } = await client.query(query, [appointment_id, amount, idempotency_key]);
    return rows[0];
};

/**
 * Get payment by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
const getPaymentById = async (id, client = pool, forUpdate = false) => {
    const query = `
        SELECT * FROM Payments
        WHERE id = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
    `;
    const { rows } = await client.query(query, [id]);
    return rows[0] || null;
};

/**
 * Get payment by PayMongo Checkout ID
 * @param {string} checkoutId 
 * @returns {Promise<Object|null>}
 */
const getPaymentByCheckoutId = async (checkoutId, client = pool, forUpdate = false) => {
    const query = `
        SELECT * FROM Payments
        WHERE paymongo_checkout_id = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
    `;
    const { rows } = await client.query(query, [checkoutId]);
    return rows[0] || null;
};

/**
 * Update payment with PayMongo info and status
 * @param {string} id 
 * @param {Object} updateData - { paymongo_checkout_id, paymongo_payment_id, status }
 * @returns {Promise<Object|null>}
 */
const updatePayment = async (id, updateData, client = pool) => {
    const { paymongo_checkout_id, paymongo_payment_id, status } = updateData;
    
    let query = 'UPDATE Payments SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;

    if (paymongo_checkout_id !== undefined) {
        query += `, paymongo_checkout_id = $${paramCount++}`;
        values.push(paymongo_checkout_id);
    }
    if (paymongo_payment_id !== undefined) {
        query += `, paymongo_payment_id = $${paramCount++}`;
        values.push(paymongo_payment_id);
    }
    if (status !== undefined) {
        query += `, status = $${paramCount++}`;
        values.push(status);
    }

    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const { rows } = await client.query(query, values);
    return rows[0] || null;
};

/**
 * Get payment by Idempotency Key
 * @param {string} idempotencyKey 
 * @returns {Promise<Object|null>}
 */
const getPaymentByIdempotencyKey = async (idempotencyKey) => {
    const query = 'SELECT * FROM Payments WHERE idempotency_key = $1';
    const { rows } = await pool.query(query, [idempotencyKey]);
    return rows[0] || null;
};

module.exports = {
    createPayment,
    getPaymentById,
    getPaymentByCheckoutId,
    updatePayment,
    getPaymentByIdempotencyKey
};
