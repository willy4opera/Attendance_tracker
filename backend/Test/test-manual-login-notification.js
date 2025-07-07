require('dotenv').config();
const { sendLoginNotification } = require('./src/utils/email');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'biwillzcomp@gmail.com' // Replace with your actual email
};

// Test IP and user agent
const testIp = '192.168.1.100';
const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

console.log('Testing login notification email...');
console.log('To:', testUser.email);
console.log('Name:', testUser.name);
console.log('IP:', testIp);
console.log('User Agent:', testUserAgent);

sendLoginNotification(testUser, testIp, testUserAgent)
  .then(() => {
    console.log('✅ Login notification email sent successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error sending login notification email:', error);
    process.exit(1);
  });
