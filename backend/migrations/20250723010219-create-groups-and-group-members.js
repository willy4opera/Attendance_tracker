'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Groups table
    await queryInterface.createTable('Groups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      group_admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: '{}'
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

    // Add indexes for Groups table
    await queryInterface.addIndex('Groups', ['name']);
    await queryInterface.addIndex('Groups', ['group_admin_id']);
    await queryInterface.addIndex('Groups', ['is_active']);

    // Create GroupMembers table
    await queryInterface.createTable('GroupMembers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Groups',
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
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      added_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Add indexes for GroupMembers table
    await queryInterface.addIndex('GroupMembers', ['group_id', 'user_id'], {
      unique: true,
      name: 'unique_group_user_membership'
    });
    await queryInterface.addIndex('GroupMembers', ['group_id']);
    await queryInterface.addIndex('GroupMembers', ['user_id']);
    await queryInterface.addIndex('GroupMembers', ['role']);
    await queryInterface.addIndex('GroupMembers', ['is_active']);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback actions in reverse order
    
    // Remove indexes for GroupMembers table
    await queryInterface.removeIndex('GroupMembers', ['is_active']);
    await queryInterface.removeIndex('GroupMembers', ['role']);
    await queryInterface.removeIndex('GroupMembers', ['user_id']);
    await queryInterface.removeIndex('GroupMembers', ['group_id']);
    await queryInterface.removeIndex('GroupMembers', 'unique_group_user_membership');
    
    // Drop GroupMembers table
    await queryInterface.dropTable('GroupMembers');
    
    // Remove indexes for Groups table
    await queryInterface.removeIndex('Groups', ['is_active']);
    await queryInterface.removeIndex('Groups', ['group_admin_id']);
    await queryInterface.removeIndex('Groups', ['name']);
    
    // Drop Groups table
    await queryInterface.dropTable('Groups');
  }
};
