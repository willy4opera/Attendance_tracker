const { Op } = require("sequelize");
const { Session, Attendance, User, sequelize } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get overall statistics (simplified version for dashboard cards)
exports.getOverallStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

  if (isAdmin) {
    // Admin view - all data
    const [totalSessions, totalAttendance, upcomingSessions] = await Promise.all([
      Session.count(),
      Attendance.count({
        where: { status: ['present', 'late'] }
      }),
      Session.count({
        where: {
          sessionDate: { [Op.gte]: new Date() },
          status: 'scheduled'
        }
      })
    ]);

    const attendanceRate = totalSessions > 0 
      ? Math.round((totalAttendance / totalSessions) * 100) 
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalSessions,
        totalAttendance,
        upcomingSessions,
        attendanceRate
      }
    });
  } else {
    // User view - only their data
    // Count sessions where user has attendance records
    const mySessions = await Session.count({
      distinct: true,
      include: [{
        model: Attendance,
        as: 'attendances',
        where: { userId },
        required: true,
        attributes: []
      }]
    });

    // Count user's attendance
    const myAttendance = await Attendance.count({
      where: {
        userId,
        status: ['present', 'late']
      }
    });

    // Count upcoming sessions where user has been marked (even if absent)
    const myUpcomingSessions = await Session.count({
      where: {
        sessionDate: { [Op.gte]: new Date() },
        status: 'scheduled'
      },
      include: [{
        model: Attendance,
        as: 'attendances',
        where: { userId },
        required: true,
        attributes: []
      }]
    });

    const attendanceRate = mySessions > 0 
      ? Math.round((myAttendance / mySessions) * 100) 
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalSessions: mySessions,
        totalAttendance: myAttendance,
        upcomingSessions: myUpcomingSessions,
        attendanceRate
      }
    });
  }
});

// Get dashboard statistics with role-based data
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

  // Today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // This week's date range
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  if (isAdmin) {
    // Admin view - all sessions and attendance
    const [
      totalSessionsToday,
      totalSessionsWeek,
      totalAttendanceToday,
      totalAttendanceWeek,
      upcomingToday,
      activeNow
    ] = await Promise.all([
      // Today's sessions
      Session.count({
        where: {
          sessionDate: { [Op.gte]: today, [Op.lt]: tomorrow }
        }
      }),
      // This week's sessions
      Session.count({
        where: {
          sessionDate: { [Op.gte]: weekStart, [Op.lt]: weekEnd }
        }
      }),
      // Today's attendance
      Attendance.count({
        where: {
          createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
          status: ['present', 'late']
        }
      }),
      // This week's attendance
      Attendance.count({
        where: {
          createdAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
          status: ['present', 'late']
        }
      }),
      // Upcoming sessions today
      Session.count({
        where: {
          sessionDate: { [Op.gte]: today, [Op.lt]: tomorrow },
          status: 'scheduled'
        }
      }),
      // Active sessions now
      Session.count({
        where: {
          status: 'active'
        }
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        today: {
          totalSessions: totalSessionsToday,
          totalAttendance: totalAttendanceToday,
          upcomingSessions: upcomingToday,
          activeSessions: activeNow,
          attendanceRate: totalSessionsToday > 0 
            ? Math.round((totalAttendanceToday / totalSessionsToday) * 100) 
            : 0
        },
        week: {
          totalSessions: totalSessionsWeek,
          totalAttendance: totalAttendanceWeek,
          attendanceRate: totalSessionsWeek > 0 
            ? Math.round((totalAttendanceWeek / totalSessionsWeek) * 100) 
            : 0
        },
        isAdmin: true
      }
    });
  } else {
    // User view - only their sessions and attendance
    const [
      mySessionsToday,
      mySessionsWeek,
      myAttendanceToday,
      myAttendanceWeek,
      myUpcomingToday
    ] = await Promise.all([
      // My sessions today
      Session.count({
        where: {
          sessionDate: { [Op.gte]: today, [Op.lt]: tomorrow }
        },
        include: [{
          model: Attendance,
          as: 'attendances',
          where: { userId },
          required: true,
          attributes: []
        }]
      }),
      // My sessions this week
      Session.count({
        where: {
          sessionDate: { [Op.gte]: weekStart, [Op.lt]: weekEnd }
        },
        include: [{
          model: Attendance,
          as: 'attendances',
          where: { userId },
          required: true,
          attributes: []
        }]
      }),
      // My attendance today
      Attendance.count({
        where: {
          userId,
          createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
          status: ['present', 'late']
        }
      }),
      // My attendance this week
      Attendance.count({
        where: {
          userId,
          createdAt: { [Op.gte]: weekStart, [Op.lt]: weekEnd },
          status: ['present', 'late']
        }
      }),
      // My upcoming sessions today
      Session.count({
        where: {
          sessionDate: { [Op.gte]: today, [Op.lt]: tomorrow },
          status: 'scheduled'
        },
        include: [{
          model: Attendance,
          as: 'attendances',
          where: { userId },
          required: true,
          attributes: []
        }]
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        today: {
          totalSessions: mySessionsToday,
          attendedSessions: myAttendanceToday,
          upcomingSessions: myUpcomingToday,
          attendanceRate: mySessionsToday > 0 
            ? Math.round((myAttendanceToday / mySessionsToday) * 100) 
            : 0
        },
        week: {
          totalSessions: mySessionsWeek,
          attendedSessions: myAttendanceWeek,
          attendanceRate: mySessionsWeek > 0 
            ? Math.round((myAttendanceWeek / mySessionsWeek) * 100) 
            : 0
        },
        isAdmin: false
      }
    });
  }
});

