'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create CommentLikes table
    await queryInterface.createTable('CommentLikes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      comment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TaskComments',
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
      reaction_type: {
        type: Sequelize.ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry'),
        allowNull: false,
        defaultValue: 'like'
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

    // Add unique constraint to prevent duplicate likes
    await queryInterface.addConstraint('CommentLikes', {
      fields: ['comment_id', 'user_id'],
      type: 'unique',
      name: 'unique_comment_user_like'
    });

    // Add indexes
    await queryInterface.addIndex('CommentLikes', ['comment_id']);
    await queryInterface.addIndex('CommentLikes', ['user_id']);
    await queryInterface.addIndex('CommentLikes', ['reaction_type']);

    // Add like_count column to TaskComments
    await queryInterface.addColumn('TaskComments', 'like_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Add reaction_summary column to TaskComments
    await queryInterface.addColumn('TaskComments', 'reaction_summary', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {}
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns from TaskComments
    await queryInterface.removeColumn('TaskComments', 'reaction_summary');
    await queryInterface.removeColumn('TaskComments', 'like_count');
    
    // Drop CommentLikes table
    await queryInterface.dropTable('CommentLikes');
  }
};
