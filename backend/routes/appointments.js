const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { validateAppointment } = require('../middleware/validation');
const { isValidBookingDate, getAvailableSlots } = require('../utils/dateTime');
const emailService = require('../utils/emailService');

const router = express.Router();

router.post('/', validateAppointment, async (req, res) => {
  try {
    const {
      service_type,
      customer_name,
      customer_surname,
      customer_phone,
      customer_email,
      notes,
      appointment_date,
      appointment_time,
      patronato_service,
      files_uploaded = [],
      is_information_request = false,
      privacy_consent,
      marketing_consent = false
    } = req.body;

    // Only validate booking date for actual appointments
    if (!is_information_request) {
      if (!isValidBookingDate(appointment_date)) {
        return res.status(400).json({ error: 'Data non valida per prenotazione' });
      }

      const existingAppointment = await pool.query(
        'SELECT id FROM appointments WHERE appointment_date = $1 AND appointment_time = $2 AND status = $3',
        [appointment_date, appointment_time, 'confirmed']
      );

      if (existingAppointment.rows.length > 0) {
        return res.status(400).json({ error: 'Slot già occupato' });
      }
    }

    const cancelToken = uuidv4();

    const result = await pool.query(
      `INSERT INTO appointments 
       (service_type, customer_name, customer_surname, customer_phone, customer_email, 
        notes, appointment_date, appointment_time, cancel_token, files_uploaded, patronato_service,
        privacy_consent, marketing_consent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [service_type, customer_name, customer_surname, customer_phone, customer_email,
       notes, appointment_date || null, appointment_time || null, cancelToken, 
       JSON.stringify(files_uploaded), patronato_service, privacy_consent, marketing_consent]
    );

    const appointment = result.rows[0];

    try {
      if (is_information_request) {
        await emailService.sendInformationRequestEmail(appointment);
        await emailService.sendAdminInformationRequestEmail(appointment);
      } else {
        await emailService.sendConfirmationEmail(appointment);
        await emailService.sendAdminNotificationEmail(appointment);
        await emailService.scheduleReminders(appointment);
      }
    } catch (emailError) {
      console.error('Email error (request still created):', emailError.message);
    }

    res.status(201).json({
      success: true,
      appointment: {
        id: appointment.id,
        service_type: appointment.service_type,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        cancel_token: appointment.cancel_token,
        is_information_request: !appointment.appointment_date
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Errore nella creazione della richiesta' });
  }
});

router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!isValidBookingDate(date)) {
      return res.json({ available_slots: [] });
    }

    const dayOfWeek = new Date(date).getDay();
    const allSlots = getAvailableSlots(dayOfWeek);

    const bookedSlots = await pool.query(
      'SELECT appointment_time FROM appointments WHERE appointment_date = $1 AND status = $2',
      [date, 'confirmed']
    );

    const bookedTimes = bookedSlots.rows.map(row => row.appointment_time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ available_slots: availableSlots });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ error: 'Errore nel recupero disponibilità' });
  }
});

router.delete('/cancel/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const appointment = await pool.query(
      'SELECT * FROM appointments WHERE cancel_token = $1 AND status = $2',
      [token, 'confirmed']
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({ error: 'Appuntamento non trovato o già cancellato' });
    }

    const appointmentData = appointment.rows[0];
    
    if (!appointmentData.appointment_date || !appointmentData.appointment_time) {
      console.error('Dati appuntamento incompleti:', appointmentData);
      return res.status(400).json({ error: 'Dati appuntamento non validi' });
    }

    const appointmentDate = appointmentData.appointment_date; // YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    if (appointmentDate <= today) {
      return res.status(400).json({ error: 'Impossibile cancellare appuntamenti nella stessa giornata' });
    }

    await pool.query(
      'UPDATE appointments SET status = $1, cancelled_by = $2, updated_at = CURRENT_TIMESTAMP WHERE cancel_token = $3',
      ['cancelled', 'client', token]
    );

    await pool.query(
      'UPDATE email_reminders SET status = $1 WHERE appointment_id = $2 AND status = $3',
      ['cancelled', appointmentData.id, 'scheduled']
    );

    try {
      await emailService.sendCancellationEmail(appointmentData);
    } catch (emailError) {
      console.error('Email cancellation error (appointment still cancelled):', emailError.message);
    }

    res.json({ success: true, message: 'Appuntamento cancellato con successo' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Errore nella cancellazione dell\'appuntamento' });
  }
});

module.exports = router;