// Get comprehensive attendance statistics
exports.getAttendanceStatistics = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
  const { startDate, endDate } = req.query;

  // Date range filters
  const dateFilter = {};
  if (startDate) {
    dateFilter.sessionDate = { [Op.gte]: new Date(startDate) };
  }
  if (endDate) {
    dateFilter.sessionDate = { ...dateFilter.sessionDate, [Op.lte]: new Date(endDate) };
  }

  // Get total sessions
  let totalSessions;
  if (isAdmin) {
    totalSessions = await Session.count({
      where: dateFilter
    });
  } else {
    // For users, count sessions they have attendance records for
    totalSessions = await Session.count({
      where: dateFilter,
      include: [{
        model: Attendance,
        as: 'attendances',
        where: { userId },
        required: true,
        attributes: []
      }]
    });
  }

  // Get total attendance records
  const attendanceQuery = {
    where: {
      status: ['present', 'late']
    }
  };

  if (!isAdmin) {
    attendanceQuery.where.userId = userId;
  }

  if (startDate || endDate) {
    attendanceQuery.include = [{
      model: Session,
      as: 'session',
      where: dateFilter,
      attributes: []
    }];
  }

  const totalAttendance = await Attendance.count(attendanceQuery);

  // Get upcoming sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let upcomingSessions;
  if (isAdmin) {
    upcomingSessions = await Session.findAll({
      where: {
        sessionDate: { [Op.gte]: today },
        status: 'scheduled'
      },
      order: [['sessionDate', 'ASC'], ['startTime', 'ASC']],
      limit: 10,
      attributes: ['id', 'title', 'sessionDate', 'startTime', 'endTime', 'location', 'isVirtual']
    });
  } else {
    // For users, show only sessions they're part of
    upcomingSessions = await Session.findAll({
      where: {
        sessionDate: { [Op.gte]: today },
        status: 'scheduled'
      },
      include: [{
        model: Attendance,
        as: 'attendances',
        where: { userId },
        required: true,
        attributes: []
      }],
      order: [['sessionDate', 'ASC'], ['startTime', 'ASC']],
      limit: 10,
      attributes: ['id', 'title', 'sessionDate', 'startTime', 'endTime', 'location', 'isVirtual']
    });
  }

  // Calculate attendance rate
  const attendanceRate = totalSessions > 0 
    ? Math.round((totalAttendance / totalSessions) * 100) 
    : 0;

  // Get attendance breakdown by status (for current user or all if admin)
  const statusBreakdown = await Attendance.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('status')), 'count']
    ],
    where: !isAdmin ? { userId } : {},
    group: ['status'],
    raw: true
  });

  // Get recent sessions with attendance status
  const recentSessionsQuery = {
    where: {
      sessionDate: { [Op.lte]: new Date() }
    },
    include: [{
      model: Attendance,
      as: 'attendances',
      where: !isAdmin ? { userId } : {},
      required: false,
      attributes: ['id', 'status', 'checkInTime', 'userId']
    }],
    order: [['sessionDate', 'DESC'], ['startTime', 'DESC']],
    limit: 5
  };

  const recentSessions = await Session.findAll(recentSessionsQuery);

  // Format status breakdown
  const formattedStatusBreakdown = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    holiday: 0
  };

  statusBreakdown.forEach(item => {
    formattedStatusBreakdown[item.status] = parseInt(item.count);
  });

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        totalSessions,
        totalAttendance,
        attendanceRate,
        upcomingSessionsCount: upcomingSessions.length
      },
      statusBreakdown: formattedStatusBreakdown,
      upcomingSessions: upcomingSessions.map(session => ({
        id: session.id,
        title: session.title,
        date: session.sessionDate,
        time: `${session.startTime} - ${session.endTime}`,
        location: session.location,
        isVirtual: session.isVirtual
      })),
      recentSessions: recentSessions.map(session => {
        const userAttendance = !isAdmin 
          ? session.attendances.find(a => a.userId === userId)
          : session.attendances[0];
        
        return {
          id: session.id,
          title: session.title,
          date: session.sessionDate,
          time: `${session.startTime} - ${session.endTime}`,
          attendanceStatus: userAttendance?.status || 'not_marked',
          checkInTime: userAttendance?.checkInTime,
          totalAttendees: isAdmin ? session.attendances.length : undefined
        };
      }),
      userView: !isAdmin,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    }
  });
});

module.exports = exports;
