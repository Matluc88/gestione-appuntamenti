const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validateAdminLogin } = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token non fornito' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, username, email FROM admin_users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utente non autorizzato' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ error: 'Token non valido' });
  }
});

router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!process.env.DATABASE_URL && username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 1, username: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: 1,
          username: 'admin',
          email: process.env.EMAIL_FROM || 'admin@example.com'
        }
      });
    }

    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    await pool.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

router.get('/appointments', authenticateAdmin, async (req, res) => {
  try {
    const { date, status } = req.query;
    
    let query = 'SELECT * FROM appointments';
    let params = [];
    let conditions = [];

    if (date) {
      conditions.push('appointment_date = $' + (params.length + 1));
      params.push(date);
    }

    if (status) {
      conditions.push('status = $' + (params.length + 1));
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY appointment_date, appointment_time';

    const result = await pool.query(query, params);
    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Errore nel recupero degli appuntamenti' });
  }
});

router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalAppointments = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE status = $1',
      ['confirmed']
    );

    const todayAppointments = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = $1 AND status = $2',
      [today, 'confirmed']
    );

    const serviceStats = await pool.query(
      'SELECT service_type, COUNT(*) as count FROM appointments WHERE status = $1 GROUP BY service_type ORDER BY count DESC',
      ['confirmed']
    );

    res.json({
      total_appointments: parseInt(totalAppointments.rows[0].count),
      today_appointments: parseInt(todayAppointments.rows[0].count),
      service_stats: serviceStats.rows
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
  }
});

module.exports = router;
