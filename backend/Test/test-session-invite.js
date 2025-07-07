#!/usr/bin/env node

// Test script for session invitation emails
require('dotenv').config();
const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const testEmail = 'biwillzcomp@gmail.com';
const testPassword = 'SecurePassword123!';

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

// Test session data
const testSession = {
  title: "Weekly Team Sync Meeting",
  description: "Our weekly team sync to discuss progress and blockers",
  sessionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
  startTime: "14:00",
  endTime: "15:00",
  meetingLink: "https://zoom.us/j/123456789",
  meetingType: "zoom",
  trackingEnabled: true,
  attendanceWindow: 15,
  isVirtual: true,
  capacity: 50,
  category: "Team Meeting",
  tags: ["weekly", "team", "sync"]
};

async function runTest() {
  log.header('SESSION INVITATION EMAIL TEST');
  log.divider();
  
  let authToken = null;
  let userId = null;
  
  try {
    // Step 1: Login to get auth token
    log.info('Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    authToken = loginResponse.data.token;
    userId = loginResponse.data.data.user.id;
    log.success(`Logged in as: ${loginResponse.data.data.user.firstName} ${loginResponse.data.data.user.lastName}`);
    
    // Step 2: Create a test session (as admin/moderator)
    log.info('\nStep 2: Creating test session...');
    log.info(`Title: ${testSession.title}`);
    log.info(`Date: ${testSession.sessionDate}`);
    log.info(`Time: ${testSession.startTime} - ${testSession.endTime}`);
    log.info(`Meeting Link: ${testSession.meetingLink}`);
    
    // Set facilitatorId to current user
    testSession.facilitatorId = userId;
    
    const sessionResponse = await axios.post(
      `${API_URL}/api/v1/sessions`,
      testSession,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const createdSession = sessionResponse.data.data.session;
    log.success(`Session created with ID: ${createdSession.id}`);
    
    // Step 3: Generate attendance link
    log.info('\nStep 3: Generating attendance link...');
    const attendanceLinkResponse = await axios.get(
      `${API_URL}/api/v1/sessions/${createdSession.id}/attendance-link`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const attendanceUrl = attendanceLinkResponse.data.data.attendanceUrl;
    log.success('Attendance link generated:');
    log.info(attendanceUrl);
    
    // Summary
    log.divider();
    log.header('TEST SUMMARY');
    log.success('✅ Session created successfully');
    log.success('✅ Invitation emails should be sent to all active users');
    log.success('✅ Attendance tracking link generated');
    
    log.info('\nCheck your email at: ' + testEmail);
    log.info('The email should contain:');
    log.info('- Session details');
    log.info('- Unique attendance tracking link');
    log.info('- Instructions for joining');
    
    log.divider();
    log.info('\nTo test the attendance marking:');
    log.info('1. Click the link in the email');
    log.info('2. You should be marked present');
    log.info('3. Then redirected to: ' + testSession.meetingLink);
    
  } catch (error) {
    log.error('Test failed!');
    
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Message: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      
      if (error.response.status === 403) {
        log.info('Note: You need admin or moderator role to create sessions');
        log.info('Update your user role in the database and try again');
      }
    } else if (error.request) {
      log.error('No response from server. Is the backend running?');
    } else {
      log.error(`Error: ${error.message}`);
    }
  }
}

// Run the test
runTest();
