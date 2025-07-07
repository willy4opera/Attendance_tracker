require('dotenv').config();
const { sendWelcomeEmailMobile } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

console.log('Testing mobile-friendly email...');

sendWelcomeEmailMobile(testUser)
  .then(result => {
    console.log('Mobile-friendly email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Features:');
    console.log('- Responsive design with media queries');
    console.log('- Stacked layout for account details on mobile');
    console.log('- Full-width button on small screens');
    console.log('- Larger touch targets');
    console.log('- Optimized padding for mobile');
  })
  .catch(error => {
    console.error('Failed to send email:', error.message);
  });
