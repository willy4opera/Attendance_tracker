'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create task_completion_logs table
    await queryInterface.createTable('task_completion_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      action: {
        type: Sequelize.ENUM('completed', 'uncompleted'),
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      uncompleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('task_completion_logs', ['task_id']);
    await queryInterface.addIndex('task_completion_logs', ['user_id']);
    await queryInterface.addIndex('task_completion_logs', ['action']);
    await queryInterface.addIndex('task_completion_logs', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('task_completion_logs', ['task_id']);
    await queryInterface.removeIndex('task_completion_logs', ['user_id']);
    await queryInterface.removeIndex('task_completion_logs', ['action']);
    await queryInterface.removeIndex('task_completion_logs', ['created_at']);
    
    // Drop the table
    await queryInterface.dropTable('task_completion_logs');
  }
};
