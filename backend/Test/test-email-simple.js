require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Nodemailer type:', typeof nodemailer);
console.log('createTransport type:', typeof nodemailer.createTransport);

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmail() {
  try {
    console.log('Verifying email configuration...');
    await transporter.verify();
    console.log('Email configuration is valid!');
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: 'Test Email - Attendance Tracker',
      text: 'This is a test email from the Attendance Tracker system.',
      html: '<h1>Test Email</h1><p>This is a test email from the Attendance Tracker system.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmail();
