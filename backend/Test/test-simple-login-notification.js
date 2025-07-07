require('dotenv').config();
const { sendLoginNotificationSimple } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'Computers'
};

const loginDetails = {
  ipAddress: '192.168.1.100',
  userAgent: 'Chrome Browser'
};

console.log('Testing simplified login notification...');

sendLoginNotificationSimple(testUser, loginDetails)
  .then(result => {
    console.log('✓ Simplified login notification sent!');
    console.log('Message ID:', result.messageId);
    console.log('Subject: Security Alert - New Login to Your Account');
  })
  .catch(error => {
    console.error('✗ Failed:', error.message);
  });
