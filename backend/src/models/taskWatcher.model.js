const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskWatcher = sequelize.define('TaskWatcher', {
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
  isWatching: {
    type: DataTypes.BOOLEAN,
    field: 'is_watching',
    allowNull: false,
    defaultValue: true
  },
  notificationSettings: {
    type: DataTypes.JSON,
    field: 'notification_settings',
    allowNull: true,
    defaultValue: {
      comments: true,
      assignments: true,
      dueDate: true,
      status: true
    }
  }
}, {
  tableName: 'TaskWatchers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['task_id', 'user_id']
    },
    {
      fields: ['task_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_watching']
    }
  ]
});

module.exports = TaskWatcher;
