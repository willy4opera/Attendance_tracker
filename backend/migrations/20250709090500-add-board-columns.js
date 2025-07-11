'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add background_image column to Boards table
    await queryInterface.addColumn('Boards', 'background_image', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add is_starred column to Boards table
    await queryInterface.addColumn('Boards', 'is_starred', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Add index for is_starred column
    await queryInterface.addIndex('Boards', ['is_starred']);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback actions in reverse order
    await queryInterface.removeIndex('Boards', ['is_starred']);
    await queryInterface.removeColumn('Boards', 'is_starred');
    await queryInterface.removeColumn('Boards', 'background_image');
  }
};
