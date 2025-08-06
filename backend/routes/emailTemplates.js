const express = require('express');
const pool = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM email_templates WHERE is_active = true ORDER BY template_name'
    );
    
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Errore nel recupero dei template email' });
  }
});

router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    const result = await pool.query(
      'UPDATE email_templates SET subject = $1, body = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [subject, body, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template non trovato' });
    }

    res.json({ success: true, template: result.rows[0] });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del template' });
  }
});

module.exports = router;
