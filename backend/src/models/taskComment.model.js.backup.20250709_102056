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
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
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
    references: {
      model: 'TaskComments',
      key: 'id'
    }
  },
  mentions: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of mentioned user IDs
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of attachment URLs
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reactions: {
    type: DataTypes.JSON,
    defaultValue: {} // Object with emoji reactions and user IDs
  }
}, {
  tableName: 'TaskComments',
  timestamps: true,
  indexes: [
    {
      fields: ['taskId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['parentId']
    }
  ]
});

module.exports = TaskComment;
