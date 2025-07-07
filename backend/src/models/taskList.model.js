const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TaskList = sequelize.define('TaskList', {
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
        msg: 'List name cannot be empty'
      }
    }
  },
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Boards',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  watchedBy: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      limitCards: false,
      maxCards: null,
      showCardCount: true
    }
  }
}, {
  tableName: 'TaskLists',
  timestamps: true,
  indexes: [
    {
      fields: ['boardId', 'position']
    },
    {
      fields: ['isArchived']
    }
  ]
});

module.exports = TaskList;
