const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createMigrationsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await pool.query(createTableQuery);
}

async function getAppliedMigrations() {
  const result = await pool.query('SELECT filename FROM migrations ORDER BY filename');
  return result.rows.map(row => row.filename);
}

async function applyMigration(filename, migrationSql) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(migrationSql);
    
    await client.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Migration applied: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed: ${filename}`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    console.log('🔄 Checking for database migrations...');
    
    await createMigrationsTable();
    
    const appliedMigrations = await getAppliedMigrations();
    
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found, skipping migrations');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('📄 No migration files found');
      return;
    }
    
    for (const filename of migrationFiles) {
      if (!appliedMigrations.includes(filename)) {
        const migrationPath = path.join(migrationsDir, filename);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log(`🔄 Applying migration: ${filename}`);
        await applyMigration(filename, migrationSql);
      }
    }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

module.exports = { runMigrations };
