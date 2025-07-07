// Test nodemailer with proper CommonJS syntax
const path = require('path');

console.log('Current directory:', __dirname);
console.log('Loading nodemailer...');

// Use explicit path to nodemailer
const nodemailerPath = path.join(__dirname, 'node_modules', 'nodemailer');
console.log('Nodemailer path:', nodemailerPath);

// Load nodemailer
let nodemailer;
try {
  nodemailer = require(nodemailerPath);
  console.log('Nodemailer loaded successfully');
  console.log('Type:', typeof nodemailer);
  console.log('Keys:', Object.keys(nodemailer));
} catch (error) {
  console.error('Error loading nodemailer:', error.message);
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Test the createTransporter function
console.log('\nTesting createTransporter...');
console.log('Type of createTransporter:', typeof nodemailer.createTransporter);

try {
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
  
  console.log('Transporter created successfully!');
  
  // Verify connection
  transporter.verify(function(error, success) {
    if (error) {
      console.error('Verification error:', error.message);
    } else {
      console.log('Server is ready to send emails');
      
      // Send test email
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,
        subject: 'Test Email - Nodemailer Fixed',
        text: 'This is a test email from the fixed nodemailer setup.',
        html: '<b>This is a test email from the fixed nodemailer setup.</b>'
      };
      
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.error('Send error:', error.message);
        } else {
          console.log('Email sent successfully!');
          console.log('Message ID:', info.messageId);
          console.log('Response:', info.response);
        }
      });
    }
  });
  
} catch (error) {
  console.error('Error creating transporter:', error.message);
  console.error('Stack:', error.stack);
}
