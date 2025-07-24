const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'session_id',
    references: {
      model: 'Sessions',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('present', 'late', 'absent', 'excused', 'holiday'),
    allowNull: false,
    defaultValue: 'absent'
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'check_in_time'
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'check_out_time',
    validate: {
      isAfterCheckIn(value) {
        if (value && this.checkInTime && value <= this.checkInTime) {
          throw new Error('Check-out time must be after check-in time');
        }
      }
    }
  },
  
  // Enhanced tracking fields for link-based attendance
  markedVia: {
    type: DataTypes.ENUM('link_click', 'manual', 'qr_code', 'api', 'self'),
    defaultValue: 'manual',
    field: 'marked_via',
  },
  
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'user_agent',
  },
  
  markedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'marked_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  markedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'marked_at'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address'
  },
  deviceInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'device_info'
  },
  isLate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_late'
  },
  lateMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'late_minutes'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  
  // Deprecated - use markedVia instead
  verificationMethod: {
    type: DataTypes.ENUM('manual', 'qr_code', 'facial', 'location', 'self'),
    defaultValue: 'manual',
    field: 'verification_method'
  },
  
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_approved'
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  }
}, {
  tableName: 'Attendances',
  hooks: {
    beforeSave: async (attendance) => {
      // Calculate duration if both check-in and check-out times exist
      if (attendance.checkInTime && attendance.checkOutTime) {
        const duration = Math.floor(
          (attendance.checkOutTime - attendance.checkInTime) / (1000 * 60)
        );
        attendance.duration = duration;
      }
      
      // Migrate verificationMethod to markedVia if needed
      if (attendance.verificationMethod && !attendance.markedVia) {
        const methodMap = {
          'manual': 'manual',
          'qr_code': 'qr_code',
          'self': 'self',
          'facial': 'manual',
          'location': 'manual'
        };
        attendance.markedVia = methodMap[attendance.verificationMethod] || 'manual';
      }
    },
    afterCreate: async (attendance) => {
      // Update session totalAttendance count
      const { Session } = require('./index');
      const session = await Session.findByPk(attendance.sessionId);
      if (session) {
        const count = await attendance.constructor.count({
          where: { sessionId: attendance.sessionId, status: ['present', 'late'] }
        });
        await session.update({ totalAttendance: count });
      }
    },
    afterUpdate: async (attendance) => {
      // Update session totalAttendance count if status changed
      if (attendance.changed('status')) {
        const { Session } = require('./index');
        const session = await Session.findByPk(attendance.sessionId);
        if (session) {
          const count = await attendance.constructor.count({
            where: { sessionId: attendance.sessionId, status: ['present', 'late'] }
          });
          await session.update({ totalAttendance: count });
        }
      }
    },
    afterDestroy: async (attendance) => {
      // Update session totalAttendance count
      const { Session } = require('./index');
      const session = await Session.findByPk(attendance.sessionId);
      if (session) {
        const count = await attendance.constructor.count({
          where: { sessionId: attendance.sessionId, status: ['present', 'late'] }
        });
        await session.update({ totalAttendance: count });
      }
    }
  },
  indexes: [
    { fields: ['user_id', 'session_id'], unique: true },
    { fields: ['session_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['check_in_time'] },
    { fields: ['is_approved'] },
    { fields: ['marked_via'] }
  ]
});

module.exports = Attendance;
