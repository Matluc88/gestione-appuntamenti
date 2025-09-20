#!/usr/bin/env node

const sgMail = require('@sendgrid/mail');
const dns = require('dns').promises;

require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

async function checkDNSRecords(domain) {
  log(colors.blue, `\n🔍 Checking DNS records for ${domain}...`);
  
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecord = txtRecords.find(record => 
      record.some(txt => txt.includes('v=spf1'))
    );
    
    if (spfRecord) {
      log(colors.green, '✅ SPF record found');
      console.log(`   ${spfRecord.join('')}`);
    } else {
      log(colors.red, '❌ SPF record not found');
    }
    
    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
      const dmarcRecord = dmarcRecords.find(record => 
        record.some(txt => txt.includes('v=DMARC1'))
      );
      
      if (dmarcRecord) {
        log(colors.green, '✅ DMARC record found');
        console.log(`   ${dmarcRecord.join('')}`);
      } else {
        log(colors.red, '❌ DMARC record not found');
      }
    } catch (error) {
      log(colors.red, '❌ DMARC record not found');
    }
    
    const dkimSelectors = ['default', 's1', 's2', 'sendgrid'];
    for (const selector of dkimSelectors) {
      try {
        const dkimRecords = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
        if (dkimRecords.length > 0) {
          log(colors.green, `✅ DKIM record found (${selector})`);
          break;
        }
      } catch (error) {
      }
    }
    
  } catch (error) {
    log(colors.red, `❌ Error checking DNS records: ${error.message}`);
  }
}

async function testEmailSending() {
  log(colors.blue, '\n📧 Testing email sending...');
  
  const testEmail = {
    to: process.env.TEST_EMAIL || 'test@example.com',
    from: {
      email: process.env.EMAIL_FROM,
      name: process.env.EMAIL_FROM_NAME || 'Nico Villano'
    },
    subject: 'Test Email Deliverability - Gestione Appuntamenti',
    text: 'This is a test email to verify deliverability configuration.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Test Email Deliverability</h2>
        <p>This is a test email to verify the deliverability configuration for the appointment management system.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${process.env.EMAIL_FROM}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Nico Villano - Consulenza Fiscale e Patronato<br>
          Via Corigliano 6<br>
          Tel: 3204283508
        </p>
      </div>
    `,
    headers: {
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM}?subject=Unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Entity-Ref-ID': `test-${Date.now()}`,
      'X-Mailer': 'Gestione Appuntamenti v1.0'
    },
    categories: ['transactional', 'deliverability-test'],
    customArgs: {
      test_type: 'deliverability',
      timestamp: Date.now().toString()
    }
  };
  
  try {
    await sgMail.send(testEmail);
    log(colors.green, '✅ Test email sent successfully');
    log(colors.yellow, `📬 Check inbox for: ${testEmail.to}`);
  } catch (error) {
    log(colors.red, `❌ Failed to send test email: ${error.message}`);
    if (error.response) {
      console.log('Response body:', error.response.body);
    }
  }
}

async function checkSendGridConfiguration() {
  log(colors.blue, '\n⚙️  Checking SendGrid configuration...');
  
  if (!process.env.SENDGRID_API_KEY) {
    log(colors.red, '❌ SENDGRID_API_KEY not found in environment');
    return false;
  }
  
  if (!process.env.EMAIL_FROM) {
    log(colors.red, '❌ EMAIL_FROM not found in environment');
    return false;
  }
  
  log(colors.green, '✅ SendGrid API key configured');
  log(colors.green, `✅ From email: ${process.env.EMAIL_FROM}`);
  
  return true;
}

async function generateDeliverabilityReport() {
  log(colors.blue, '\n📊 Email Deliverability Report');
  log(colors.blue, '================================');
  
  const domain = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.split('@')[1] : null;
  
  if (!domain) {
    log(colors.red, '❌ Cannot extract domain from EMAIL_FROM');
    return;
  }
  
  log(colors.yellow, `📧 Email Domain: ${domain}`);
  log(colors.yellow, `📧 From Address: ${process.env.EMAIL_FROM}`);
  log(colors.yellow, `📧 From Name: ${process.env.EMAIL_FROM_NAME || 'Not set'}`);
  
  const configOk = await checkSendGridConfiguration();
  
  if (configOk) {
    await checkDNSRecords(domain);
    
    if (process.env.TEST_EMAIL) {
      await testEmailSending();
    } else {
      log(colors.yellow, '⚠️  Set TEST_EMAIL environment variable to test email sending');
    }
  }
  
  log(colors.blue, '\n💡 Recommendations:');
  
  if (domain === 'libero.it') {
    log(colors.yellow, '⚠️  Using libero.it (free provider) - consider custom domain');
  }
  
  log(colors.green, '✅ Configure SPF record: v=spf1 include:sendgrid.net ~all');
  log(colors.green, '✅ Configure DKIM records via SendGrid dashboard');
  log(colors.green, '✅ Configure DMARC record: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.it');
  log(colors.green, '✅ Monitor delivery rates in SendGrid dashboard');
  
  log(colors.blue, '\n🔗 Useful Links:');
  console.log('   • SendGrid Domain Authentication: https://app.sendgrid.com/settings/sender_auth');
  console.log('   • Mail Tester: https://www.mail-tester.com/');
  console.log('   • MXToolbox: https://mxtoolbox.com/');
}

async function main() {
  console.log('🚀 Email Deliverability Test Tool');
  console.log('==================================\n');
  
  await generateDeliverabilityReport();
  
  log(colors.blue, '\n✨ Test completed!');
}

if (require.main === module) {
  main().catch(error => {
    log(colors.red, `❌ Error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkDNSRecords,
  testEmailSending,
  checkSendGridConfiguration,
  generateDeliverabilityReport
};
