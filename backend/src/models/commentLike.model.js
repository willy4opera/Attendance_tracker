const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommentLike = sequelize.define('CommentLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'comment_id',
    references: {
      model: 'TaskComments',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reactionType: {
    type: DataTypes.ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry'),
    field: 'reaction_type',
    allowNull: false,
    defaultValue: 'like'
  }
}, {
  tableName: 'CommentLikes',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['comment_id', 'user_id']
    },
    {
      fields: ['comment_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['reaction_type']
    }
  ]
});

module.exports = CommentLike;
