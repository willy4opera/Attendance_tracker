const cron = require('node-cron');
const { DependencyNotification } = require('../models');
const notificationController = require('../controllers/dependencies/dependencyNotification.controller');
const logger = require('../utils/logger');

// Process pending notifications every minute
const processPendingNotifications = async () => {
  try {
    logger.info('Processing pending dependency notifications...');
    
    const notifications = await DependencyNotification.getPendingNotifications(50);
    
    for (const notification of notifications) {
      try {
        await notificationController.processNotification(notification);
        logger.info(`Processed notification ${notification.id}`);
      } catch (error) {
        logger.error(`Failed to process notification ${notification.id}:`, error);
        
        // Retry logic
        if (notification.metadata.retryCount < 3) {
          await notification.retry();
        } else {
          await notification.markAsFailed('Max retries exceeded');
        }
      }
    }
    
    logger.info(`Processed ${notifications.length} notifications`);
  } catch (error) {
    logger.error('Error in notification processing job:', error);
  }
};

// Schedule the job to run every minute
const job = cron.schedule('* * * * *', processPendingNotifications, {
  scheduled: false
});

module.exports = {
  start: () => {
    job.start();
    logger.info('Dependency notification processing job started');
  },
  stop: () => {
    job.stop();
    logger.info('Dependency notification processing job stopped');
  },
  processPendingNotifications
};
