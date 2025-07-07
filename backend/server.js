const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Basic socket connection handler (stub for now)
io.on('connection', (socket) => {
  logger.info('New socket connection:', socket.id);
  
  socket.on('disconnect', () => {
    logger.info('Socket disconnected:', socket.id);
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
