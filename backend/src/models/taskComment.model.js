const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskComment = sequelize.define('TaskComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'task_id',
    references: {
      model: 'Tasks',
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Comment cannot be empty'
      }
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_id',
    references: {
      model: 'TaskComments',
      key: 'id'
    }
  },
  likeCount: {
    type: DataTypes.INTEGER,
    field: 'like_count',
    allowNull: false,
    defaultValue: 0
  },
  reactionSummary: {
    type: DataTypes.JSON,
    field: 'reaction_summary',
    allowNull: true,
    defaultValue: {}
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    field: 'is_edited',
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    field: 'edited_at',
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of attachment objects with url, type, name properties'
  }
}, {
  tableName: 'TaskComments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['task_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['like_count']
    }
  ]
});

module.exports = TaskComment;
