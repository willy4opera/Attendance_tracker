'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Sessions', 'total_attendance', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: { min: 0 }
    });

    await queryInterface.addColumn('Sessions', 'files', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Sessions', 'total_attendance');
    await queryInterface.removeColumn('Sessions', 'files');
  }
};
