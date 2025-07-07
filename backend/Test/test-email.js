require('dotenv').config();

const testEmail = async () => {
  console.log('Testing email configuration...');
  
  try {
    const { testEmailConfiguration, sendEmail } = require('./src/utils/email');
    
    // Test configuration
    const isValid = await testEmailConfiguration();
    if (!isValid) {
      console.error('Email configuration is invalid!');
      return;
    }
    
    console.log('Email configuration is valid. Sending test email...');
    
    // Send test email
    const info = await sendEmail({
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'Test Email - Attendance Tracker',
      html: '<h1>Test Email</h1><p>This is a test email from the Attendance Tracker system.</p>',
      text: 'This is a test email from the Attendance Tracker system.'
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
};

testEmail();
