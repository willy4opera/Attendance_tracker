require('dotenv').config();
const { sendWelcomeEmailCompact } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing compact email from working email.js...');

sendWelcomeEmailCompact(testUser)
  .then(result => {
    console.log('Compact email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('This compact version should display properly without footer being hidden.');
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
