const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const pool = require('../config/database');

router.get('/email-config', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      config: {
        sendgrid_configured: !!process.env.SENDGRID_API_KEY,
        sendgrid_key_length: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0,
        email_from_configured: !!process.env.EMAIL_FROM,
        email_from_value: process.env.EMAIL_FROM || 'NOT_SET'
      },
      database: {
        connected: false,
        templates_count: 0,
        error: null
      }
    };

    try {
      const dbTest = await pool.query('SELECT NOW()');
      diagnostics.database.connected = true;
      
      const templatesResult = await pool.query(
        'SELECT COUNT(*) FROM email_templates WHERE template_name = $1 AND is_active = true',
        ['confirmation']
      );
      diagnostics.database.templates_count = parseInt(templatesResult.rows[0].count);
    } catch (dbError) {
      diagnostics.database.error = dbError.message;
    }

    if (process.env.SENDGRID_API_KEY) {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        diagnostics.sendgrid_api_configured = true;
      } catch (sgError) {
        diagnostics.sendgrid_error = sgError.message;
      }
    }

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message
    });
  }
});

module.exports = router;
