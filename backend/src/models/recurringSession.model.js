const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecurringSession = sequelize.define('RecurringSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 200]
    }
  },
  facilitatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'facilitator_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  patternType: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: false,
    field: 'pattern_type'
  },
  daysOfWeek: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    field: 'days_of_week',
    validate: {
      isValidDays(value) {
        if (value && value.length > 0) {
          const isValid = value.every(day => day >= 0 && day <= 6);
          if (!isValid) {
            throw new Error('Days of week must be between 0 and 6');
          }
        }
      }
    }
  },
  dayOfMonth: {
    type: DataTypes.INTEGER,
    field: 'day_of_month',
    validate: {
      min: 1,
      max: 31
    }
  },
  interval: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 15,
      max: 480 // 8 hours max
    }
  },
  room: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date',
    validate: {
      isDate: true
    }
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_date',
    validate: {
      isDate: true,
      isAfterStartDate(value) {
        if (value && value <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  exceptions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    validate: {
      isValidExceptions(value) {
        if (!Array.isArray(value)) {
          throw new Error('Exceptions must be an array');
        }
        value.forEach(exception => {
          if (!exception.date) {
            throw new Error('Exception must have a date');
          }
        });
      }
    }
  },
  lastGenerated: {
    type: DataTypes.DATE,
    field: 'last_generated'
  },
  totalGenerated: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_generated'
  }
}, {
  tableName: 'recurring_sessions',
  underscored: true,
  timestamps: true,
  hooks: {
    beforeValidate: (recurringSession, options) => {
      // Validate pattern-specific fields
      if (recurringSession.patternType === 'weekly' && 
          (!recurringSession.daysOfWeek || recurringSession.daysOfWeek.length === 0)) {
        throw new Error('Days of week are required for weekly patterns');
      }
      
      if (recurringSession.patternType === 'monthly' && !recurringSession.dayOfMonth) {
        throw new Error('Day of month is required for monthly patterns');
      }
    }
  }
});

// Instance Methods
RecurringSession.prototype.isException = function(date) {
  if (!this.exceptions || !Array.isArray(this.exceptions)) {
    return false;
  }
  
  const checkDate = new Date(date).toDateString();
  return this.exceptions.some(exception => {
    const exceptionDate = new Date(exception.date).toDateString();
    return exceptionDate === checkDate;
  });
};

RecurringSession.prototype.addException = async function(date, reason = '') {
  if (!this.isException(date)) {
    const exceptions = this.exceptions || [];
    exceptions.push({ date, reason });
    this.exceptions = exceptions;
    await this.save();
  }
};

RecurringSession.prototype.removeException = async function(date) {
  if (!this.exceptions || !Array.isArray(this.exceptions)) {
    return;
  }
  
  const checkDate = new Date(date).toDateString();
  this.exceptions = this.exceptions.filter(exception => {
    const exceptionDate = new Date(exception.date).toDateString();
    return exceptionDate !== checkDate;
  });
  await this.save();
};

// Class Methods
RecurringSession.getActiveSessions = function() {
  return this.findAll({
    where: {
      isActive: true
    }
  });
};

RecurringSession.getByFacilitator = function(facilitatorId) {
  return this.findAll({
    where: {
      facilitatorId: facilitatorId
    }
  });
};

// Virtual fields
RecurringSession.prototype.getIsCurrent = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         (!this.endDate || now <= this.endDate);
};

module.exports = RecurringSession;
