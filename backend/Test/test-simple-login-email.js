require('dotenv').config();
const { sendEmail } = require('./src/utils/email');

// Test with a very simple email first
async function testSimpleEmail() {
  console.log('Testing with simple email...');
  
  try {
    const result = await sendEmail({
      to: 'biwillzcomp@gmail.com',
      subject: 'Simple Login Alert Test',
      html: '<h1>Login Test</h1><p>This is a simple test email.</p>',
      text: 'Login Test - This is a simple test email.'
    });
    
    console.log('✓ Simple email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }
}

testSimpleEmail();
