const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const config = require('../config/app.config.json');
const { initializeDatabase } = require('./src/config/database');
const { initializeRedis } = require('./src/config/redis');
const { setupSocketHandlers } = require('./src/config/socket');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || config.app.apiPort || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.app.cors.origin,
    credentials: config.app.cors.credentials
  }
});

// Setup Socket handlers
setupSocketHandlers(io);

// Make io accessible to our router
app.set('io', io);

// Initialize services
async function startServer() {
  try {
    // Initialize Database
    await initializeDatabase();
    logger.info('Database connected successfully');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis connected successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.app.environment}`);
    });
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
