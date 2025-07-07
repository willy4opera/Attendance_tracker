const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
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
        msg: 'Project name cannot be empty'
      }
    }
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Project code cannot be empty'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  projectManagerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isAfterStartDate(value) {
        if (value && this.startDate && value < this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
    defaultValue: 'planning'
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
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
  tableName: 'Projects',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['code']
    },
    {
      fields: ['status']
    },
    {
      fields: ['departmentId']
    },
    {
      fields: ['projectManagerId']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Project;
