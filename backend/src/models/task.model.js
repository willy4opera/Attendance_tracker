const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Task title cannot be empty'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  taskListId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'TaskLists',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assignedTo: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of user IDs
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done', 'cancelled'),
    defaultValue: 'todo'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  actualHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  labels: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of label objects {color, name}
  },
  checklist: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of checklist items {id, text, completed}
  },
  attachmentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coverColor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  watchers: {
    type: DataTypes.JSON,
    defaultValue: [] // Array of user IDs watching this task
  },
  customFields: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {
      votes: [],
      viewCount: 0,
      lastViewedBy: null,
      lastViewedAt: null
    }
  }
}, {
  tableName: 'Tasks',
  timestamps: true,
  indexes: [
    {
      fields: ['taskListId', 'position']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['isArchived']
    }
  ]
});

module.exports = Task;
