'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename camelCase columns to snake_case
    await queryInterface.renameColumn('task_assignment_notifications', 'taskId', 'task_id');
    await queryInterface.renameColumn('task_assignment_notifications', 'notificationType', 'notification_type');
    await queryInterface.renameColumn('task_assignment_notifications', 'sentAt', 'sent_at');
    await queryInterface.renameColumn('task_assignment_notifications', 'createdAt', 'created_at');
    await queryInterface.renameColumn('task_assignment_notifications', 'updatedAt', 'updated_at');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to camelCase
    await queryInterface.renameColumn('task_assignment_notifications', 'task_id', 'taskId');
    await queryInterface.renameColumn('task_assignment_notifications', 'notification_type', 'notificationType');
    await queryInterface.renameColumn('task_assignment_notifications', 'sent_at', 'sentAt');
    await queryInterface.renameColumn('task_assignment_notifications', 'created_at', 'createdAt');
    await queryInterface.renameColumn('task_assignment_notifications', 'updated_at', 'updatedAt');
  }
};
