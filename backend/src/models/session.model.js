const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const jwt = require('jsonwebtoken');

const Session = sequelize.define('Session', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
  sessionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'session_date',
    validate: {
      isDate: true
    }
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
    validate: {
      isAfterStartTime(value) {
        if (value <= this.startTime) {
          throw new Error('End time must be after start time');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'active', 'completed', 'cancelled'),
    defaultValue: 'scheduled',
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVirtual: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_virtual'
  },
  
  // Meeting link fields for attendance tracking
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'meeting_link',
    validate: {
      isUrl: true
    },
  },
  
  meetingType: {
    type: DataTypes.ENUM('zoom', 'google_meet', 'teams', 'webex', 'other'),
    allowNull: true,
    field: 'meeting_type',
    defaultValue: 'other',
  },
  
  trackingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'tracking_enabled',
  },
  
  attendanceWindow: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    field: 'attendance_window',
  },
  
  // Deprecated - use meetingLink instead
  virtualLink: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'virtual_link',
    validate: {
      isUrl: true
    }
  },
  
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_recurring'
  },
  recurringPattern: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'recurring_pattern'
  },
  parentSessionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_session_id',
    references: {
      model: 'Sessions',
      key: 'id'
    }
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code'
  },
  totalAttendance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: "total_attendance",
    validate: {
      min: 0
    }
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: "files",
    comment: "Array of file objects with url, name, uploadedAt, uploadedBy"
  },
  expectedAttendees: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: "expected_attendees",
    comment: "Array of user IDs expected to attend this session"
  },
  expectedAttendeesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: "expected_attendees_count",
    comment: "Cached count of expected attendees for performance"
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'Sessions',
  hooks: {
    beforeValidate: (session) => {
      // Auto-update status based on date/time
      const now = new Date();
      const sessionDateTime = new Date(session.sessionDate);
      
      if (session.status !== 'cancelled') {
        if (sessionDateTime > now) {
          session.status = 'scheduled';
        } else if (sessionDateTime.toDateString() === now.toDateString()) {
          session.status = 'active';
        } else {
          session.status = 'completed';
        }
      }
      
      // Migrate virtualLink to meetingLink if needed
      if (session.virtualLink && !session.meetingLink) {
        session.meetingLink = session.virtualLink;
      }
    }
  },
  indexes: [
    { fields: ['facilitator_id'] },
    { fields: ['session_date'] },
    { fields: ['status'] },
    { fields: ['category'] },
    { fields: ['is_virtual'] },
    { fields: ['meeting_type'] }
  ]
});

// Instance methods
Session.prototype.generateAttendanceUrl = function(userId) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const token = jwt.sign(
    { 
      sessionId: this.id, 
      userId, 
      timestamp: Date.now() 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  return `${baseUrl}/attendance/join/${this.id}?token=${token}`;
};

Session.prototype.isWithinAttendanceWindow = function() {
  const now = new Date();
  const sessionStart = new Date(`${this.sessionDate}T${this.startTime}`);
  const sessionEnd = new Date(`${this.sessionDate}T${this.endTime}`);
  
  const windowStart = new Date(sessionStart.getTime() - this.attendanceWindow * 60000);
  const windowEnd = new Date(sessionEnd.getTime() + this.attendanceWindow * 60000);
  
  return now >= windowStart && now <= windowEnd;
};

module.exports = Session;
