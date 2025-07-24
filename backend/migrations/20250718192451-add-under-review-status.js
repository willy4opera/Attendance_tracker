'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check existing enum values and add new ones
    try {
      // Try to add 'under-review' after 'in_progress' (with underscore)
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Tasks_status" ADD VALUE IF NOT EXISTS 'under-review' AFTER 'in_progress';
      `);
    } catch (error) {
      console.log('Could not add under-review after in_progress, trying alternative approach');
      // If that fails, just add it to the end
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Tasks_status" ADD VALUE IF NOT EXISTS 'under-review';
      `);
    }
    
    // Also add 'archived' if it doesn't exist
    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_Tasks_status" ADD VALUE IF NOT EXISTS 'archived';
      `);
    } catch (error) {
      console.log('archived value might already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.warn('Removing enum values requires manual database intervention in PostgreSQL');
  }
};
