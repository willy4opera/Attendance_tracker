'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new values to the enum type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_task_completion_logs_action" ADD VALUE IF NOT EXISTS 'submitted-for-review';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_task_completion_logs_action" ADD VALUE IF NOT EXISTS 'rejected';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    console.warn('Removing enum values requires manual database intervention in PostgreSQL');
  }
};
