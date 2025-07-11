'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create TaskWatchers table for better tracking
    await queryInterface.createTable('TaskWatchers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      is_watching: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      notification_settings: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          comments: true,
          assignments: true,
          dueDate: true,
          status: true
        }
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

    // Add unique constraint
    await queryInterface.addConstraint('TaskWatchers', {
      fields: ['task_id', 'user_id'],
      type: 'unique',
      name: 'unique_task_watcher'
    });

    // Add indexes
    await queryInterface.addIndex('TaskWatchers', ['task_id']);
    await queryInterface.addIndex('TaskWatchers', ['user_id']);
    await queryInterface.addIndex('TaskWatchers', ['is_watching']);

    // Add watcher_count column to Tasks
    await queryInterface.addColumn('Tasks', 'watcher_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove column from Tasks
    await queryInterface.removeColumn('Tasks', 'watcher_count');
    
    // Drop TaskWatchers table
    await queryInterface.dropTable('TaskWatchers');
  }
};
