const { createClient } = require('redis');
const config = require('../../../config/app.config.json');
const logger = require('../utils/logger');

// Redis configuration
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || config.app.redis.host,
    port: process.env.REDIS_PORT || config.app.redis.port
  },
  password: process.env.REDIS_PASSWORD || config.app.redis.password || undefined,
  database: process.env.REDIS_DB || config.app.redis.db
};

// Create Redis client
const redisClient = createClient(redisConfig);

// Redis error handling
redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Helper functions for Redis operations
const redisHelpers = {
  // Set key with expiration
  setEx: async (key, value, expiration) => {
    const prefixedKey = `${config.app.redis.keyPrefix}${key}`;
    await redisClient.setEx(prefixedKey, expiration, JSON.stringify(value));
  },

  // Get value by key
  get: async (key) => {
    const prefixedKey = `${config.app.redis.keyPrefix}${key}`;
    const value = await redisClient.get(prefixedKey);
    return value ? JSON.parse(value) : null;
  },

  // Delete key
  del: async (key) => {
    const prefixedKey = `${config.app.redis.keyPrefix}${key}`;
    await redisClient.del(prefixedKey);
  },

  // Check if key exists
  exists: async (key) => {
    const prefixedKey = `${config.app.redis.keyPrefix}${key}`;
    return await redisClient.exists(prefixedKey);
  }
};

module.exports = {
  redisClient,
  initializeRedis,
  redisHelpers
};
