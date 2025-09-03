const cron = require('node-cron');
const emailService = require('./emailService');

const startEmailReminderCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Checking for pending email reminders...');
    try {
      await emailService.processPendingReminders();
    } catch (error) {
      console.error('❌ Error in reminder cron job:', error.message);
    }
  });
  
  console.log('✅ Email reminder cron job started (every 5 minutes)');
};

const startDailyCleanup = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Running daily cleanup...');
    try {
      const pool = require('../config/database');
      
      await pool.query(
        'DELETE FROM email_logs WHERE sent_at < NOW() - INTERVAL \'30 days\''
      );
      
      await pool.query(
        'DELETE FROM email_reminders WHERE created_at < NOW() - INTERVAL \'30 days\' AND status != \'scheduled\''
      );
      
      console.log('✅ Daily cleanup completed');
    } catch (error) {
      console.error('❌ Error in daily cleanup:', error.message);
    }
  });
  
  console.log('✅ Daily cleanup cron job started (2:00 AM)');
};

module.exports = {
  startEmailReminderCron,
  startDailyCleanup
};
