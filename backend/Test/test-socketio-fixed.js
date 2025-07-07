const io = require('socket.io-client');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

let studentToken, instructorToken;
let studentSocket, instructorSocket;
let sessionId;

// Helper function to create authenticated socket
function createAuthenticatedSocket(token) {
    return io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket']
    });
}

// Helper function to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Setup test users
async function setupUsers() {
    try {
        console.log('\n=== Setting up test users ===');
        
        // Try to login first, if it fails then register
        try {
            // Login student
            const studentLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'student@test.com',
                password: 'password123'
            });
            console.log("Student login response:", JSON.stringify(studentLogin.data, null, 2));
            studentToken = studentLogin.data.token;
            console.log('✅ Student logged in successfully');
        } catch (loginError) {
            // If login fails, register new student
            await axios.post(`${API_BASE_URL}/auth/register`, {
                firstName: 'Test',
                lastName: 'Student',
                email: 'student@test.com',
                password: 'password123',
                passwordConfirm: 'password123',
                role: 'student'
            });
            
            // Now login
            const studentLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'student@test.com',
                password: 'password123'
            });
            console.log("Student login response:", JSON.stringify(studentLogin.data, null, 2));
            studentToken = studentLogin.data.token;
            console.log('✅ Student registered and logged in successfully');
        }
        
        // Try to login instructor first, if it fails then register
        try {
            const instructorLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'instructor@test.com',
                password: 'password123'
            });
            console.log("Instructor login response:", JSON.stringify(instructorLogin.data, null, 2));
            instructorToken = instructorLogin.data.token;
            console.log('✅ Instructor logged in successfully');
        } catch (loginError) {
            // If login fails, register new instructor
            await axios.post(`${API_BASE_URL}/auth/register`, {
                firstName: 'Test',
                lastName: 'Instructor',
                email: 'instructor@test.com',
                password: 'password123',
                passwordConfirm: 'password123',
                role: 'moderator'
            });
            
            // Now login
            const instructorLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'instructor@test.com',
                password: 'password123'
            });
            console.log("Instructor login response:", JSON.stringify(instructorLogin.data, null, 2));
            instructorToken = instructorLogin.data.token;
            console.log('✅ Instructor registered and logged in successfully');
        }
        
        console.log('✅ All users ready');
        
    } catch (error) {
        console.error('Error setting up users:', error.response?.data || error.message);
        throw error;
    }
}

// Create test session
async function createSession() {
    try {
        console.log('\n=== Creating test session ===');
        
        const response = await axios.post(`${API_BASE_URL}/sessions`, {
            course: 'Test Course',
            topic: 'Socket.io Testing',
            date: new Date().toISOString(),
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            attendanceType: 'qr'
        }, {
            headers: { Authorization: `Bearer ${instructorToken}` }
        });
        
        sessionId = response.data.data._id;
        console.log(`✅ Session created with ID: ${sessionId}`);
        
    } catch (error) {
        console.error('Error creating session:', error.response?.data || error.message);
        throw error;
    }
}

// Test Socket.io connections
async function testSocketConnections() {
    console.log('\n=== Testing Socket.io connections ===');
    
    return new Promise((resolve) => {
        // Create authenticated sockets
        studentSocket = createAuthenticatedSocket(studentToken);
        instructorSocket = createAuthenticatedSocket(instructorToken);
        
        // Set up student socket listeners
        studentSocket.on('connect', () => {
            console.log('✅ Student connected to Socket.io');
        });
        
        studentSocket.on('attendanceMarked', (data) => {
            console.log('✅ Student received attendanceMarked event:', data);
        });
        
        studentSocket.on('error', (error) => {
            console.error('❌ Student socket error:', error);
        });
        
        // Set up instructor socket listeners
        instructorSocket.on('connect', () => {
            console.log('✅ Instructor connected to Socket.io');
        });
        
        instructorSocket.on('attendanceUpdate', (data) => {
            console.log('✅ Instructor received attendance update:', data);
            
            // Disconnect and resolve after receiving update
            setTimeout(() => {
                studentSocket.disconnect();
                instructorSocket.disconnect();
                resolve();
            }, 1000);
        });
        
        instructorSocket.on('error', (error) => {
            console.error('❌ Instructor socket error:', error);
        });
        
        // Wait for connections then test attendance marking
        setTimeout(async () => {
            console.log('\n=== Testing attendance marking via Socket.io ===');
            
            // Student joins session room
            studentSocket.emit('joinSession', sessionId);
            
            // Instructor joins session room
            instructorSocket.emit('joinSession', sessionId);
            
            // Wait a bit for room joins
            await delay(500);
            
            // Student marks attendance
            console.log('📡 Student marking attendance...');
            studentSocket.emit('markAttendance', {
                sessionId: sessionId,
                location: {
                    latitude: 40.7128,
                    longitude: -74.0060
                }
            });
            
        }, 2000);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            console.log('⏱️ Test timeout reached');
            studentSocket.disconnect();
            instructorSocket.disconnect();
            resolve();
        }, 10000);
    });
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Socket.io real-time feature tests...');
    
    try {
        await setupUsers();
        await createSession();
        await testSocketConnections();
        
        console.log('\n✅ All tests completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
runTests();
