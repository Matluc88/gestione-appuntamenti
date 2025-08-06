const { Pool } = require('pg');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
  try {
    console.log('🚀 Inizializzazione database...');
    
    const schema = fs.readFileSync('../database/schema.sql', 'utf8');
    await pool.query(schema);
    console.log('✅ Schema creato');
    
    const seeds = fs.readFileSync('../database/seeds.sql', 'utf8');
    await pool.query(seeds);
    console.log('✅ Dati iniziali inseriti');
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await pool.query(
      `INSERT INTO admin_users (username, password_hash, email) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (username) DO UPDATE SET 
       password_hash = EXCLUDED.password_hash`,
      [adminUsername, hashedPassword, process.env.EMAIL_FROM]
    );
    console.log('✅ Utente admin creato/aggiornato');
    
    console.log('🎉 Database inizializzato con successo!');
    console.log(`👤 Admin: ${adminUsername} / ${adminPassword}`);
  } catch (error) {
    console.error('❌ Errore inizializzazione database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
