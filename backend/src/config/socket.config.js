const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class SocketManager {
  constructor() {
    this.io = null;
    this.users = new Map(); // Map of userId to socket IDs
    this.sessions = new Map(); // Map of sessionId to connected users
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('Socket.io initialized');
    return this.io;
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          attributes: ['id', 'email', 'firstName', 'lastName', 'role']
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`);
      
      // Store user's socket
      if (!this.users.has(socket.userId)) {
        this.users.set(socket.userId, new Set());
      }
      this.users.get(socket.userId).add(socket.id);

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Join role-based room
      socket.join(`role:${socket.user.role}`);

      // Handle joining session rooms
      socket.on('join-session', (sessionId) => {
        socket.join(`session:${sessionId}`);
        
        if (!this.sessions.has(sessionId)) {
          this.sessions.set(sessionId, new Set());
        }
        this.sessions.get(sessionId).add(socket.userId);
        
        // Notify others in the session
        socket.to(`session:${sessionId}`).emit('user-joined-session', {
          userId: socket.userId,
          user: socket.user
        });
      });

      // Handle leaving session rooms
      socket.on('leave-session', (sessionId) => {
        socket.leave(`session:${sessionId}`);
        
        if (this.sessions.has(sessionId)) {
          this.sessions.get(sessionId).delete(socket.userId);
          
          // Notify others in the session
          socket.to(`session:${sessionId}`).emit('user-left-session', {
            userId: socket.userId,
            user: socket.user
          });
        }
      });

      // Handle joining task rooms
      socket.on('join-task', (taskId) => {
        socket.join(`task:${taskId}`);
        console.log(`User ${socket.userId} joined task:${taskId}`);
      });

      // Handle leaving task rooms
      socket.on('leave-task', (taskId) => {
        socket.leave(`task:${taskId}`);
        console.log(`User ${socket.userId} left task:${taskId}`);
      });

      

      // Handle attendance marking
      socket.on('mark-attendance', (data) => {
        // Broadcast to session participants and admins
        this.broadcastAttendanceUpdate(data.sessionId, {
          type: 'attendance-marked',
          attendance: data.attendance,
          user: socket.user
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        
        // Remove socket from user's set
        if (this.users.has(socket.userId)) {
          this.users.get(socket.userId).delete(socket.id);
          
          // Remove user entry if no more sockets
          if (this.users.get(socket.userId).size === 0) {
            this.users.delete(socket.userId);
          }
        }

        // Remove from all sessions
        this.sessions.forEach((users, sessionId) => {
          if (users.has(socket.userId)) {
            users.delete(socket.userId);
            socket.to(`session:${sessionId}`).emit('user-left-session', {
              userId: socket.userId,
              user: socket.user
            });
          }
        });
      });
    });
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Emit to all users with specific role
  emitToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Emit to session participants
  emitToSession(sessionId, event, data) {
    this.io.to(`session:${sessionId}`).emit(event, data);
  }

  // Emit to all connected users
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Attendance specific broadcasts
  broadcastAttendanceUpdate(sessionId, data) {
    // Notify session participants
    this.emitToSession(sessionId, 'attendance-update', data);
    
    // Notify admins
    this.emitToRole('admin', 'attendance-update', data);
    
    // Notify moderators
    this.emitToRole('moderator', 'attendance-update', data);
  }

  // Session status update
  broadcastSessionUpdate(session, updateType) {
    const data = {
      type: updateType,
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime
      }
    };

    // Notify all users
    this.broadcast('session-update', data);
  }

  // Notification broadcast
  sendNotification(userId, notification) {
    this.emitToUser(userId, 'notification', {
      id: Date.now(),
      ...notification,
      timestamp: new Date()
    });
  }

  // Get connected users for a session
  getSessionUsers(sessionId) {
    return Array.from(this.sessions.get(sessionId) || []);
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.users.has(userId);
  }
}

module.exports = new SocketManager();
