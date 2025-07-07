const { testEmailConfiguration, sendEmail } = require('./src/utils/email');

async function runTest() {
  console.log('Testing email configuration...');
  
  try {
    const isValid = await testEmailConfiguration();
    
    if (!isValid) {
      console.log('Email configuration is invalid');
      return;
    }
    
    console.log('Sending test email...');
    const info = await sendEmail({
      to: process.env.EMAIL_USER,
      subject: 'Test Email - Working!',
      text: 'This is a test email from the Attendance Tracker system.',
      html: '<h1>Test Email</h1><p>This is a test email from the Attendance Tracker system.</p>'
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest();
