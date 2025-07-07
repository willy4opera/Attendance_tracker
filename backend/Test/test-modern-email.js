require('dotenv').config();
const { sendWelcomeEmail } = require('./src/utils/email');

// Test user object
const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'Administrator',
  department: 'IT Department'
};

console.log('Testing modern email template...');

sendWelcomeEmail(testUser)
  .then(result => {
    console.log('Modern welcome email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Check your inbox for a beautifully designed email!');
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
