require('dotenv').config();

async function testEmail() {
  delete require.cache[require.resolve('nodemailer')];
  const nodemailer = require('nodemailer');
  
  console.log('Creating transporter...');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Email server connection successful!');
    
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
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmail();
