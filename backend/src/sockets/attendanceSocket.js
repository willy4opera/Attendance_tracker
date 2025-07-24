const { Attendance, Session, User } = require('../models');
const logger = require('../utils/logger');

class AttendanceSocket {
  getIo() {
    // Get IO instance from app
    const app = require('../app');
    return app.get('io');
  }

  // Emit real-time attendance update when someone marks attendance
  async emitAttendanceMarked(attendance, session, user) {
    try {
      const io = this.getIo();
      if (!io) {
        logger.warn('Socket.IO instance not available');
        return;
      }

      const attendanceData = {
        id: attendance.id,
        sessionId: session.id,
        sessionTitle: session.title,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        markedVia: attendance.markedVia
      };

      // Broadcast to session room
      io.to(`session:${session.id}`).emit('attendance-update', {
        type: 'attendance-marked',
        attendance: attendanceData,
        timestamp: new Date()
      });

      // Send notification to user
      io.to(`user_${user.id}`).emit('notification', {
        type: 'success',
        title: 'Attendance Marked',
        message: `Your attendance for "${session.title}" has been marked successfully.`,
        sessionId: session.id
      });

      logger.info(`Attendance marked event emitted for session ${session.id}`);
    } catch (error) {
      logger.error('Error emitting attendance marked event:', error);
    }
  }

  // Emit when attendance is updated
  async emitAttendanceUpdated(attendance, session, updatedBy) {
    try {
      const io = this.getIo();
      if (!io) {
        logger.warn('Socket.IO instance not available');
        return;
      }

      const attendanceData = {
        id: attendance.id,
        sessionId: session.id,
        userId: attendance.userId,
        status: attendance.status,
        notes: attendance.notes,
        updatedBy: updatedBy.id,
        updatedByName: `${updatedBy.firstName} ${updatedBy.lastName}`
      };

      // Broadcast to session room
      io.to(`session:${session.id}`).emit('attendance-update', {
        type: 'attendance-updated',
        attendance: attendanceData,
        timestamp: new Date(),
        user: {
          id: updatedBy.id,
          name: `${updatedBy.firstName} ${updatedBy.lastName}`
        }
      });

      logger.info(`Attendance updated event emitted for session ${session.id}`);
    } catch (error) {
      logger.error('Error emitting attendance updated event:', error);
    }
  }

  // Emit session attendance statistics
  async emitSessionStats(sessionId) {
    try {
      const io = this.getIo();
      if (!io) {
        logger.warn('Socket.IO instance not available');
        return;
      }

      const session = await Session.findByPk(sessionId);
      const attendanceCount = await Attendance.count({
        where: { sessionId, status: 'present' }
      });

      const stats = {
        sessionId,
        totalAttendees: attendanceCount,
        capacity: session.capacity,
        percentageFilled: session.capacity ? (attendanceCount / session.capacity * 100).toFixed(1) : 0
      };

      io.to(`session:${sessionId}`).emit('session-stats-update', stats);
      logger.info(`Session stats update emitted for session ${sessionId}`);
    } catch (error) {
      logger.error('Error emitting session stats:', error);
    }
  }
}

module.exports = new AttendanceSocket();
