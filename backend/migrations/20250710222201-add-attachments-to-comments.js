'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('TaskComments');
    
    if (!tableDescription.attachments) {
      // Add attachments column to TaskComments table
      await queryInterface.addColumn('TaskComments', 'attachments', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of attachment objects with url, type, name properties'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable('TaskComments');
    
    if (tableDescription.attachments) {
      // Remove the attachments column
      await queryInterface.removeColumn('TaskComments', 'attachments');
    }
  }
};
