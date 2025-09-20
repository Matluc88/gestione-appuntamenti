const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
  try {
    console.log('🚀 Inizializzazione database...');
    
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const seedsPath = path.join(__dirname, '../../database/seeds.sql');
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Schema creato');
    
    const { runMigrations } = require('./migrationRunner');
    await runMigrations();
    
    const seeds = fs.readFileSync(seedsPath, 'utf8');
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
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
