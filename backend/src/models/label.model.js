const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Label = sequelize.define('Label', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Boards',
      key: 'id'
    }
  },
  isGlobal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'Labels',
  timestamps: true,
  indexes: [
    {
      fields: ['boardId']
    },
    {
      fields: ['isGlobal']
    },
    {
      unique: true,
      fields: ['name', 'boardId']
    }
  ]
});

module.exports = Label;
