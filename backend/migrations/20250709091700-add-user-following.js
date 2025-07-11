'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create UserFollowing table
    await queryInterface.createTable('UserFollowing', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      follower_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      followed_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    // Add unique constraint to prevent duplicate following
    await queryInterface.addConstraint('UserFollowing', {
      fields: ['follower_id', 'followed_id'],
      type: 'unique',
      name: 'unique_user_following'
    });

    // Add indexes
    await queryInterface.addIndex('UserFollowing', ['follower_id']);
    await queryInterface.addIndex('UserFollowing', ['followed_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop UserFollowing table
    await queryInterface.dropTable('UserFollowing');
  }
};
