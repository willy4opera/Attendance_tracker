'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('task_dependencies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      predecessor_task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      successor_task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dependency_type: {
        type: Sequelize.ENUM('FS', 'SS', 'FF', 'SF'),
        allowNull: false,
        defaultValue: 'FS',
        comment: 'FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish'
      },
      lag_time: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Lag time in hours'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Additional metadata for the dependency'
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('task_dependencies', ['predecessor_task_id']);
    await queryInterface.addIndex('task_dependencies', ['successor_task_id']);
    await queryInterface.addIndex('task_dependencies', ['dependency_type']);
    await queryInterface.addIndex('task_dependencies', ['is_active']);
    
    // Add unique constraint to prevent duplicate dependencies
    await queryInterface.addIndex('task_dependencies', 
      ['predecessor_task_id', 'successor_task_id', 'dependency_type'], 
      {
        unique: true,
        name: 'unique_task_dependency'
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('task_dependencies');
  }
};
