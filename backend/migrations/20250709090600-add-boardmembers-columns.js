'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add permissions column to BoardMembers table
    await queryInterface.addColumn('BoardMembers', 'permissions', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        canEditBoard: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canCreateLists: true,
        canEditLists: true,
        canDeleteLists: false,
        canCreateCards: true,
        canEditCards: true,
        canDeleteCards: true,
        canComment: true
      }
    });

    // Add is_active column to BoardMembers table
    await queryInterface.addColumn('BoardMembers', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Add index for is_active column
    await queryInterface.addIndex('BoardMembers', ['is_active']);

    // Add index for role column
    await queryInterface.addIndex('BoardMembers', ['role']);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback actions in reverse order
    await queryInterface.removeIndex('BoardMembers', ['role']);
    await queryInterface.removeIndex('BoardMembers', ['is_active']);
    await queryInterface.removeColumn('BoardMembers', 'is_active');
    await queryInterface.removeColumn('BoardMembers', 'permissions');
  }
};
