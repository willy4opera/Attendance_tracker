const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://localhost:5173',
    credentials: true
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id;
    socket.user = decoded;
    
    logger.info(`Socket authenticated for user: ${decoded.id}`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`New socket connection: ${socket.id} (User: ${socket.userId})`);
  
  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  
  // Handle subscription to channels
  socket.on('subscribe', (channel) => {
    socket.join(channel);
    logger.info(`Socket ${socket.id} subscribed to ${channel}`);
  });
  
  // Handle unsubscription from channels
  socket.on('unsubscribe', (channel) => {
    socket.leave(channel);
    logger.info(`Socket ${socket.id} unsubscribed from ${channel}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id} (User: ${socket.userId}), reason: ${reason}`);
  });
});

// Make io accessible to our router
app.set('io', io);

// Initialize services
async function startServer() {
  try {
    // Initialize Database
    await connectDB();
    logger.info('Database connected successfully');

    // Start scheduled jobs
    const recurringSessionJob = require('./src/jobs/generateRecurringSessions.job');
    if (process.env.NODE_ENV !== 'test') {
      recurringSessionJob.start();
    }

    // Start server
    if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

// Start the server
startServer();
module.exports = app;
