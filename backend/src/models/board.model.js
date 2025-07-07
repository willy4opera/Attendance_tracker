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
    references: {
      model: 'Projects',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  backgroundColor: {
    type: DataTypes.STRING(7),
    defaultValue: '#0079BF',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  visibility: {
    type: DataTypes.ENUM('private', 'department', 'organization', 'public'),
    defaultValue: 'department'
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
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
  indexes: [
    {
      fields: ['projectId']
    },
    {
      fields: ['departmentId']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['isArchived']
    }
  ]
});

module.exports = Board;
