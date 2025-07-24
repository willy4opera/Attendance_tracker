'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's check if the columns exist with wrong names and drop them
    const tableDescription = await queryInterface.describeTable('Tasks');
    
    // Drop incorrectly named columns if they exist
    if (tableDescription.submittedForReviewAt) {
      await queryInterface.removeColumn('Tasks', 'submittedForReviewAt');
    }
    if (tableDescription.approvedBy) {
      await queryInterface.removeColumn('Tasks', 'approvedBy');
    }
    if (tableDescription.approvedAt) {
      await queryInterface.removeColumn('Tasks', 'approvedAt');
    }
    
    // Add columns with correct snake_case names
    if (!tableDescription.submitted_for_review_at) {
      await queryInterface.addColumn('Tasks', 'submitted_for_review_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    
    if (!tableDescription.approved_by) {
      await queryInterface.addColumn('Tasks', 'approved_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      });
    }
    
    if (!tableDescription.approved_at) {
      await queryInterface.addColumn('Tasks', 'approved_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tasks', 'submitted_for_review_at');
    await queryInterface.removeColumn('Tasks', 'approved_by');
    await queryInterface.removeColumn('Tasks', 'approved_at');
  }
};
