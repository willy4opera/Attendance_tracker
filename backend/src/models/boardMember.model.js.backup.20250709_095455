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
    references: {
      model: 'Boards',
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
  role: {
    type: DataTypes.ENUM('viewer', 'member', 'admin'),
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
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'BoardMembers',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['boardId', 'userId']
    },
    {
      fields: ['role']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = BoardMember;
