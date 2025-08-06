const sgMail = require('@sendgrid/mail');
const pool = require('../config/database');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const replaceVariables = (template, variables) => {
  let content = template;
  Object.keys(variables).forEach(key => {
    const placeholder = `[${key}]`;
    content = content.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  return content;
};

const sendConfirmationEmail = async (appointment) => {
  try {
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE template_name = $1 AND is_active = true',
      ['confirmation']
    );

    if (templateResult.rows.length === 0) {
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
      from: process.env.EMAIL_FROM,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    await sgMail.send(msg);
    console.log('Email conferma inviata a:', appointment.customer_email);
  } catch (error) {
    console.error('Errore invio email conferma:', error);
  }
};

const sendCancellationEmail = async (appointment) => {
  try {
    const templateResult = await pool.query(
      'SELECT * FROM email_templates WHERE template_name = $1 AND is_active = true',
      ['cancellation']
    );

    if (templateResult.rows.length === 0) {
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
      from: process.env.EMAIL_FROM,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    await sgMail.send(msg);
    console.log('Email cancellazione inviata a:', appointment.customer_email);
  } catch (error) {
    console.error('Errore invio email cancellazione:', error);
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
      from: process.env.EMAIL_FROM,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    await sgMail.send(msg);
    console.log('Email chiusura inviata a:', appointment.customer_email);
  } catch (error) {
    console.error('Errore invio email chiusura:', error);
  }
};

module.exports = {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendClosureNotificationEmail
};
