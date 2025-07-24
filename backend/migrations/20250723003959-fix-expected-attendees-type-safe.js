'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Add a temporary column with the correct type
    await queryInterface.addColumn('Sessions', 'expected_attendees_temp', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: []
    });

    // Step 2: Clear any existing data in the old column (since we can't convert UUID to INTEGER)
    await queryInterface.sequelize.query(
      'UPDATE "Sessions" SET expected_attendees_temp = ARRAY[]::integer[]'
    );

    // Step 3: Remove the old column
    await queryInterface.removeColumn('Sessions', 'expected_attendees');

    // Step 4: Rename the temp column to the correct name
    await queryInterface.renameColumn('Sessions', 'expected_attendees_temp', 'expected_attendees');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: Change back to UUID array
    await queryInterface.addColumn('Sessions', 'expected_attendees_temp', {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.removeColumn('Sessions', 'expected_attendees');
    await queryInterface.renameColumn('Sessions', 'expected_attendees_temp', 'expected_attendees');
  }
};
