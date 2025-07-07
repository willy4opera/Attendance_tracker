const cron = require('node-cron');
const recurringSessionService = require('../services/recurringSession.service');
const logger = require('../utils/logger');

class RecurringSessionJob {
  constructor() {
    this.job = null;
  }

  start() {
    // Run every day at 2 AM
    this.job = cron.schedule('0 2 * * *', async () => {
      logger.info('Starting recurring session generation job');
      
      try {
        const results = await recurringSessionService.generateUpcomingSessions(30);
        
        logger.info(`Recurring session job completed. Generated sessions for ${results.length} series`, {
          results
        });
      } catch (error) {
        logger.error('Error in recurring session generation job:', error);
      }
    });

    logger.info('Recurring session generation job scheduled');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Recurring session generation job stopped');
    }
  }

  // Run job immediately (for testing)
  async runNow() {
    logger.info('Running recurring session generation job manually');
    
    try {
      const results = await recurringSessionService.generateUpcomingSessions(30);
      
      logger.info(`Manual job completed. Generated sessions for ${results.length} series`, {
        results
      });
      
      return results;
    } catch (error) {
      logger.error('Error in manual recurring session generation:', error);
      throw error;
    }
  }
}

module.exports = new RecurringSessionJob();
