const socketManager = require('../config/socket.config');
const { Session, Attendance, User } = require('../models');
const { Op } = require('sequelize');

class SessionSocket {
  constructor() {
    this.socketManager = socketManager;
  }

  // Emit when session is created
  async emitSessionCreated(session) {
    const sessionData = {
      id: session.id,
      title: session.title,
      description: session.description,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      isVirtual: session.isVirtual,
      location: session.location,
      facilitatorId: session.facilitatorId
    };

    // Broadcast to all users
    this.socketManager.broadcast('session-created', {
      session: sessionData,
      timestamp: new Date()
    });
  }

  // Emit when session is updated
  async emitSessionUpdated(session, updatedFields) {
    const sessionData = {
      id: session.id,
      updatedFields,
      session: {
        title: session.title,
        status: session.status,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime
      }
    };

    // Notify session participants
    this.socketManager.emitToSession(session.id, 'session-updated', sessionData);

    // If status changed, broadcast to all
    if (updatedFields.includes('status')) {
      this.socketManager.broadcastSessionUpdate(session, 'status-changed');
    }
  }

  // Emit when session status changes
  async emitSessionStatusChange(session, oldStatus, newStatus) {
    const notification = {
      sessionId: session.id,
      sessionTitle: session.title,
      oldStatus,
      newStatus,
      timestamp: new Date()
    };

    // Notify all participants
    this.socketManager.emitToSession(session.id, 'session-status-changed', notification);

    // Special handling for different status changes
    if (newStatus === 'active') {
      this.handleSessionStarted(session);
    } else if (newStatus === 'completed') {
      this.handleSessionCompleted(session);
    } else if (newStatus === 'cancelled') {
      this.handleSessionCancelled(session);
    }
  }

  // Handle session started
  async handleSessionStarted(session) {
    // Get all registered participants
    const participants = await this.getSessionParticipants(session.id);

    // Send notifications to all participants
    participants.forEach(user => {
      this.socketManager.sendNotification(user.id, {
        type: 'info',
        title: 'Session Starting',
        message: `"${session.title}" is starting now!`,
        sessionId: session.id,
        action: {
          type: 'join-session',
          url: `/sessions/${session.id}/join`
        }
      });
    });

    // Emit session started event
    this.socketManager.broadcast('session-started', {
      session: {
        id: session.id,
        title: session.title,
        startTime: session.startTime
      }
    });
  }

  // Handle session completed
  async handleSessionCompleted(session) {
    // Get attendance statistics
    const stats = await this.getSessionStats(session.id);

    // Notify facilitator
    this.socketManager.sendNotification(session.facilitatorId, {
      type: 'success',
      title: 'Session Completed',
      message: `"${session.title}" has been completed with ${stats.totalAttendees} attendees.`,
      sessionId: session.id,
      stats
    });

    // Emit completion event
    this.socketManager.emitToSession(session.id, 'session-completed', {
      session: {
        id: session.id,
        title: session.title
      },
      stats
    });
  }

  // Handle session cancelled
  async handleSessionCancelled(session) {
    // Get all registered participants
    const participants = await this.getSessionParticipants(session.id);

    // Send cancellation notifications
    participants.forEach(user => {
      this.socketManager.sendNotification(user.id, {
        type: 'error',
        title: 'Session Cancelled',
        message: `"${session.title}" scheduled for ${session.sessionDate} has been cancelled.`,
        sessionId: session.id
      });
    });

    // Emit cancellation event
    this.socketManager.broadcast('session-cancelled', {
      session: {
        id: session.id,
        title: session.title,
        sessionDate: session.sessionDate
      }
    });
  }

  // Emit upcoming session reminders
  async emitSessionReminder(session, minutesBeforeStart) {
    const participants = await this.getSessionParticipants(session.id);

    participants.forEach(user => {
      this.socketManager.sendNotification(user.id, {
        type: 'reminder',
        title: 'Session Starting Soon',
        message: `"${session.title}" starts in ${minutesBeforeStart} minutes`,
        sessionId: session.id,
        action: {
          type: 'prepare-join',
          url: `/sessions/${session.id}`
        }
      });
    });
  }

  // Get session participants (for notifications)
  async getSessionParticipants(sessionId) {
    // This would typically come from a registration system
    // For now, we'll get users who have previously attended
    const attendances = await Attendance.findAll({
      where: { sessionId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      group: ['userId', 'user.id']
    });

    return attendances.map(a => a.user);
  }

  // Get session statistics
  async getSessionStats(sessionId) {
    const [totalAttendees, presentCount, absentCount, lateCount] = await Promise.all([
      Attendance.count({ where: { sessionId } }),
      Attendance.count({ where: { sessionId, status: 'present' } }),
      Attendance.count({ where: { sessionId, status: 'absent' } }),
      Attendance.count({ where: { sessionId, isLate: true } })
    ]);

    return {
      totalAttendees,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate: totalAttendees > 0 ? (presentCount / totalAttendees * 100).toFixed(1) : 0
    };
  }

  // Real-time session countdown
  startSessionCountdown(session) {
    const sessionStart = new Date(`${session.sessionDate.toISOString().split('T')[0]}T${session.startTime}`);
    const now = new Date();
    const timeUntilStart = sessionStart - now;

    if (timeUntilStart > 0 && timeUntilStart < 60 * 60 * 1000) { // Within 1 hour
      const interval = setInterval(() => {
        const remaining = sessionStart - new Date();
        
        if (remaining <= 0) {
          clearInterval(interval);
          this.handleSessionStarted(session);
        } else {
          this.socketManager.emitToSession(session.id, 'session-countdown', {
            sessionId: session.id,
            timeRemaining: remaining,
            formatted: this.formatTime(remaining)
          });
        }
      }, 1000);
    }
  }

  // Format time helper
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return {
      hours: hours,
      minutes: minutes % 60,
      seconds: seconds % 60,
      formatted: `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    };
  }
}

module.exports = new SessionSocket();
