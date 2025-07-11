const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskActivity = sequelize.define('TaskActivity', {
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
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'board_id',
    references: {
      model: 'Boards',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.STRING(50),
    field: 'action',
    allowNull: false,
    defaultValue: 'updated'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  visibility: {
    type: DataTypes.ENUM('public', 'board', 'private'),
    allowNull: false,
    defaultValue: 'board'
  }
}, {
  tableName: 'TaskActivities',
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
      fields: ['board_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['visibility']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'created_at']
    }
  ]
});

module.exports = TaskActivity;
