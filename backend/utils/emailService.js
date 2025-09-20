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

const createHtmlTemplate = (textContent, variables) => {
  const htmlContent = textContent.replace(/\n/g, '<br>');
  
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nico Villano - Servizi di Consulenza</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; margin: 0;">Nico Villano</h2>
    <p style="margin: 5px 0; color: #666;">Servizi di Consulenza Fiscale e Patronato</p>
  </div>
  
  <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    ${htmlContent}
  </div>
  
  <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 12px; color: #666;">
    <p><strong>Nico Villano</strong><br>
    Via Corigliano 6<br>
    Tel: 3204283508<br>
    Email: nicovillano@libero.it</p>
    
    <p style="margin-top: 15px;">
      Se non desideri più ricevere queste comunicazioni, 
      <a href="mailto:nicovillano@libero.it?subject=Richiesta%20Cancellazione%20Email" style="color: #007bff;">clicca qui per cancellarti</a>.
    </p>
  </div>
</body>
</html>`;
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
      replyTo: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: createHtmlTemplate(body, variables),
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': `appointment-${appointment.id}`,
        'X-Mailer': 'Gestione Appuntamenti v1.0'
      },
      categories: ['transactional', 'appointment-confirmation'],
      customArgs: {
        appointment_id: appointment.id.toString(),
        email_type: 'confirmation'
      }
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
      replyTo: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: createHtmlTemplate(body, variables),
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': `appointment-${appointment.id}`,
        'X-Mailer': 'Gestione Appuntamenti v1.0'
      },
      categories: ['transactional', 'appointment-cancellation'],
      customArgs: {
        appointment_id: appointment.id.toString(),
        email_type: 'cancellation'
      }
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
      replyTo: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: createHtmlTemplate(body, variables),
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': `appointment-${appointment.id}`,
        'X-Mailer': 'Gestione Appuntamenti v1.0'
      },
      categories: ['transactional', 'appointment-reminder'],
      customArgs: {
        appointment_id: appointment.id.toString(),
        email_type: 'reminder'
      }
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
      replyTo: {
        email: process.env.EMAIL_FROM,
        name: 'Nico Villano'
      },
      subject: subject,
      text: body,
      html: createHtmlTemplate(body, variables),
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': `appointment-${appointment.id}`,
        'X-Mailer': 'Gestione Appuntamenti v1.0'
      },
      categories: ['transactional', 'appointment-closure'],
      customArgs: {
        appointment_id: appointment.id.toString(),
        email_type: 'closure'
      }
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

module.exports = {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendReminderEmail,
  sendClosureNotificationEmail,
  scheduleReminders,
  processPendingReminders,
  logEmailActivity,
  replaceVariables
};
