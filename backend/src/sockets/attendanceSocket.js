const socketManager = require('../config/socket.config');
const { Attendance, Session, User } = require('../models');

class AttendanceSocket {
  constructor() {
    this.socketManager = socketManager;
  }

  // Emit real-time attendance update when someone marks attendance
  async emitAttendanceMarked(attendance, session, user) {
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

    // Broadcast to session
    this.socketManager.broadcastAttendanceUpdate(session.id, {
      type: 'attendance-marked',
      attendance: attendanceData,
      timestamp: new Date()
    });

    // Send notification to user
    this.socketManager.sendNotification(user.id, {
      type: 'success',
      title: 'Attendance Marked',
      message: `Your attendance for "${session.title}" has been marked successfully.`,
      sessionId: session.id
    });
  }

  // Emit when attendance is updated
  async emitAttendanceUpdated(attendance, session, updatedBy) {
    const attendanceData = {
      id: attendance.id,
      sessionId: session.id,
      userId: attendance.userId,
      status: attendance.status,
      notes: attendance.notes,
      updatedBy: updatedBy.id,
      updatedByName: `${updatedBy.firstName} ${updatedBy.lastName}`
    };

    this.socketManager.broadcastAttendanceUpdate(session.id, {
      type: 'attendance-updated',
      attendance: attendanceData,
      timestamp: new Date()
    });
  }

  // Emit session attendance statistics
  async emitSessionStats(sessionId) {
    try {
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

      this.socketManager.emitToSession(sessionId, 'session-stats-update', stats);
    } catch (error) {
      console.error('Error emitting session stats:', error);
    }
  }

  // Emit late arrival notification
  async emitLateArrival(attendance, session, user, lateMinutes) {
    const notification = {
      type: 'late-arrival',
      attendance: {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        lateMinutes
      },
      session: {
        id: session.id,
        title: session.title
      }
    };

    // Notify session facilitator
    this.socketManager.emitToUser(session.facilitatorId, 'notification', {
      type: 'warning',
      title: 'Late Arrival',
      message: `${user.firstName} ${user.lastName} arrived ${lateMinutes} minutes late to "${session.title}"`,
      ...notification
    });

    // Notify admins
    this.socketManager.emitToRole('admin', 'late-arrival', notification);
  }

  // Real-time attendance progress for session
  async emitAttendanceProgress(sessionId) {
    try {
      const attendances = await Attendance.findAll({
        where: { sessionId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }],
        order: [['checkInTime', 'DESC']],
        limit: 50
      });

      const progress = {
        sessionId,
        recentAttendances: attendances.map(a => ({
          id: a.id,
          userId: a.userId,
          userName: `${a.user.firstName} ${a.user.lastName}`,
          checkInTime: a.checkInTime,
          status: a.status,
          markedVia: a.markedVia
        })),
        total: attendances.length
      };

      this.socketManager.emitToSession(sessionId, 'attendance-progress', progress);
    } catch (error) {
      console.error('Error emitting attendance progress:', error);
    }
  }
}

module.exports = new AttendanceSocket();
