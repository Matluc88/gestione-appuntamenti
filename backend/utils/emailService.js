const sgMail = require('@sendgrid/mail');
const pool = require('../config/database');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const replaceVariables = (template, variables) => {
  let content = template;
  Object.keys(variables).forEach(key => {
    const placeholder = `[${key}]`;
    content = content.split(placeholder).join(variables[key]);
  });
  return content;
};

const logEmailActivity = async (appointmentId, emailType, status, error = null) => {
  try {
    await pool.query(
      `INSERT INTO email_logs (appointment_id, email_type, status, error_message, sent_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [appointmentId, emailType, status, error]
    );
  } catch (logError) {
    console.error('Error logging email activity:', logError);
  }
};

const sendEmailWithRetry = async (msg, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sgMail.send(msg);
      return { success: true, attempt };
    } catch (error) {
      lastError = error;
      console.warn(`Email send attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

const sendConfirmationEmail = async (appointment) => {
  try {
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE template_name = $1 AND is_active = true',
      ['confirmation']
    );

    if (templateResult.rows.length === 0) {
      await logEmailActivity(appointment.id, 'confirmation', 'failed', 'Template conferma non trovato');
      throw new Error('Template conferma non trovato');
    }

    const template = templateResult.rows[0];
    const cancelUrl = `${process.env.FRONTEND_URL}/cancella/${appointment.cancel_token}`;

    const variables = {
      Nome: `${appointment.customer_name} ${appointment.customer_surname}`,
      Servizio: appointment.service_type,
      Data: new Date(appointment.appointment_date).toLocaleDateString('it-IT'),
      Ora: appointment.appointment_time,
      Link: cancelUrl
    };

    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    const msg = {
      to: appointment.customer_email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const result = await sendEmailWithRetry(msg);
    await logEmailActivity(appointment.id, 'confirmation', 'sent');
    console.log(`✅ Email conferma inviata a: ${appointment.customer_email} (tentativo ${result.attempt})`);
    
    return { success: true };
  } catch (error) {
    await logEmailActivity(appointment.id, 'confirmation', 'failed', error.message);
    console.error('❌ Errore invio email conferma:', error.message);
    throw error;
  }
};

const sendCancellationEmail = async (appointment) => {
  try {
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE template_name = $1 AND is_active = true',
      ['cancellation']
    );

    if (templateResult.rows.length === 0) {
      await logEmailActivity(appointment.id, 'cancellation', 'failed', 'Template cancellazione non trovato');
      throw new Error('Template cancellazione non trovato');
    }

    const template = templateResult.rows[0];

    const variables = {
      Nome: `${appointment.customer_name} ${appointment.customer_surname}`,
      Servizio: appointment.service_type,
      Data: new Date(appointment.appointment_date).toLocaleDateString('it-IT'),
      Ora: appointment.appointment_time
    };

    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    const msg = {
      to: appointment.customer_email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const result = await sendEmailWithRetry(msg);
    await logEmailActivity(appointment.id, 'cancellation', 'sent');
    console.log(`✅ Email cancellazione inviata a: ${appointment.customer_email} (tentativo ${result.attempt})`);
    
    return { success: true };
  } catch (error) {
    await logEmailActivity(appointment.id, 'cancellation', 'failed', error.message);
    console.error('❌ Errore invio email cancellazione:', error.message);
    throw error;
  }
};

const sendReminderEmail = async (appointment, reminderType = '24h') => {
  try {
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE template_name = $1 AND is_active = true',
      ['reminder']
    );

    if (templateResult.rows.length === 0) {
      await logEmailActivity(appointment.id, `reminder_${reminderType}`, 'failed', 'Template reminder non trovato');
      throw new Error('Template reminder non trovato');
    }

    const template = templateResult.rows[0];

    const variables = {
      Nome: `${appointment.customer_name} ${appointment.customer_surname}`,
      Servizio: appointment.service_type,
      Data: new Date(appointment.appointment_date).toLocaleDateString('it-IT'),
      Ora: appointment.appointment_time
    };

    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    const msg = {
      to: appointment.customer_email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const result = await sendEmailWithRetry(msg);
    await logEmailActivity(appointment.id, `reminder_${reminderType}`, 'sent');
    console.log(`✅ Email reminder ${reminderType} inviata a: ${appointment.customer_email} (tentativo ${result.attempt})`);
    
    return { success: true };
  } catch (error) {
    await logEmailActivity(appointment.id, `reminder_${reminderType}`, 'failed', error.message);
    console.error(`❌ Errore invio email reminder ${reminderType}:`, error.message);
    throw error;
  }
};

const sendClosureNotificationEmail = async (appointment, closure) => {
  try {
    let templateName = 'closure_planned';
    if (closure.closure_type === 'emergency') {
      templateName = 'closure_emergency';
    } else if (closure.reason && closure.reason.toLowerCase().includes('estiv')) {
      templateName = 'closure_vacation';
    }

    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE template_name = $1 AND is_active = true',
      [templateName]
    );

    if (templateResult.rows.length === 0) {
      await logEmailActivity(appointment.id, 'closure', 'failed', `Template ${templateName} non trovato`);
      throw new Error(`Template ${templateName} non trovato`);
    }

    const template = templateResult.rows[0];

    const variables = {
      Nome: `${appointment.customer_name} ${appointment.customer_surname}`,
      Servizio: appointment.service_type,
      Data: new Date(appointment.appointment_date).toLocaleDateString('it-IT'),
      Ora: appointment.appointment_time,
      Motivo: closure.reason || 'motivi organizzativi',
      DataRiapertura: closure.end_date ? new Date(closure.end_date).toLocaleDateString('it-IT') : 'da definire'
    };

    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    const msg = {
      to: appointment.customer_email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const result = await sendEmailWithRetry(msg);
    await logEmailActivity(appointment.id, 'closure', 'sent');
    console.log(`✅ Email chiusura inviata a: ${appointment.customer_email} (tentativo ${result.attempt})`);
    
    return { success: true };
  } catch (error) {
    await logEmailActivity(appointment.id, 'closure', 'failed', error.message);
    console.error('❌ Errore invio email chiusura:', error.message);
    throw error;
  }
};

const scheduleReminders = async (appointment) => {
  try {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const now = new Date();
    
    const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    const reminder2h = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
    
    if (reminder24h > now) {
      await pool.query(
        `INSERT INTO email_reminders (appointment_id, reminder_type, scheduled_for, status) 
         VALUES ($1, $2, $3, $4)`,
        [appointment.id, '24h', reminder24h, 'scheduled']
      );
    }
    
    if (reminder2h > now) {
      await pool.query(
        `INSERT INTO email_reminders (appointment_id, reminder_type, scheduled_for, status) 
         VALUES ($1, $2, $3, $4)`,
        [appointment.id, '2h', reminder2h, 'scheduled']
      );
    }
    
    console.log(`📅 Reminder programmati per appuntamento ${appointment.id}`);
  } catch (error) {
    console.error('❌ Errore programmazione reminder:', error.message);
  }
};

const processPendingReminders = async () => {
  try {
    const now = new Date();
    
    const pendingReminders = await pool.query(
      `SELECT er.*, a.* FROM email_reminders er
       JOIN appointments a ON er.appointment_id = a.id
       WHERE er.status = 'scheduled' 
       AND er.scheduled_for <= $1 
       AND a.status = 'confirmed'
       ORDER BY er.scheduled_for ASC`,
      [now]
    );
    
    for (const reminder of pendingReminders.rows) {
      try {
        await sendReminderEmail(reminder, reminder.reminder_type);
        
        await pool.query(
          'UPDATE email_reminders SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['sent', reminder.id]
        );
        
        console.log(`✅ Reminder ${reminder.reminder_type} processato per appuntamento ${reminder.appointment_id}`);
      } catch (error) {
        await pool.query(
          'UPDATE email_reminders SET status = $1, error_message = $2 WHERE id = $3',
          ['failed', error.message, reminder.id]
        );
        
        console.error(`❌ Errore invio reminder ${reminder.reminder_type} per appuntamento ${reminder.appointment_id}:`, error.message);
      }
    }
    
    if (pendingReminders.rows.length > 0) {
      console.log(`📧 Processati ${pendingReminders.rows.length} reminder`);
    }
  } catch (error) {
    console.error('❌ Errore processing reminder:', error.message);
  }
};

const sendAdminNotification = async (appointment, notificationType = 'client_cancellation') => {
  try {
    const adminResult = await pool.query(
      'SELECT email FROM admin_users WHERE email IS NOT NULL LIMIT 1'
    );

    if (adminResult.rows.length === 0) {
      console.warn('⚠️ Nessun admin email configurato per notifiche');
      return { success: false, reason: 'No admin email configured' };
    }

    const adminEmail = adminResult.rows[0].email;
    
    const subject = `🚨 Cancellazione Cliente - ${appointment.service_type}`;
    const body = `
Ciao,

Un cliente ha appena cancellato il suo appuntamento:

👤 Cliente: ${appointment.customer_name} ${appointment.customer_surname}
📧 Email: ${appointment.customer_email}
📞 Telefono: ${appointment.customer_phone}
🗓️ Data: ${new Date(appointment.appointment_date).toLocaleDateString('it-IT')}
⏰ Ora: ${appointment.appointment_time}
🔧 Servizio: ${appointment.service_type}
📝 Note: ${appointment.notes || 'Nessuna nota'}

La cancellazione è avvenuta tramite il link email del cliente.

---
Sistema di Gestione Appuntamenti
    `.trim();

    const msg = {
      to: adminEmail,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Sistema Gestione Appuntamenti'
      },
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const result = await sendEmailWithRetry(msg);
    await logEmailActivity(appointment.id, 'admin_notification', 'sent');
    console.log(`✅ Notifica admin inviata a: ${adminEmail} (tentativo ${result.attempt})`);
    
    return { success: true };
  } catch (error) {
    await logEmailActivity(appointment.id, 'admin_notification', 'failed', error.message);
    console.error('❌ Errore invio notifica admin:', error.message);
    throw error;
  }
};

module.exports = {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendReminderEmail,
  sendClosureNotificationEmail,
  sendAdminNotification,
  scheduleReminders,
  processPendingReminders,
  logEmailActivity,
  replaceVariables
};
