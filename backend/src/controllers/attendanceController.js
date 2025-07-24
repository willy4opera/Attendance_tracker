const attendanceSocket = require('../sockets/attendanceSocket');
const { Op } = require("sequelize");
const { Session, Attendance, User } = require('../models');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendAttendanceConfirmation } = require('../utils/email');

// Mark attendance via meeting link click
exports.markAttendanceViaLink = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const { token } = req.query;

  if (!token) {
    return next(new AppError('Invalid attendance link', 400));
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new AppError('Invalid or expired attendance link', 401));
  }

  // Validate token data
  if (decoded.sessionId !== sessionId) {
    return next(new AppError('Invalid attendance link', 400));
  }

  // Get session
  const session = await Session.findByPk(sessionId);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  // Check if tracking is enabled
  if (!session.trackingEnabled) {
    return next(new AppError('Attendance tracking is disabled for this session', 400));
  }

  // Check if session is within attendance window
  const now = new Date();
  const sessionDate = new Date(session.sessionDate);
  const sessionStart = new Date(`${session.sessionDate}T${session.startTime}`);
  const sessionEnd = new Date(`${session.sessionDate}T${session.endTime}`);
  
  const windowStart = new Date(sessionStart.getTime() - (session.attendanceWindow || 15) * 60000);
  const windowEnd = new Date(sessionEnd.getTime() + (session.attendanceWindow || 15) * 60000);
  
  if (now < windowStart || now > windowEnd) {
    return next(new AppError('Attendance can only be marked during the session time window', 400));
  }

  // Get user
  const user = await User.findByPk(decoded.userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if attendance already marked
  const existingAttendance = await Attendance.findOne({
    where: {
      userId: decoded.userId,
      sessionId: sessionId
    }
  });

  if (existingAttendance) {
    // If already marked, just redirect
    if (session.meetingLink) {
      return res.redirect(session.meetingLink);
    }
    return res.status(200).json({
      status: 'success',
      message: 'Attendance already marked',
      data: {
        attendance: existingAttendance,
        meetingLink: session.meetingLink || null,
        session: {
          id: session.id,
          title: session.title,
          meetingLink: session.meetingLink
        }
      }
    });
  }

  // Mark attendance
  const attendance = await Attendance.create({
    userId: decoded.userId,
    sessionId: sessionId,
    status: 'present',
    checkInTime: now,
    markedVia: 'link_click',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    metadata: {
      clickTimestamp: now,
      tokenIssuedAt: new Date(decoded.iat * 1000),
      meetingType: session.meetingType
    }
  });

  // Send confirmation email (async)
  sendAttendanceConfirmation(user, session, attendance).catch(err => {
    console.error('Failed to send attendance confirmation:', err.message);
  });

  // Log attendance marking
  console.log(`Attendance marked for user ${user.email} in session ${session.title}`);

  // Check if this is an AJAX request
  const isAjax = req.get('Accept')?.includes('application/json') || 
                 req.get('X-Requested-With') === 'XMLHttpRequest';

  // If meeting link exists and not AJAX, redirect to it
  if (session.meetingLink && !isAjax) {
    // Track the redirect
    await attendance.update({
      metadata: {
        ...attendance.metadata,
        redirectedAt: new Date(),
        redirectedTo: session.meetingLink
      }
    });

    return res.redirect(session.meetingLink);
  }

  // Otherwise, return success response
  // Include user info in the response
  await attendance.reload({
    include: [{
      model: User,
      as: "user",
      attributes: ["id", "firstName", "lastName", "email"]
    }]
  });

  res.status(200).json({
    status: 'success',
    message: 'Attendance marked successfully',
    data: {
      attendance: attendance,
      meetingLink: session.meetingLink || null,
      session: {
        id: session.id,
        title: session.title,
        meetingLink: session.meetingLink,
        meetingType: session.meetingType
      }
    }});
});

// Generate attendance link for a user and session
exports.generateAttendanceLink = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // Get session
  const session = await Session.findByPk(sessionId);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  // Generate token
  const token = jwt.sign(
    { sessionId, userId, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const attendanceUrl = `${baseUrl}/attendance/join/${sessionId}?token=${token}`;

  res.status(200).json({
    status: 'success',
    data: {
      attendanceUrl,
      session: {
        id: session.id,
        title: session.title,
        date: session.sessionDate,
        time: `${session.startTime} - ${session.endTime}`,
        meetingType: session.meetingType
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
});

// Get attendance records for a session
exports.getSessionAttendance = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const { count, rows: attendances } = await Attendance.findAndCountAll({
    where: { sessionId },
    include: [{
      model: User, as: "user",
      attributes: ['id', 'email', 'firstName', 'lastName']
    }],
    limit,
    offset,
    order: [['check_in_time', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    results: attendances.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      attendances
    }
  });
});

// Get user's attendance history
exports.getUserAttendance = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user.id;
  
  // Check if user can access this data
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only view your own attendance history', 403));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { count, rows: attendances } = await Attendance.findAndCountAll({
    where: { userId },
    include: [{
      model: Session,
      as: 'session',
      attributes: ['id', 'title', 'sessionDate', 'startTime', 'endTime', 'meetingType']
    }],
    limit,
    offset,
    order: [['check_in_time', 'DESC']]
  });

  // Calculate attendance statistics
  const stats = {
    totalSessions: count,
    presentCount: attendances.filter(a => a.status === 'present').length,
    absentCount: attendances.filter(a => a.status === 'absent').length,
    lateCount: attendances.filter(a => a.status === 'late').length
  };

  res.status(200).json({
    status: 'success',
    results: attendances.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      stats,
      attendances
    }
  });
});

