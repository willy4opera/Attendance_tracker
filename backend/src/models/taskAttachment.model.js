const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskAttachment = sequelize.define('TaskAttachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachmentType: {
    type: DataTypes.ENUM('file', 'image', 'link'),
    defaultValue: 'file'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'TaskAttachments',
  timestamps: true,
  indexes: [
    {
      fields: ['taskId']
    },
    {
      fields: ['uploadedBy']
    },
    {
      fields: ['attachmentType']
    }
  ]
});

module.exports = TaskAttachment;
