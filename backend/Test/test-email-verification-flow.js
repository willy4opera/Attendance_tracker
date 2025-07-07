const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testEmailVerificationFlow() {
  try {
    console.log('=== Email Verification Flow Test ===\n');
    
    // 1. Register a new user
    const testEmail = `testverify${Date.now()}@example.com`;
    console.log('1. Registering new user with email:', testEmail);
    
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email: testEmail,
        password: 'Test@123',
        passwordConfirm: 'Test@123',
        firstName: 'Test',
        lastName: 'Verify',
        phoneNumber: '+1234567890'
      });
      
      console.log('✓ User registered successfully');
      console.log('  User ID:', registerResponse.data.data.user.id);
      console.log('  Email Verified:', registerResponse.data.data.user.emailVerified);
      console.log();
    } catch (error) {
      console.error('Registration failed:', error.response?.data);
      return;
    }
    
    // 2. Check verification status
    console.log('2. Testing verification status check...');
    
    // First login to get token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: 'Test@123'
    });
    
    const { token } = loginResponse.data;
    console.log('✓ Login successful');
    
    // Check verification status
    try {
      const statusResponse = await axios.get(`${API_URL}/email-verification/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✓ Verification status:', statusResponse.data);
    } catch (error) {
      console.error('Status check failed:', error.response?.data);
    }
    
    console.log('\n3. Check server logs for verification token or email logs');
    console.log('   The verification email should have been sent to:', testEmail);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run test
testEmailVerificationFlow();
