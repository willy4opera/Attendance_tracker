const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, 100],
        msg: 'Password must be at least 6 characters long'
      }
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'First name is required'
      }
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Last name is required'
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/,
        msg: 'Please provide a valid phone number'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator', 'user'),
    defaultValue: 'user',
    allowNull: false
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  accountLockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      notifications: {
        email: true,
        inApp: true,
        sms: false
      },
      theme: 'light',
      language: 'en'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'Users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['password', 'emailVerificationToken', 'resetPasswordToken'] }
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    },
    active: {
      where: { isActive: true }
    },
    verified: {
      where: { isEmailVerified: true }
    }
  },
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['departmentId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['isEmailVerified']
    }
  ]
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
User.prototype.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Generate password reset token
User.prototype.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
};

// Verify email verification token
User.prototype.verifyEmailToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  return this.emailVerificationToken === hashedToken && 
         this.emailVerificationExpires > Date.now();
};

// Verify password reset token
User.prototype.verifyPasswordResetToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  return this.resetPasswordToken === hashedToken && 
         this.resetPasswordExpires > Date.now();
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.emailVerificationToken;
  delete values.resetPasswordToken;
  return values;
};

module.exports = User;
