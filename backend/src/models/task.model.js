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
    field: 'task_list_id',
    references: {
      model: 'TaskLists',
      key: 'id'
    }
  },
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'board_id',
    references: {
      model: 'Boards',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assignedTo: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    field: 'assigned_to',
    defaultValue: []
  },
  assignedDepartments: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    field: 'assigned_departments',
    defaultValue: []
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('todo', 'in-progress', 'under-review', 'done', 'archived'),
    defaultValue: 'todo'
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date',
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    field: 'start_date',
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
    allowNull: true
  },
  submittedForReviewAt: {
    type: DataTypes.DATE,
    field: "submitted_for_review_at",
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    field: "approved_by",
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: "approved_at",
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'estimated_hours',
    allowNull: true
  },
  actualHours: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'actual_hours',
    allowNull: true
  },
  labels: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  checklist: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  attachmentCount: {
    type: DataTypes.INTEGER,
    field: 'attachment_count',
    defaultValue: 0
  },
  commentCount: {
    type: DataTypes.INTEGER,
    field: 'comment_count',
    defaultValue: 0
  },
  watcherCount: {
    type: DataTypes.INTEGER,
    field: 'watcher_count',
    allowNull: false,
    defaultValue: 0
  },
  coverImage: {
    type: DataTypes.STRING,
    field: 'cover_image',
    allowNull: true
  },
  coverColor: {
    type: DataTypes.STRING(7),
    field: 'cover_color',
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    field: 'is_archived',
    defaultValue: false
  },
  customFields: {
    type: DataTypes.JSON,
    field: 'custom_fields',
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
  underscored: true,
  indexes: [
    {
      fields: ['board_id']
    },
    {
      fields: ['task_list_id', 'position']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['is_archived']
    },
    {
      fields: ['watcher_count']
    }
  ]
});

module.exports = Task;
