const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Board = sequelize.define('Board', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Board name cannot be empty'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'project_id',
    references: {
      model: 'Projects',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'department_id',
    references: {
      model: 'Departments',
      key: 'id'
    }
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
  backgroundColor: {
    type: DataTypes.STRING(7),
    field: 'color',
    defaultValue: '#0079BF',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  backgroundImage: {
    type: DataTypes.STRING,
    field: 'background_image',
    allowNull: true
  },
  visibility: {
    type: DataTypes.ENUM('private', 'department', 'organization', 'public'),
    defaultValue: 'private'
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    field: 'is_starred',
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    field: 'is_archived',
    defaultValue: false
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      cardCoverImages: true,
      voting: false,
      comments: true,
      invitations: 'members',
      selfJoin: false
    }
  }
}, {
  tableName: 'Boards',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['project_id']
    },
    {
      fields: ['department_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['is_archived']
    },
    {
      fields: ['is_starred']
    }
  ]
});

module.exports = Board;
