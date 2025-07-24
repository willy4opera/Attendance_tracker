'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add assigned_departments column to Tasks table
    await queryInterface.addColumn('Tasks', 'assigned_departments', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
      defaultValue: []
    });

    // Create task_assignment_notifications table
    await queryInterface.createTable('task_assignment_notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'taskId',
        references: {
          model: 'Tasks',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      notificationType: {
        type: Sequelize.ENUM(
          'task_assigned',
          'task_reassigned',
          'department_assigned',
          'assignment_removed'
        ),
        allowNull: false,
        field: 'notificationType'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        allowNull: false
      },
      recipients: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      channels: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: ['inApp']
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      content: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'sentAt'
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('task_assignment_notifications', ['taskId']);
    await queryInterface.addIndex('task_assignment_notifications', ['status']);
    await queryInterface.addIndex('task_assignment_notifications', ['notificationType']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('task_assignment_notifications', ['notificationType']);
    await queryInterface.removeIndex('task_assignment_notifications', ['status']);
    await queryInterface.removeIndex('task_assignment_notifications', ['taskId']);
    
    // Drop task_assignment_notifications table
    await queryInterface.dropTable('task_assignment_notifications');
    
    // Remove assigned_departments column
    await queryInterface.removeColumn('Tasks', 'assigned_departments');
  }
};