// Manual attendance marking (for admins)
exports.markAttendanceManually = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return next(new AppError('Only admins and moderators can mark attendance manually', 403));
  }

  const { sessionId, userId, status } = req.body;

  // Validate inputs
  if (!sessionId || !userId || !status) {
    return next(new AppError('Please provide sessionId, userId, and status', 400));
  }

  // Check if session exists
  const session = await Session.findByPk(sessionId);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if attendance already exists
  let attendance = await Attendance.findOne({
    where: { userId, sessionId }
  });

  if (attendance) {
    // Update existing attendance
    attendance = await attendance.update({
      status,
      markedVia: 'manual',
      metadata: {
        ...attendance.metadata,
        manuallyMarkedBy: req.user.id,
        manuallyMarkedAt: new Date()
      }
    });
  } else {
    // Create new attendance
    attendance = await Attendance.create({
      userId,
      sessionId,
      status,
      checkInTime: status === 'present' || status === 'late' ? new Date() : null,
      markedVia: 'manual',
      metadata: {
        manuallyMarkedBy: req.user.id,
        manuallyMarkedAt: new Date()
      }
    });
  }

  // Emit socket event for real-time updates
  await attendanceSocket.emitAttendanceMarked(attendance, session, user);

  res.status(200).json({
    status: 'success',
    message: 'Attendance marked successfully',
    data: { attendance }
  });
});


// Update attendance record
exports.updateAttendance = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, checkInTime, notes } = req.body;

  // Find attendance record
  const attendance = await Attendance.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: Session,
        as: 'session',
        attributes: ['id', 'title', 'sessionDate', 'startTime', 'endTime']
      }
    ]
  });

  if (!attendance) {
    return next(new AppError('Attendance record not found', 404));
  }

  // Validate status
  const validStatuses = ['present', 'late', 'absent', 'excused', 'holiday'];
  if (status && !validStatuses.includes(status)) {
    return next(new AppError('Invalid status. Must be one of: present, late, absent, excused', 400));
  }

  // Prepare update data
  const updateData = {};
  if (status) updateData.status = status;
  if (checkInTime) updateData.checkInTime = new Date(checkInTime);
  if (notes !== undefined) updateData.notes = notes;

  // Add metadata about who updated it
  updateData.metadata = {
    ...attendance.metadata,
    updatedBy: req.user.id,
    updatedAt: new Date(),
    previousStatus: attendance.status
  };

  // Update the attendance record
  const updatedAttendance = await attendance.update(updateData);

  // Reload with associations
  await updatedAttendance.reload({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: Session,
        as: 'session',
        attributes: ['id', 'title', 'sessionDate', 'startTime', 'endTime']
      }
    ]
  });

  // Emit socket event for real-time updates
  await attendanceSocket.emitAttendanceUpdated(updatedAttendance, updatedAttendance.session, req.user);

  res.status(200).json({
    status: 'success',
    message: 'Attendance record updated successfully',
    data: {
      attendance: updatedAttendance
    }
  });
});

// Delete attendance record
exports.deleteAttendance = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find attendance record
  const attendance = await Attendance.findByPk(id);

  if (!attendance) {
    return next(new AppError('Attendance record not found', 404));
  }

  // Delete the attendance record
  await attendance.destroy();

  res.status(204).json({
    status: 'success',
    message: 'Attendance record deleted successfully',
    data: null
  });
});

module.exports = exports;

// Get today's attendance statistics
exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all sessions for today
    const todaySessions = await Session.findAll({
      where: {
        sessionDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Get attendance records for today
    const attendanceRecords = await Attendance.findAll({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        userId: req.user.id
      },
      include: [{
        model: Session,
        as: 'session'
      }]
    });

    // Calculate statistics
    const stats = {
      totalSessions: todaySessions.length,
      attendedSessions: attendanceRecords.filter(a => a.status === 'present').length,
      upcomingSessions: todaySessions.filter(s => {
        const sessionTime = new Date(s.sessionDate);
        sessionTime.setHours(s.startTime.split(':')[0], s.startTime.split(':')[1]);
        return sessionTime > new Date() && s.status === 'scheduled';
      }).length,
      completedSessions: todaySessions.filter(s => s.status === 'completed').length
    };

    // Calculate attendance percentage
    stats.attendancePercentage = stats.totalSessions > 0 
      ? Math.round((stats.attendedSessions / stats.totalSessions) * 100) 
      : 0;

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching attendance statistics'
    });
  }
};

// Get recent attendance records
exports.getRecentAttendance = async (req, res) => {
  try {
    const recentAttendance = await Attendance.findAll({
      where: {
        userId: req.user.id
      },
      include: [{
        model: Session,
        as: 'session',
        attributes: ['id', 'title', 'sessionDate', 'startTime', 'endTime']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const formattedAttendance = recentAttendance.map(record => ({
      id: record.id,
      sessionTitle: record.session?.title || 'Unknown Session',
      date: record.session?.sessionDate,
      time: record.session ? `${record.session.startTime} - ${record.session.endTime}` : '',
      status: record.status,
      markedAt: record.marked_at || record.createdAt
    }));

    res.status(200).json({
      status: 'success',
      data: formattedAttendance
    });
  } catch (error) {
    console.error('Error fetching recent attendance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching recent attendance'
    });
  }
};
