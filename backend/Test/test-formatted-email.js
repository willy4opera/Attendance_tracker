require('dotenv').config();
const { sendWelcomeEmailFormatted } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing well-formatted compact email...');

sendWelcomeEmailFormatted(testUser)
  .then(result => {
    console.log('Formatted email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('This version should be properly formatted AND avoid Gmail quotation.');
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
