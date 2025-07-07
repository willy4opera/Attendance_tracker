const winston = require('winston');
const path = require('path');
const config = require('../../../config/app.config.json');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.app.logging.level || 'info',
  format: logFormat,
  defaultMeta: { service: 'attendance-tracker' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add file transport in production
if (config.app.environment !== 'development') {
  logger.add(new winston.transports.File({
    filename: path.join(config.app.logging.directory, 'error.log'),
    level: 'error',
    maxsize: config.app.logging.maxSize || '20m',
    maxFiles: config.app.logging.maxFiles || 30
  }));

  logger.add(new winston.transports.File({
    filename: path.join(config.app.logging.directory, 'combined.log'),
    maxsize: config.app.logging.maxSize || '20m',
    maxFiles: config.app.logging.maxFiles || 30
  }));
}

module.exports = logger;
