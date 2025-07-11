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
  action: {
    type: DataTypes.ENUM(
      'created',
      'moved',
      'renamed',
      'description_updated',
      'assigned',
      'unassigned',
      'due_date_added',
      'due_date_changed',
      'due_date_removed',
      'label_added',
      'label_removed',
      'checklist_added',
      'checklist_item_checked',
      'checklist_item_unchecked',
      'attachment_added',
      'attachment_removed',
      'comment_added',
      'archived',
      'unarchived',
      'completed',
      'reopened',
      'priority_changed',
      'status_changed'
    ),
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    defaultValue: {} // Store action-specific details
  },
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Boards',
      key: 'id'
    }
  }
}, {
  tableName: 'TaskActivities',
  timestamps: true,
  indexes: [
    {
      fields: ['taskId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = TaskActivity;
