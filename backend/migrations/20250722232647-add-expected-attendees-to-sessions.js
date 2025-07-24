'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add expected_attendees array field
    await queryInterface.addColumn('Sessions', 'expected_attendees', {
      type: Sequelize.ARRAY(Sequelize.UUID),
      defaultValue: [],
      allowNull: true,
      comment: 'Array of user IDs expected to attend this session'
    });

    // Add expected_attendees_count field for performance
    await queryInterface.addColumn('Sessions', 'expected_attendees_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'Cached count of expected attendees for performance'
    });

    // Add index for better query performance
    await queryInterface.addIndex('Sessions', ['expected_attendees_count']);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback actions in reverse order
    await queryInterface.removeIndex('Sessions', ['expected_attendees_count']);
    await queryInterface.removeColumn('Sessions', 'expected_attendees_count');
    await queryInterface.removeColumn('Sessions', 'expected_attendees');
  }
};
