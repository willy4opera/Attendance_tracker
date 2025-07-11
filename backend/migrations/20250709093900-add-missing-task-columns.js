'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to Tasks table
    await queryInterface.addColumn('Tasks', 'checklist', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('Tasks', 'cover_image', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Tasks', 'cover_color', {
      type: Sequelize.STRING(7),
      allowNull: true
    });

    await queryInterface.addColumn('Tasks', 'custom_fields', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns in reverse order
    await queryInterface.removeColumn('Tasks', 'custom_fields');
    await queryInterface.removeColumn('Tasks', 'cover_color');
    await queryInterface.removeColumn('Tasks', 'cover_image');
    await queryInterface.removeColumn('Tasks', 'checklist');
  }
};
