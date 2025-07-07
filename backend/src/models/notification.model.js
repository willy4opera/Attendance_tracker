const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'reminder', 'announcement'),
    allowNull: false,
    defaultValue: 'info'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    field: 'read_at'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  }
}, {
  tableName: 'Notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'read'] },
    { fields: ['created_at'] },
    { fields: ['type'] }
  ]
});

// Define associations
Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = Notification;
