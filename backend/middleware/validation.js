const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dati non validi',
      details: errors.array()
    });
  }
  next();
};

const validateAppointment = [
  body('service_type').notEmpty().withMessage('Tipo servizio richiesto'),
  body('customer_name').trim().isLength({ min: 2 }).withMessage('Nome minimo 2 caratteri'),
  body('customer_surname').trim().isLength({ min: 2 }).withMessage('Cognome minimo 2 caratteri'),
  body('customer_phone').isMobilePhone('it-IT').withMessage('Numero telefono non valido'),
  body('customer_email').isEmail().withMessage('Email non valida'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Note massimo 500 caratteri'),
  body('privacy_consent').equals('true').withMessage('Consenso privacy obbligatorio'),
  body('is_information_request').optional().isBoolean(),
  (req, res, next) => {
    if (!req.body.is_information_request) {
      if (!req.body.appointment_date) {
        return res.status(400).json({ error: 'Data appuntamento richiesta' });
      }
      if (!req.body.appointment_time) {
        return res.status(400).json({ error: 'Orario appuntamento richiesto' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.appointment_date)) {
        return res.status(400).json({ error: 'Formato data non valido' });
      }
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.appointment_time)) {
        return res.status(400).json({ error: 'Formato orario non valido' });
      }
    }
    next();
  },
  handleValidationErrors
];

const validateAdminLogin = [
  body('username').notEmpty().withMessage('Username richiesto'),
  body('password').isLength({ min: 6 }).withMessage('Password minimo 6 caratteri'),
  handleValidationErrors
];

module.exports = {
  validateAppointment,
  validateAdminLogin,
  handleValidationErrors
};
