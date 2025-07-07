require('dotenv').config();
const { sendWelcomeEmailCompact } = require('./src/utils/email-compact');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing compact HTML email...');

sendWelcomeEmailCompact(testUser)
  .then(result => {
    console.log('Compact email sent successfully!');
    console.log('Message ID:', result.messageId);
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
