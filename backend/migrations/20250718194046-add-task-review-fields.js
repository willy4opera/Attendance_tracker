'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add submittedForReviewAt field
    await queryInterface.addColumn('Tasks', 'submittedForReviewAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add approvedBy field
    await queryInterface.addColumn('Tasks', 'approvedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    });

    // Add approvedAt field
    await queryInterface.addColumn('Tasks', 'approvedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tasks', 'submittedForReviewAt');
    await queryInterface.removeColumn('Tasks', 'approvedBy');
    await queryInterface.removeColumn('Tasks', 'approvedAt');
  }
};
