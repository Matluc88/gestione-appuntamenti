const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./utils/initDatabase');
const { startEmailReminderCron, startDailyCleanup } = require('./utils/cronJobs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Troppe richieste, riprova tra 15 minuti'
});
app.use(limiter);

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:8081'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    console.log('Keep alive ping:', new Date().toISOString());
  }, 14 * 60 * 1000);
}

app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/services', require('./routes/services'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/closures', require('./routes/closures'));
app.use('/api/email-templates', require('./routes/emailTemplates'));
app.use('/api/upload', require('./routes/upload'));

app.get('/', (req, res) => {
  res.json({ 
    status: 'API funziona correttamente',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/services', '/api/appointments', '/api/admin', '/api/closures', '/api/upload'],
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Qualcosa è andato storto'
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Deployment timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 Server listening on 0.0.0.0:${PORT}`);
  
  try {
    await initializeDatabase();
    console.log('✅ Database initialization completed successfully');
    
    startEmailReminderCron();
    startDailyCleanup();
    
    if (process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM) {
      console.log('✅ Email service configured successfully');
      console.log(`📧 Email from: ${process.env.EMAIL_FROM}`);
    } else {
      console.warn('⚠️  Email service not configured - missing SENDGRID_API_KEY or EMAIL_FROM');
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('⚠️  Server continuing without database - some features may not work');
  }
});
