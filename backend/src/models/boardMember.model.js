const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BoardMember = sequelize.define('BoardMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'board_id',
    references: {
      model: 'Boards',
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
  role: {
    type: DataTypes.ENUM('viewer', 'member', 'admin', 'owner'),
    defaultValue: 'member'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      canEditBoard: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canCreateLists: true,
      canEditLists: true,
      canDeleteLists: false,
      canCreateCards: true,
      canEditCards: true,
      canDeleteCards: true,
      canComment: true
    }
  },
  joinedAt: {
    type: DataTypes.DATE,
    field: 'joined_at',
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    defaultValue: true
  }
}, {
  tableName: 'BoardMembers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['board_id', 'user_id']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = BoardMember;
