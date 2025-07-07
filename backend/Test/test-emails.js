const { sendWelcomeEmail, sendLoginNotification } = require('./utils/emailService');

// Test data
const testUser = {
  email: 'amanarora9848@gmail.com',
  name: 'Test User'
};

const testLoginData = {
  email: 'amanarora9848@gmail.com',
  name: 'Test User',
  loginTime: new Date().toISOString(),
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

console.log('Starting email tests...\n');

// Test 1: Welcome Email
console.log('Test 1: Sending Welcome Email...');
sendWelcomeEmail(testUser.email, testUser.name)
  .then(() => {
    console.log('✓ Welcome email sent successfully\n');
    
    // Test 2: Login Notification Email
    console.log('Test 2: Sending Login Notification Email...');
    return sendLoginNotification(
      testLoginData.email,
      testLoginData.name,
      testLoginData.loginTime,
      testLoginData.ipAddress,
      testLoginData.userAgent
    );
  })
  .then(() => {
    console.log('✓ Login notification email sent successfully\n');
    console.log('All email tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Email test failed:', error);
    process.exit(1);
  });
