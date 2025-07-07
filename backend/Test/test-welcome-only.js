require('dotenv').config();
const { sendWelcomeEmail } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing welcome email from cleaned utility...');

sendWelcomeEmail(testUser)
  .then(result => {
    console.log('✓ Welcome email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('The cleaned email utility is working properly.');
  })
  .catch(error => {
    console.error('✗ Failed:', error.message);
  });
