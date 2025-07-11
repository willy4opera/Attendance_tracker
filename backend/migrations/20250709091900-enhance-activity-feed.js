'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add social activity types to TaskActivities
    await queryInterface.addColumn('TaskActivities', 'activity_type', {
      type: Sequelize.ENUM(
        'created', 'updated', 'deleted', 'assigned', 'unassigned', 
        'moved', 'archived', 'restored', 'commented', 'liked', 
        'followed', 'watched', 'unwatched', 'mentioned', 'attachment_added'
      ),
      allowNull: false,
      defaultValue: 'updated'
    });

    // Add metadata for rich activity details
    await queryInterface.addColumn('TaskActivities', 'metadata', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });

    // Add visibility settings
    await queryInterface.addColumn('TaskActivities', 'visibility', {
      type: Sequelize.ENUM('public', 'board', 'private'),
      allowNull: false,
      defaultValue: 'board'
    });

    // Add indexes for activity feed queries
    await queryInterface.addIndex('TaskActivities', ['activity_type']);
    await queryInterface.addIndex('TaskActivities', ['visibility']);
    await queryInterface.addIndex('TaskActivities', ['created_at']);
    await queryInterface.addIndex('TaskActivities', ['user_id', 'created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('TaskActivities', ['user_id', 'created_at']);
    await queryInterface.removeIndex('TaskActivities', ['created_at']);
    await queryInterface.removeIndex('TaskActivities', ['visibility']);
    await queryInterface.removeIndex('TaskActivities', ['activity_type']);
    
    // Remove columns
    await queryInterface.removeColumn('TaskActivities', 'visibility');
    await queryInterface.removeColumn('TaskActivities', 'metadata');
    await queryInterface.removeColumn('TaskActivities', 'activity_type');
  }
};
