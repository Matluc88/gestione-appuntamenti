# Database Setup Instructions

This document provides instructions for setting up the PostgreSQL database to fix the cancellation form errors.

## Prerequisites

- PostgreSQL 14 or later
- Node.js and npm

## Database Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   sudo apt update && sudo apt install -y postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Create database and user**:
   ```bash
   sudo -u postgres createdb gestione_appuntamenti
   sudo -u postgres psql -c "CREATE USER gestione_user WITH PASSWORD 'gestione_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gestione_appuntamenti TO gestione_user;"
   sudo -u postgres psql -c "ALTER USER gestione_user WITH SUPERUSER;"
   ```

3. **Initialize database schema**:
   ```bash
   cd /path/to/gestione-appuntamenti
   PGPASSWORD=gestione_password psql -h localhost -U gestione_user -d gestione_appuntamenti -f database/schema.sql
   ```

## Environment Configuration

Create the following environment files:

### Backend Environment (`backend/.env`)
```env
# Database Configuration
DATABASE_URL=postgresql://gestione_user:gestione_password@localhost:5432/gestione_appuntamenti

# JWT Configuration
JWT_SECRET=super-secret-jwt-key-for-development-only

# SendGrid Email Configuration (optional for testing)
SENDGRID_API_KEY=SG.test-key
EMAIL_FROM=nicovillano@libero.it

# Cloudinary Configuration (optional for testing)
CLOUDINARY_CLOUD_NAME=test-cloud
CLOUDINARY_API_KEY=test-key
CLOUDINARY_API_SECRET=test-secret

# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:8080

# Environment
NODE_ENV=development
PORT=3001
```

### Root Environment (`.env`)
```env
# Database
DATABASE_URL=postgresql://gestione_user:gestione_password@localhost:5432/gestione_appuntamenti

# Email Service (SendGrid) - optional for testing
SENDGRID_API_KEY=SG.test-key
EMAIL_FROM=nicovillano@libero.it

# Upload Service (Cloudinary) - optional for testing
CLOUDINARY_CLOUD_NAME=test-cloud
CLOUDINARY_API_KEY=test-key
CLOUDINARY_API_SECRET=test-secret

# App Settings
JWT_SECRET=super-secret-jwt-key-for-development-only
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:8080
API_URL=http://localhost:3001
```

## Running the Application

1. **Start Backend**:
   ```bash
   cd backend
   PORT=3001 npm run dev
   ```

2. **Start Admin Dashboard**:
   ```bash
   cd admin
   VITE_API_BASE_URL=http://localhost:3001 npm run dev
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   VITE_API_BASE_URL=http://localhost:3001 npm run dev
   ```

## Verification

- Backend should show: `✅ Database connesso` and `✅ Database initialization completed successfully`
- Admin login should work with `admin` / `admin123`
- Cancellation links should work without showing "Errore nella Cancellazione"
- Cancelled appointments should appear in admin dashboard with status "Cancellato da Cliente"

## Troubleshooting

- If you get "Peer authentication failed", use `-h localhost` in psql commands
- If backend shows database connection errors, verify PostgreSQL is running: `sudo systemctl status postgresql`
- If cancellation still shows errors, check that frontend is using correct API URL (port 3001)
