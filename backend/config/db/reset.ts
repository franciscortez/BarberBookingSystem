import pool = require('../database');

const reset = async () => {
  console.log('Resetting database schema (dropping public schema)...');
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Public schema reset successfully!');
  } catch (error) {
    console.error('Error resetting schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

reset();
