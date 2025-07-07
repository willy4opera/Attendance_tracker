const jwt = require('jsonwebtoken');
const config = require('../../../config/app.config.json');
const logger = require('../utils/logger');

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.app.security.jwtSecret);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

// Setup socket handlers
const setupSocketHandlers = (io) => {
  // Apply authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected via WebSocket`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Handle joining session rooms
    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
      logger.info(`User ${socket.userId} joined session ${sessionId}`);
    });

    // Handle leaving session rooms
    socket.on('leave:session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      logger.info(`User ${socket.userId} left session ${sessionId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Socket event emitters
  return {
    emitToUser: (userId, event, data) => {
      io.to(`user:${userId}`).emit(event, data);
    },
    
    emitToSession: (sessionId, event, data) => {
      io.to(`session:${sessionId}`).emit(event, data);
    },
    
    emitToRole: (role, event, data) => {
      io.to(`role:${role}`).emit(event, data);
    },
    
    emitToAll: (event, data) => {
      io.emit(event, data);
    }
  };
};

module.exports = { setupSocketHandlers };
