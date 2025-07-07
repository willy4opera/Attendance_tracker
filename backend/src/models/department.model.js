const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Department name cannot be empty'
      }
    }
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Department code cannot be empty'
      },
      isUppercase: {
        msg: 'Department code must be uppercase'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  headOfDepartmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  parentDepartmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'Departments',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['code']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['headOfDepartmentId']
    }
  ]
});

module.exports = Department;
