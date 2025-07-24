const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DependencyNotificationPreference = sequelize.define('DependencyNotificationPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    },
    comment: 'Optional: preferences can be project-specific'
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  channels: {
    type: DataTypes.JSONB,
    defaultValue: {
      email: true,
      inApp: true,
      push: false
    }
  },
  events: {
    type: DataTypes.JSONB,
    defaultValue: {
      created: true,
      updated: true,
      violated: true,
      resolved: true,
      deadlineWarning: true,
      criticalPath: true
    }
  },
  frequency: {
    type: DataTypes.JSONB,
    defaultValue: {
      immediate: true,
      daily: false,
      weekly: false
    }
  },
  thresholds: {
    type: DataTypes.JSONB,
    defaultValue: {
      warningDays: 3,
      criticalHours: 24
    }
  },
  quietHours: {
    type: DataTypes.JSONB,
    defaultValue: null,
    field: 'quiet_hours',
    comment: 'Optional quiet hours configuration'
  }
}, {
  tableName: 'dependency_notification_preferences',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['project_id']
    },
    {
      unique: true,
      fields: ['user_id', 'project_id'],
      name: 'unique_user_project_preferences'
    }
  ]
});

// Instance methods
DependencyNotificationPreference.prototype.shouldNotify = function(eventType, channel) {
  if (!this.enabled) return false;
  
  // Check if event type is enabled
  if (this.events && this.events[eventType] === false) return false;
  
  // Check if channel is enabled
  if (this.channels && this.channels[channel] === false) return false;
  
  // Check quiet hours
  if (this.quietHours && channel !== 'inApp') {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (this.quietHours.enabled && 
        currentHour >= this.quietHours.startHour && 
        currentHour < this.quietHours.endHour) {
      return false;
    }
  }
  
  return true;
};

DependencyNotificationPreference.prototype.getPreferredChannels = function(eventType) {
  const channels = [];
  
  if (!this.enabled) return channels;
  if (this.events && this.events[eventType] === false) return channels;
  
  Object.entries(this.channels).forEach(([channel, enabled]) => {
    if (enabled) channels.push(channel);
  });
  
  return channels;
};

// Class methods
DependencyNotificationPreference.getOrCreateDefault = async function(userId, projectId = null) {
  const [preference, created] = await this.findOrCreate({
    where: {
      userId,
      projectId
    },
    defaults: {
      userId,
      projectId,
      enabled: true,
      channels: {
        email: true,
        inApp: true,
        push: false
      },
      events: {
        created: true,
        updated: true,
        violated: true,
        resolved: true,
        deadlineWarning: true,
        criticalPath: true
      },
      frequency: {
        immediate: true,
        daily: false,
        weekly: false
      },
      thresholds: {
        warningDays: 3,
        criticalHours: 24
      }
    }
  });
  
  return preference;
};

DependencyNotificationPreference.updatePreferences = async function(userId, projectId, updates) {
  const preference = await this.findOne({
    where: {
      userId,
      projectId
    }
  });
  
  if (!preference) {
    return await this.create({
      userId,
      projectId,
      ...updates
    });
  }
  
  // Merge updates with existing preferences
  if (updates.channels) {
    preference.channels = { ...preference.channels, ...updates.channels };
  }
  if (updates.events) {
    preference.events = { ...preference.events, ...updates.events };
  }
  if (updates.frequency) {
    preference.frequency = { ...preference.frequency, ...updates.frequency };
  }
  if (updates.thresholds) {
    preference.thresholds = { ...preference.thresholds, ...updates.thresholds };
  }
  if (updates.quietHours !== undefined) {
    preference.quietHours = updates.quietHours;
  }
  if (updates.enabled !== undefined) {
    preference.enabled = updates.enabled;
  }
  
  return await preference.save();
};

module.exports = DependencyNotificationPreference;
