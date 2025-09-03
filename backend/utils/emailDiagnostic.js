const sgMail = require('@sendgrid/mail');
const pool = require('../config/database');

const diagnoseEmailSystem = async () => {
  console.log('🔍 DIAGNOSI SISTEMA EMAIL');
  console.log('========================');
  
  console.log('\n1. VARIABILI D\'AMBIENTE:');
  console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Configurata' : '❌ MANCANTE'}`);
  console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ MANCANTE'}`);
  
  if (process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('   SendGrid API: ✅ Configurata');
    } catch (error) {
      console.log(`   SendGrid API: ❌ Errore - ${error.message}`);
    }
  }
  
  console.log('\n2. DATABASE E TEMPLATE:');
  try {
    const templateCheck = await pool.query(
      'SELECT template_name, is_active FROM email_templates WHERE template_name = $1',
      ['confirmation']
    );
    
    if (templateCheck.rows.length > 0) {
      console.log(`   Template 'confirmation': ✅ Trovato (attivo: ${templateCheck.rows[0].is_active})`);
    } else {
      console.log('   Template \'confirmation\': ❌ NON TROVATO');
    }
    
    const logsTableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs')"
    );
    console.log(`   Tabella email_logs: ${logsTableCheck.rows[0].exists ? '✅ Esiste' : '❌ NON ESISTE'}`);
    
    const remindersTableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_reminders')"
    );
    console.log(`   Tabella email_reminders: ${remindersTableCheck.rows[0].exists ? '✅ Esiste' : '❌ NON ESISTE'}`);
    
  } catch (dbError) {
    console.log(`   Database: ❌ Errore connessione - ${dbError.message}`);
  }
  
  console.log('\n3. TEST INVIO EMAIL:');
  if (process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM) {
    try {
      const testMsg = {
        to: process.env.EMAIL_FROM, // Send to self for testing
        from: {
          email: process.env.EMAIL_FROM,
          name: 'Nico Villano'
        },
        subject: 'Test Sistema Email - Gestione Appuntamenti',
        text: 'Questo è un test del sistema email. Se ricevi questo messaggio, la configurazione è corretta!',
        html: '<p>Questo è un test del sistema email. Se ricevi questo messaggio, la configurazione è corretta!</p>'
      };
      
      await sgMail.send(testMsg);
      console.log('   Test invio: ✅ EMAIL INVIATA CON SUCCESSO');
      console.log(`   Controlla la casella: ${process.env.EMAIL_FROM}`);
    } catch (emailError) {
      console.log(`   Test invio: ❌ ERRORE - ${emailError.message}`);
      if (emailError.response && emailError.response.body) {
        console.log(`   Dettagli errore: ${JSON.stringify(emailError.response.body)}`);
      }
    }
  } else {
    console.log('   Test invio: ⏭️  SALTATO (configurazione mancante)');
  }
  
  console.log('\n========================');
  console.log('🔍 DIAGNOSI COMPLETATA');
};

module.exports = { diagnoseEmailSystem };

if (require.main === module) {
  require('dotenv').config();
  diagnoseEmailSystem().catch(console.error);
}
