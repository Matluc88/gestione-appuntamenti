const express = require('express');
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const emailService = require('../utils/emailService');

const router = express.Router();

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      closure_type,
      start_date,
      end_date,
      start_time,
      end_time,
      reason,
      is_recurring = false,
      recurring_pattern
    } = req.body;

    const result = await pool.query(
      `INSERT INTO closures 
       (closure_type, start_date, end_date, start_time, end_time, reason, is_recurring, recurring_pattern)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [closure_type, start_date, end_date, start_time, end_time, reason, is_recurring, recurring_pattern]
    );

    const closure = result.rows[0];

    let affectedAppointments = [];
    if (closure_type === 'full_day') {
      const appointmentsQuery = await pool.query(
        'SELECT * FROM appointments WHERE appointment_date BETWEEN $1 AND $2 AND status = $3',
        [start_date, end_date || start_date, 'confirmed']
      );
      affectedAppointments = appointmentsQuery.rows;
    } else if (closure_type === 'partial') {
      const appointmentsQuery = await pool.query(
        'SELECT * FROM appointments WHERE appointment_date = $1 AND appointment_time BETWEEN $2 AND $3 AND status = $4',
        [start_date, start_time, end_time, 'confirmed']
      );
      affectedAppointments = appointmentsQuery.rows;
    }

    if (affectedAppointments.length > 0) {
      await pool.query(
        'UPDATE appointments SET status = $1 WHERE id = ANY($2)',
        ['cancelled', affectedAppointments.map(a => a.id)]
      );

      await pool.query(
        'UPDATE closures SET affected_appointments = $1 WHERE id = $2',
        [affectedAppointments.length, closure.id]
      );

      for (const appointment of affectedAppointments) {
        await emailService.sendClosureNotificationEmail(appointment, closure);
      }

      await pool.query(
        'UPDATE closures SET email_sent = true WHERE id = $1',
        [closure.id]
      );
    }

    res.status(201).json({
      success: true,
      closure,
      affected_appointments: affectedAppointments.length
    });
  } catch (error) {
    console.error('Error creating closure:', error);
    res.status(500).json({ error: 'Errore nella creazione della chiusura' });
  }
});

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM closures ORDER BY start_date DESC, created_at DESC'
    );
    
    res.json({ closures: result.rows });
  } catch (error) {
    console.error('Error fetching closures:', error);
    res.status(500).json({ error: 'Errore nel recupero delle chiusure' });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM closures WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Chiusura eliminata con successo' });
  } catch (error) {
    console.error('Error deleting closure:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione della chiusura' });
  }
});

module.exports = router;
