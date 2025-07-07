# Socket.io Real-Time Features Implementation Guide

This guide provides a comprehensive overview of implementing Socket.io real-time features in the Attendance Tracker application based on the successful test implementation.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Server-Side Implementation](#server-side-implementation)
4. [Client-Side Implementation](#client-side-implementation)
5. [Authentication](#authentication)
6. [Event Types](#event-types)
7. [Room Management](#room-management)
8. [Testing](#testing)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

Socket.io enables real-time, bidirectional communication between the server and clients. In the Attendance Tracker, it's used for:
- Real-time attendance updates
- Live session status changes
- Instant notifications
- Session participant tracking

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐
│   Client    │ ←─────────────────→ │   Server    │
│ (Browser)   │                     │ (Node.js)   │
└─────────────┘                     └─────────────┘
      ↑                                    ↑
      │                                    │
      └── Socket.io Client ────────────────┘
```

## Server-Side Implementation

### 1. Socket.io Server Setup

```javascript
// src/sockets/index.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function initializeSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);
            
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user.id;
            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`User ${socket.user.email} connected`);

        // Handle events
        require('./sessionSocket')(io, socket);
        require('./attendanceSocket')(io, socket);

        socket.on('disconnect', () => {
            console.log(`User ${socket.user.email} disconnected`);
        });
    });

    return io;
}

module.exports = initializeSocket;
```

### 2. Session Socket Handler

```javascript
// src/sockets/sessionSocket.js
module.exports = (io, socket) => {
    // Join session room
    socket.on('joinSession', async (sessionId) => {
        try {
            socket.join(`session:${sessionId}`);
            console.log(`User ${socket.user.email} joined session ${sessionId}`);
            
            // Notify others in the session
            socket.to(`session:${sessionId}`).emit('userJoined', {
                userId: socket.userId,
                userName: `${socket.user.firstName} ${socket.user.lastName}`,
                timestamp: new Date()
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to join session' });
        }
    });

    // Leave session room
    socket.on('leaveSession', (sessionId) => {
        socket.leave(`session:${sessionId}`);
        socket.to(`session:${sessionId}`).emit('userLeft', {
            userId: socket.userId,
            timestamp: new Date()
        });
    });

    // Session updates
    socket.on('sessionUpdate', async (data) => {
        try {
            // Verify user has permission to update session
            if (socket.user.role !== 'admin' && socket.user.role !== 'moderator') {
                return socket.emit('error', { message: 'Unauthorized' });
            }

            // Broadcast update to all users in session
            io.to(`session:${data.sessionId}`).emit('sessionUpdated', {
                ...data,
                updatedBy: socket.userId,
                timestamp: new Date()
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to update session' });
        }
    });
};
```

### 3. Attendance Socket Handler

```javascript
// src/sockets/attendanceSocket.js
const { Attendance, Session } = require('../models');

module.exports = (io, socket) => {
    // Mark attendance
    socket.on('markAttendance', async (data) => {
        try {
            const { sessionId, location } = data;

            // Verify session exists and is active
            const session = await Session.findByPk(sessionId);
            if (!session || session.status !== 'active') {
                return socket.emit('error', { message: 'Invalid or inactive session' });
            }

            // Create or update attendance record
            const [attendance, created] = await Attendance.findOrCreate({
                where: {
                    userId: socket.userId,
                    sessionId: sessionId
                },
                defaults: {
                    status: 'present',
                    checkInTime: new Date(),
                    location: location
                }
            });

            // Emit to the student
            socket.emit('attendanceMarked', {
                success: true,
                attendance: attendance,
                message: 'Attendance marked successfully'
            });

            // Emit to instructor/moderator
            io.to(`session:${sessionId}`).emit('attendanceUpdate', {
                userId: socket.userId,
                userName: `${socket.user.firstName} ${socket.user.lastName}`,
                status: 'present',
                checkInTime: new Date(),
                sessionId: sessionId
            });

        } catch (error) {
            console.error('Error marking attendance:', error);
            socket.emit('error', { message: 'Failed to mark attendance' });
        }
    });

    // Get real-time attendance stats
    socket.on('getAttendanceStats', async (sessionId) => {
        try {
            const stats = await Attendance.count({
                where: { sessionId },
                group: ['status']
            });

            socket.emit('attendanceStats', {
                sessionId,
                stats,
                timestamp: new Date()
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to get attendance stats' });
        }
    });
};
```

## Client-Side Implementation

### 1. Socket.io Client Setup

```javascript
// client/src/services/socket.js
import io from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(token) {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinSession(sessionId) {
        this.socket?.emit('joinSession', sessionId);
    }

    leaveSession(sessionId) {
        this.socket?.emit('leaveSession', sessionId);
    }

    markAttendance(sessionId, location) {
        this.socket?.emit('markAttendance', { sessionId, location });
    }

    on(event, callback) {
        this.socket?.on(event, callback);
    }

    off(event, callback) {
        this.socket?.off(event, callback);
    }
}

export default new SocketService();
```

### 2. React Hook for Socket.io

```javascript
// client/src/hooks/useSocket.js
import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import socketService from '../services/socket';

export const useSocket = () => {
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            socketService.connect(token);
        }

        return () => {
            socketService.disconnect();
        };
    }, [token]);

    const joinSession = useCallback((sessionId) => {
        socketService.joinSession(sessionId);
    }, []);

    const leaveSession = useCallback((sessionId) => {
        socketService.leaveSession(sessionId);
    }, []);

    const markAttendance = useCallback((sessionId, location) => {
        socketService.markAttendance(sessionId, location);
    }, []);

    const onEvent = useCallback((event, callback) => {
        socketService.on(event, callback);
        
        return () => {
            socketService.off(event, callback);
        };
    }, []);

    return {
        joinSession,
        leaveSession,
        markAttendance,
        onEvent,
        socket: socketService.socket
    };
};
```

### 3. React Component Example

```javascript
// client/src/components/SessionAttendance.js
import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const SessionAttendance = ({ sessionId }) => {
    const { joinSession, leaveSession, markAttendance, onEvent } = useSocket();
    const [attendanceList, setAttendanceList] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Join session room
        joinSession(sessionId);

        // Set up event listeners
        const unsubscribeAttendance = onEvent('attendanceUpdate', (data) => {
            setAttendanceList(prev => [...prev, data]);
        });

        const unsubscribeMarked = onEvent('attendanceMarked', (data) => {
            setMessage(data.message);
        });

        const unsubscribeError = onEvent('error', (data) => {
            setMessage(data.message);
        });

        // Cleanup
        return () => {
            leaveSession(sessionId);
            unsubscribeAttendance();
            unsubscribeMarked();
            unsubscribeError();
        };
    }, [sessionId, joinSession, leaveSession, onEvent]);

    const handleMarkAttendance = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                markAttendance(sessionId, {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                console.error('Location error:', error);
                markAttendance(sessionId, null);
            }
        );
    };

    return (
        <div>
            <button onClick={handleMarkAttendance}>Mark Attendance</button>
            {message && <p>{message}</p>}
            <ul>
                {attendanceList.map((attendance, index) => (
                    <li key={index}>
                        {attendance.userName} - {attendance.status}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SessionAttendance;
```

## Authentication

Socket.io authentication is handled through JWT tokens:

1. **Client sends token**: Token is sent in the handshake auth object
2. **Server validates**: Middleware verifies JWT and attaches user to socket
3. **Persistent auth**: Token is stored and reused for reconnections

## Event Types

### Client → Server Events
- `joinSession`: Join a session room
- `leaveSession`: Leave a session room
- `markAttendance`: Mark attendance for a session
- `getAttendanceStats`: Request attendance statistics
- `sessionUpdate`: Update session details (admin/moderator only)

### Server → Client Events
- `attendanceMarked`: Confirmation of attendance marking
- `attendanceUpdate`: Real-time attendance updates
- `sessionUpdated`: Session details have been updated
- `userJoined`: User joined the session
- `userLeft`: User left the session
- `attendanceStats`: Attendance statistics response
- `error`: Error messages

## Room Management

Rooms are used to group users by session:
- Room naming: `session:${sessionId}`
- Users automatically join/leave rooms
- Broadcasts are scoped to room participants

## Testing

### Test Script Structure

```javascript
// test-socketio.js
const io = require('socket.io-client');
const axios = require('axios');

async function runTests() {
    // 1. Setup users (login/register)
    // 2. Create test session
    // 3. Connect sockets with auth
    // 4. Test event emissions
    // 5. Verify responses
    // 6. Cleanup
}
```

### Key Test Scenarios
1. **Connection**: Test authenticated connections
2. **Room Management**: Test joining/leaving sessions
3. **Attendance**: Test marking and receiving updates
4. **Permissions**: Test role-based access
5. **Error Handling**: Test invalid requests

## Best Practices

1. **Error Handling**
   - Always emit error events for failures
   - Provide meaningful error messages
   - Log errors server-side

2. **Security**
   - Validate all inputs
   - Check permissions before actions
   - Use authenticated connections only

3. **Performance**
   - Use rooms for targeted broadcasts
   - Limit event frequency (rate limiting)
   - Clean up listeners on disconnect

4. **Reliability**
   - Implement reconnection logic
   - Handle network interruptions
   - Queue critical events for retry

## Troubleshooting

### Common Issues

1. **Connection Failures**
   ```javascript
   // Check CORS settings
   // Verify token is being sent
   // Check server logs for auth errors
   ```

2. **Events Not Received**
   ```javascript
   // Verify room membership
   // Check event names match
   // Ensure listeners are registered
   ```

3. **Authentication Errors**
   ```javascript
   // Verify JWT secret matches
   // Check token expiration
   // Ensure user exists in database
   ```

### Debug Mode

Enable Socket.io debugging:
```javascript
// Client
localStorage.debug = 'socket.io-client:*';

// Server
DEBUG=socket.io:* node server.js
```

## Integration with Existing Features

1. **QR Code Attendance**: Emit attendance after QR scan
2. **Session Management**: Real-time session status updates
3. **Analytics**: Live attendance statistics
4. **Notifications**: Push real-time alerts

## Next Steps

1. Implement notification system
2. Add typing indicators for chat
3. Create admin dashboard with live stats
4. Add presence tracking
5. Implement offline queue for events
