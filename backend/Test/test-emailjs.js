require('dotenv').config();
const { testEmailConfiguration } = require('./src/utils/email');

async function runTest() {
  console.log('Testing email configuration with emailjs...');
  const success = await testEmailConfiguration();
  
  if (success) {
    console.log('Email test completed successfully!');
  } else {
    console.log('Email test failed.');
  }
}

runTest().catch(console.error);
