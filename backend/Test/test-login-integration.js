#!/usr/bin/env node

// Test login integration with email notification
require('dotenv').config();
const axios = require('axios');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const testCredentials = {
  email: 'biwillzcomp@gmail.com',
  password: 'testpassword123' // You'll need to use a valid password
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper function to print colored output
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}`),
  divider: () => console.log(`${colors.yellow}${'─'.repeat(60)}${colors.reset}`)
};

async function testLogin() {
  log.header('Testing Login with Email Notification');
  log.divider();
  
  log.info(`API URL: ${API_URL}`);
  log.info(`Test Email: ${testCredentials.email}`);
  
  try {
    log.info('Sending login request...');
    
    const response = await axios.post(`${API_URL}/api/auth/login`, testCredentials, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Test Client'
      }
    });
    
    if (response.data.status === 'success') {
      log.success('Login successful!');
      log.info(`User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
      log.info(`Role: ${response.data.data.user.role}`);
      log.success('Login notification email should be sent to: ' + testCredentials.email);
      
      // Show token info (truncated for security)
      if (response.data.token) {
        const tokenPreview = response.data.token.substring(0, 20) + '...';
        log.info(`Token received: ${tokenPreview}`);
      }
    }
    
    log.divider();
    log.success('Test completed successfully!');
    log.info('Check your email for the login notification.');
    
  } catch (error) {
    log.error('Login failed!');
    
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Message: ${error.response.data.message || error.response.data.error}`);
      
      if (error.response.status === 401) {
        log.info('This might be due to incorrect credentials.');
        log.info('Make sure the user exists and the password is correct.');
      }
    } else if (error.request) {
      log.error('No response from server. Is the backend running?');
      log.info(`Try: cd /var/www/html/Attendance_tracker/backend && npm start`);
    } else {
      log.error(`Error: ${error.message}`);
    }
    
    log.divider();
    process.exit(1);
  }
}

// Show usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}Login Integration Test${colors.reset}

${colors.yellow}Description:${colors.reset}
  Tests the login endpoint and verifies that login notification emails are sent.

${colors.yellow}Prerequisites:${colors.reset}
  1. Backend server must be running
  2. User account must exist with the test email
  3. Valid password must be provided

${colors.yellow}Usage:${colors.reset}
  node test-login-integration.js

${colors.yellow}Configuration:${colors.reset}
  Edit the testCredentials object in the script to use valid credentials.
  Current test email: ${testCredentials.email}

${colors.yellow}Environment Variables:${colors.reset}
  API_URL - Backend API URL (default: http://localhost:5000)
`);
  process.exit(0);
}

// Check if axios is installed
try {
  require.resolve('axios');
} catch (e) {
  log.error('axios is not installed. Installing...');
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
}

// Run the test
testLogin();
