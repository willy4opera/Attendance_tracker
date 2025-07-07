require('dotenv').config();
const { sendWelcomeEmailHTML } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing HTML email with working nodemailer...');

sendWelcomeEmailHTML(testUser)
  .then(result => {
    console.log('HTML email sent successfully!');
    console.log('Message ID:', result.messageId);
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
