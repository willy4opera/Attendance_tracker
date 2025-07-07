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

// Test user registration and login
async function setupUsers() {
    try {
        console.log('\n=== Setting up test users ===');
        
        // Register student
        await axios.post(`${API_BASE_URL}/auth/register`, {
            firstName: 'Test',
            lastName: 'Student',
            email: 'student@test.com',
            password: 'password123',
            passwordConfirm: 'password123',
            passwordConfirm: 'password123',
            role: 'student'
        });
        
        // Register instructor
        await axios.post(`${API_BASE_URL}/auth/register`, {
            firstName: 'Test',
            lastName: 'Instructor',
            email: 'instructor@test.com',
            password: 'password123',
            passwordConfirm: 'password123',
            passwordConfirm: 'password123',
            role: 'instructor'
        });
        
        // Login student
        const studentLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'student@test.com',
            password: 'password123',
            passwordConfirm: 'password123'
        });
        studentToken = studentLogin.data.data.token;
        console.log("Student login response:", JSON.stringify(studentLogin.data, null, 2));
        console.log("Student token:", studentToken ? "Token exists" : "Token is undefined");
        
        // Login instructor
        const instructorLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'instructor@test.com',
            password: 'password123',
            passwordConfirm: 'password123'
        });
        instructorToken = instructorLogin.data.data.token;
        console.log("Instructor token:", instructorToken ? "Token exists" : "Token is undefined");
        
        console.log('✅ Users created and logged in successfully');
        
    } catch (error) {
        console.error('Error setting up users:', error.response?.data || error.message);
        throw error;
    }
}

// Test creating a session
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

// Test Socket.io connections and real-time features
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
        
        studentSocket.on('notification', (data) => {
            console.log('📨 Student received notification:', data);
        });
        
        studentSocket.on('attendanceMarked', (data) => {
            console.log('✅ Student attendance marked:', data);
        });
        
        studentSocket.on('error', (error) => {
            console.error('❌ Student socket error:', error);
        });
        
        // Set up instructor socket listeners
        instructorSocket.on('connect', () => {
            console.log('✅ Instructor connected to Socket.io');
            
            // Join session room
            instructorSocket.emit('joinSession', sessionId);
        });
        
        instructorSocket.on('joinedSession', (data) => {
            console.log('✅ Instructor joined session room:', data);
            
            // Now student joins
            studentSocket.emit('joinSession', sessionId);
        });
        
        instructorSocket.on('sessionStats', (stats) => {
            console.log('📊 Session stats update:', stats);
        });
        
        instructorSocket.on('newAttendance', (data) => {
            console.log('👤 New attendance recorded:', data);
        });
        
        instructorSocket.on('error', (error) => {
            console.error('❌ Instructor socket error:', error);
        });
        
        // Test attendance marking after student joins
        studentSocket.on('joinedSession', async (data) => {
            console.log('✅ Student joined session room:', data);
            
            // Simulate marking attendance
            setTimeout(async () => {
                console.log('\n=== Testing attendance marking ===');
                
                try {
                    // Mark attendance via REST API (which should trigger socket events)
                    const response = await axios.post(`${API_BASE_URL}/attendance/mark`, {
                        sessionId: sessionId,
                        status: 'present'
                    }, {
                        headers: { Authorization: `Bearer ${studentToken}` }
                    });
                    
                    console.log('✅ Attendance marked via API:', response.data.message);
                    
                } catch (error) {
                    console.error('Error marking attendance:', error.response?.data || error.message);
                }
                
                // Test notification
                setTimeout(() => {
                    console.log('\n=== Testing notifications ===');
                    instructorSocket.emit('sendNotification', {
                        sessionId: sessionId,
                        message: 'Test notification from instructor'
                    });
                    
                    // Clean up after tests
                    setTimeout(() => {
                        console.log('\n=== Cleaning up ===');
                        studentSocket.disconnect();
                        instructorSocket.disconnect();
                        console.log('✅ Sockets disconnected');
                        resolve();
                    }, 2000);
                }, 2000);
            }, 2000);
        });
    });
}

// Main test runner
async function runTests() {
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

// Run the tests
console.log('🚀 Starting Socket.io real-time feature tests...');
runTests();
