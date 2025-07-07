const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testEmailVerification() {
  try {
    console.log('=== Email Verification Test ===\n');
    
    // 1. Register a new user
    console.log('1. Registering new user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: 'testverify@example.com',
      password: 'Test@123',
      passwordConfirm: 'Test@123',
      firstName: 'Test',
      lastName: 'Verify',
      phoneNumber: '+1234567890',
      employeeId: 'EMP999',
      department: 'Testing'
    });
    
    console.log('✓ User registered successfully');
    console.log('  Response:', registerResponse.data);
    console.log('  Check email for verification link\n');
    
    // Wait a bit for email to be sent
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Try to resend verification email
    console.log('2. Testing resend verification email...');
    const resendResponse = await axios.post(`${API_URL}/email-verification/resend`, {
      email: 'testverify@example.com'
    });
    
    console.log('✓ Verification email resent successfully');
    console.log('  Response:', resendResponse.data);
    console.log();
    
    // 3. Check verification status (requires login)
    console.log('3. Logging in to check verification status...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'testverify@example.com',
      password: 'Test@123'
    });
    
    const { accessToken } = loginResponse.data.data;
    console.log('✓ Login successful');
    
    const statusResponse = await axios.get(`${API_URL}/email-verification/status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    console.log('✓ Verification status:', statusResponse.data.data);
    console.log();
    
    // 4. Simulate verification (in real scenario, user would click email link)
    console.log('4. To verify email:');
    console.log('   - Check the logs above for the verification token');
    console.log('   - Or check your email for the verification link');
    console.log('   - Visit: http://localhost:5000/api/v1/email-verification/verify/{token}');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    if (error.response?.status === 409) {
      console.log('\nNote: User already exists. You may want to use a different email for testing.');
    }
  }
}

// Run test
testEmailVerification();
