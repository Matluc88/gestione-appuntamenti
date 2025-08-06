const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✅ Database connesso');
});

pool.on('error', (err) => {
  console.error('❌ Errore database:', err);
});

module.exports = pool;
