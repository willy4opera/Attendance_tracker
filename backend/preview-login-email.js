require('dotenv').config();
const { sendLoginNotification } = require('./src/utils/email');
const fs = require('fs').promises;

async function previewLoginEmail() {
  // Extract just the HTML generation part
  const user = { firstName: 'BiWillz', email: 'biwillzcomp@gmail.com' };
  const loginDetails = { ipAddress: '192.168.1.1', userAgent: 'Chrome/91.0' };
  const timestamp = Date.now();
  const loginTime = new Date().toLocaleString('en-US', { 
    timeZone: 'UTC',
    dateStyle: 'full',
    timeStyle: 'medium'
  });
  
  console.log('Login notification details:');
  console.log('- Time:', loginTime);
  console.log('- IP:', loginDetails.ipAddress);
  console.log('- Device:', loginDetails.userAgent);
  console.log('- Subject: 🔐 New Login to Your Change Ambassadors Account');
  console.log('\nThis is a security alert email with:');
  console.log('- Orange/amber warning theme');
  console.log('- Lock emoji in subject and header');
  console.log('- Login details table');
  console.log('- Security warning message');
  console.log('- Action button to review account activity');
}

previewLoginEmail();
