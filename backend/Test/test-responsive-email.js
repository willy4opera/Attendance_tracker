require('dotenv').config();
const { sendWelcomeEmailResponsive } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing ultimate responsive email...');

sendWelcomeEmailResponsive(testUser)
  .then(result => {
    console.log('Responsive email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('\nFeatures:');
    console.log('✓ Gradient logo badge');
    console.log('✓ Card-based account details');
    console.log('✓ Full-width button that works on all devices');
    console.log('✓ MSO conditional comments for Outlook');
    console.log('✓ Proper mobile scaling');
    console.log('✓ Touch-friendly tap targets');
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
