require('dotenv').config();
const { sendWelcomeEmail } = require('./src/utils/email-html');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'Administrator',
  department: 'IT Department'
};

console.log('Testing simple HTML email...');

sendWelcomeEmail(testUser)
  .then(result => {
    console.log('HTML email sent successfully!');
    console.log('Message ID:', result.messageId);
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
