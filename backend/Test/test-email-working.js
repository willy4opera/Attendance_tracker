require('dotenv').config();
const { sendWelcomeEmail } = require('./src/utils/email');

// Test user object
const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  department: 'IT Department'
};

console.log('Testing email with reverted working version...');

sendWelcomeEmail(testUser)
  .then(result => {
    console.log('Welcome email sent successfully!');
    console.log('Message ID:', result.messageId);
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
