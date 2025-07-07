#!/usr/bin/env node

// Test suite for email functionality
require('dotenv').config();
const { sendWelcomeEmail, sendLoginNotification } = require('./src/utils/email');

// Test configuration
const testEmail = process.argv[2] || 'biwillzcomp@gmail.com';
const emailType = process.argv[3] || 'both'; // welcome, login, or both

// Test user data
const testUser = {
  email: testEmail,
  firstName: 'Test',
  lastName: 'User',
  role: 'User'
};

// Test login details
const loginDetails = {
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Color codes for terminal output
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

// Send welcome email
async function testWelcomeEmail() {
  log.header('Testing Welcome Email');
  log.info(`Sending to: ${testUser.email}`);
  
  try {
    const result = await sendWelcomeEmail(testUser);
    log.success('Welcome email sent successfully!');
    log.info(`Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    log.error('Failed to send welcome email');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

// Send login notification
async function testLoginNotification() {
  log.header('Testing Login Notification Email');
  log.info(`Sending to: ${testUser.email}`);
  log.info(`IP Address: ${loginDetails.ipAddress}`);
  log.info(`User Agent: ${loginDetails.userAgent}`);
  
  try {
    const result = await sendLoginNotification(testUser, loginDetails);
    log.success('Login notification sent successfully!');
    log.info(`Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    log.error('Failed to send login notification');
    log.error(`Error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.clear();
  log.header('EMAIL TEST SUITE');
  log.divider();
  
  log.info(`Email Configuration:`);
  log.info(`Host: ${process.env.EMAIL_HOST}`);
  log.info(`Port: ${process.env.EMAIL_PORT}`);
  log.info(`Secure: ${process.env.EMAIL_SECURE}`);
  log.info(`From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);
  
  let welcomeSuccess = false;
  let loginSuccess = false;
  
  // Add delay between emails to avoid rate limiting
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  if (emailType === 'welcome' || emailType === 'both') {
    welcomeSuccess = await testWelcomeEmail();
    if (emailType === 'both') await delay(2000); // 2 second delay
  }
  
  if (emailType === 'login' || emailType === 'both') {
    loginSuccess = await testLoginNotification();
  }
  
  // Summary
  log.divider();
  log.header('TEST SUMMARY');
  
  if (emailType === 'welcome' || emailType === 'both') {
    console.log(`Welcome Email: ${welcomeSuccess ? `${colors.green}PASSED${colors.reset}` : `${colors.red}FAILED${colors.reset}`}`);
  }
  
  if (emailType === 'login' || emailType === 'both') {
    console.log(`Login Notification: ${loginSuccess ? `${colors.green}PASSED${colors.reset}` : `${colors.red}FAILED${colors.reset}`}`);
  }
  
  log.divider();
  
  // Exit with appropriate code
  const allPassed = (emailType === 'welcome' ? welcomeSuccess : true) && 
                    (emailType === 'login' ? loginSuccess : true) &&
                    (emailType === 'both' ? welcomeSuccess && loginSuccess : true);
  
  process.exit(allPassed ? 0 : 1);
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}Email Test Suite${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node test-email-suite.js [email] [type]

${colors.yellow}Arguments:${colors.reset}
  email    Email address to send test emails to (default: biwillzcomp@gmail.com)
  type     Type of email to test: welcome, login, or both (default: both)

${colors.yellow}Examples:${colors.reset}
  node test-email-suite.js                              # Test both emails to default address
  node test-email-suite.js user@example.com            # Test both emails to specified address
  node test-email-suite.js user@example.com welcome    # Test only welcome email
  node test-email-suite.js user@example.com login      # Test only login notification
  node test-email-suite.js user@example.com both       # Test both emails

${colors.yellow}Options:${colors.reset}
  -h, --help    Show this help message
`);
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
