const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'group_id',
    comment: 'Reference to the group'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    comment: 'Reference to the user'
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
    comment: 'Role of the user in the group'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'joined_at',
    comment: 'When the user joined the group'
  },
  addedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'added_by',
    comment: 'User ID who added this member to the group'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Whether the membership is active'
  }
}, {
  tableName: 'GroupMembers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['group_id', 'user_id']
    },
    {
      fields: ['group_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['role']
    }
  ]
});

module.exports = GroupMember;
