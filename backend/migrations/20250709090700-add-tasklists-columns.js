'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add watched_by column to TaskLists table
    await queryInterface.addColumn('TaskLists', 'watched_by', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    // Add settings column to TaskLists table
    await queryInterface.addColumn('TaskLists', 'settings', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        limitCards: false,
        maxCards: null,
        showCardCount: true
      }
    });

    // Add index for is_archived column
    await queryInterface.addIndex('TaskLists', ['is_archived']);

    // Add composite index for board_id and position
    await queryInterface.addIndex('TaskLists', ['board_id', 'position']);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback actions in reverse order
    await queryInterface.removeIndex('TaskLists', ['board_id', 'position']);
    await queryInterface.removeIndex('TaskLists', ['is_archived']);
    await queryInterface.removeColumn('TaskLists', 'settings');
    await queryInterface.removeColumn('TaskLists', 'watched_by');
  }
};
