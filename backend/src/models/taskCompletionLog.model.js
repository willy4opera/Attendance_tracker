const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskCompletionLog = sequelize.define('TaskCompletionLog', {
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
  action: {
    type: DataTypes.ENUM('completed', 'uncompleted', 'submitted-for-review', 'rejected'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  uncompletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'uncompleted_at'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    allowNull: true
  }
}, {
  tableName: 'task_completion_logs',
  timestamps: true,
  underscored: true
});

module.exports = TaskCompletionLog;
