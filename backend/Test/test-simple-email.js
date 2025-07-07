require('dotenv').config();
const { sendWelcomeEmail } = require('./src/utils/email-simple');

// Test user object
const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  department: 'IT Department'
};

console.log('Testing professional email template...');

sendWelcomeEmail(testUser)
  .then(result => {
    console.log('Professional welcome email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
