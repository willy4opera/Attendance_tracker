const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'original_name'
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'mime_type'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'uploaded_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'session_id',
    references: {
      model: 'Sessions',
      key: 'id'
    }
  }
}, {
  tableName: 'Attachments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['uploaded_by'] },
    { fields: ['session_id'] },
    { fields: ['created_at'] }
  ]
});

// Define associations
Attachment.associate = (models) => {
  Attachment.belongsTo(models.User, {
    foreignKey: 'uploadedBy',
    as: 'uploader'
  });
  
  Attachment.belongsTo(models.Session, {
    foreignKey: 'sessionId',
    as: 'session'
  });
};

module.exports = Attachment;
