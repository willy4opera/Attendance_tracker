require('dotenv').config();
const { sendWelcomeEmailWithTemplate } = require('./src/utils/email');

// Test user object
const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'Administrator',
  department: 'IT Department'
};

console.log('Testing email with MJML template...');

sendWelcomeEmailWithTemplate(testUser)
  .then(result => {
    console.log('Template email sent successfully!');
    console.log('Message ID:', result.messageId);
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
