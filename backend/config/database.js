const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./db/schema');

require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
});

const db = drizzle(pool, { schema });

// Attach Drizzle client to the pool object for easy access
pool.db = db;

module.exports = pool;
