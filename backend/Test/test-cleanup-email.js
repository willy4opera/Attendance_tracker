require('dotenv').config();
const { sendWelcomeEmail, testEmailConfiguration } = require('./src/utils/email');

const testUser = {
  email: 'biwillzcomp@gmail.com',
  firstName: 'BiWillz',
  lastName: 'User',
  role: 'Administrator'
};

async function testCleanup() {
  console.log('Testing cleaned-up email utility...\n');
  
  // Test configuration
  console.log('1. Testing email configuration...');
  const configValid = await testEmailConfiguration();
  console.log(`   Configuration: ${configValid ? '✓ Valid' : '✗ Invalid'}\n`);
  
  if (configValid) {
    // Test welcome email
    console.log('2. Testing welcome email...');
    try {
      const result = await sendWelcomeEmail(testUser);
      console.log('   ✓ Welcome email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('   Using responsive template with mobile optimization');
    } catch (error) {
      console.error('   ✗ Failed to send welcome email:', error.message);
    }
  }
  
  console.log('\nCleanup test completed!');
}

testCleanup();
