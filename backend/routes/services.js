const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY name'
    );
    
    res.json({ services: result.rows });
  } catch (error) {
    console.error('Error fetching services:', error);
    
    const fallbackServices = [
      {
        id: 1,
        name: 'Consulenza Fiscale',
        slug: 'consulenza-fiscale',
        requires_upload: false,
        requires_notes: false,
        has_options: false,
        service_options: []
      },
      {
        id: 2,
        name: 'Pratiche Patronato',
        slug: 'pratiche-patronato',
        requires_upload: false,
        requires_notes: false,
        has_options: true,
        service_options: ['Pensioni', 'Invalidità', 'Disoccupazione', 'Assegni familiari']
      },
      {
        id: 3,
        name: 'Consulenza Legale',
        slug: 'consulenza-legale',
        requires_upload: false,
        requires_notes: false,
        has_options: false,
        service_options: []
      }
    ];
    
    console.log('🔄 Using fallback services due to database unavailability');
    res.json({ services: fallbackServices });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM services WHERE slug = $1 AND is_active = true',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Servizio non trovato' });
    }
    
    res.json({ service: result.rows[0] });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Errore nel recupero del servizio' });
  }
});

module.exports = router;
