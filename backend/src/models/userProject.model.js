const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserProject = sequelize.define('UserProject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Projects',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('member', 'lead', 'viewer'),
    defaultValue: 'member'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'UserProjects',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'projectId']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = UserProject;
