const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Group = sequelize.define('Group', {
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
        msg: 'Group name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Group name must be between 2 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional description for the group'
  },
  groupAdminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'group_admin_id',
    comment: 'User ID of the group administrator'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether the group is active or not'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata for the group'
  }
}, {
  tableName: 'Groups',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['group_admin_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Group;
