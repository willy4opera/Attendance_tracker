require('dotenv').config();
const { sendWelcomeEmailClean } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing clean formatted email...');

sendWelcomeEmailClean(testUser)
  .then(result => {
    console.log('Clean email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('This version uses proper table structure for better email client compatibility.');
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
