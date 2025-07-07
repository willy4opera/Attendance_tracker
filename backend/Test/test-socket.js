const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function for colored console logs
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Authentication helper
async function authenticate() {
  try {
    // First, try to login
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    return response.data.token;
  } catch (error) {
    log('Login failed, attempting to register...', 'yellow');
    // If login fails, register the user
    await axios.post(`${API_URL}/auth/register`, {
      ...testUser,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    });
    // Then login
    const response = await axios.post(`${API_URL}/auth/login`, testUser);
    return response.data.token;
  }
}

// Main test function
async function runTests() {
  log('\n=== Starting Socket.io Tests ===\n', 'bright');

  try {
    // Authenticate first
    log('Authenticating...', 'blue');
    const token = await authenticate();
    log('✓ Authentication successful', 'green');

    // Connect to Socket.io with authentication
    log('\nConnecting to Socket.io...', 'blue');
    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      }
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        log('✓ Connected to Socket.io', 'green');
        log(`  Socket ID: ${socket.id}`, 'cyan');
        resolve();
      });

      socket.on('connect_error', (error) => {
        log('✗ Connection failed', 'red');
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Test 1: Join Session
    log('\nTest 1: Joining session...', 'blue');
    socket.emit('joinSession', { sessionId: 'test-session-123' });
    
    await new Promise((resolve) => {
      socket.on('joinedSession', (data) => {
        log('✓ Joined session successfully', 'green');
        log(`  Session: ${data.sessionId}`, 'cyan');
        resolve();
      });
      setTimeout(resolve, 1000);
    });

    // Test 2: Check-in
    log('\nTest 2: Testing check-in...', 'blue');
    socket.emit('checkIn', {
      sessionId: 'test-session-123',
      studentId: 'student-456'
    });

    await new Promise((resolve) => {
      socket.on('attendanceUpdate', (data) => {
        log('✓ Received attendance update', 'green');
        log(`  Student: ${data.studentId}`, 'cyan');
        log(`  Status: ${data.status}`, 'cyan');
        resolve();
      });
      setTimeout(resolve, 1000);
    });

    // Test 3: Notifications
    log('\nTest 3: Testing notifications...', 'blue');
    
    // Listen for notifications
    socket.on('notification', (data) => {
      log('✓ Received notification', 'green');
      log(`  Type: ${data.type}`, 'cyan');
      log(`  Message: ${data.message}`, 'cyan');
    });

    // Trigger a notification by checking in late
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 15); // 15 minutes late
    
    socket.emit('checkIn', {
      sessionId: 'test-session-123',
      studentId: 'student-789',
      timestamp: currentTime.toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Real-time statistics
    log('\nTest 4: Testing real-time statistics...', 'blue');
    socket.emit('requestStats', { sessionId: 'test-session-123' });

    await new Promise((resolve) => {
      socket.on('statsUpdate', (data) => {
        log('✓ Received statistics update', 'green');
        log(`  Total: ${data.total}`, 'cyan');
        log(`  Present: ${data.present}`, 'cyan');
        log(`  Late: ${data.late}`, 'cyan');
        log(`  Absent: ${data.absent}`, 'cyan');
        resolve();
      });
      setTimeout(resolve, 1000);
    });

    // Test 5: Leave session
    log('\nTest 5: Leaving session...', 'blue');
    socket.emit('leaveSession', { sessionId: 'test-session-123' });

    await new Promise((resolve) => {
      socket.on('leftSession', (data) => {
        log('✓ Left session successfully', 'green');
        resolve();
      });
      setTimeout(resolve, 1000);
    });

    // Disconnect
    log('\nDisconnecting...', 'blue');
    socket.disconnect();
    log('✓ Disconnected successfully', 'green');

    log('\n=== All tests completed successfully! ===\n', 'green');

  } catch (error) {
    log('\n✗ Test failed with error:', 'red');
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the tests
runTests();
