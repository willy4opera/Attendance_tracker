const { sequelize } = require('../config/database');
const { Op, Sequelize } = require('sequelize');
const { Session, Attendance, User } = require('../models');
const { sendSessionInvite } = require('../utils/email');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create a new session
exports.createSession = catchAsync(async (req, res, next) => {
  const { 
    title, 
    description, 
    sessionDate, 
    startTime, 
    endTime, 
    facilitatorId, 
    meetingLink, 
    meetingType, 
    tags, 
    category,
    expectedAttendees,
    capacity,
    location
  } = req.body;

  const session = await Session.create({
    title,
    description,
    sessionDate,
    startTime,
    endTime,
    facilitatorId,
    meetingLink,
    meetingType,
    tags,
    category,
    expectedAttendees: expectedAttendees || [],
    expectedAttendeesCount: expectedAttendees ? expectedAttendees.length : 0,
    capacity,
    location
  });

  // Send email invites only to expected attendees (if specified)
  if (expectedAttendees && expectedAttendees.length > 0) {
    try {
      // Fetch users who are expected to attend
      const expectedUsers = await User.findAll({ 
        where: { 
          id: { [Op.in]: expectedAttendees },
          isActive: true 
        } 
      });

      // Send invites to expected attendees
      expectedUsers.forEach(user => {
        sendSessionInvite(user, session).catch(err => {
          console.error(`Failed to send session invite to ${user.email}:`, err.message);
        });
      });
      
      console.log(`Session invites sent to ${expectedUsers.length} expected attendees`);
    } catch (error) {
      console.error('Error sending session invites:', error.message);
    }
  } else {
    // Fallback: send to all active users if no expected attendees specified
    console.log('No expected attendees specified, sending to all active users');
    const users = await User.findAll({ where: { isActive: true } });
    users.forEach(user => {
      sendSessionInvite(user, session).catch(err => {
        console.error(`Failed to send session invite to ${user.email}:`, err.message);
      });
    });
  }

  res.status(201).json({
    status: 'success',
    data: {
      session
    }
  });
});

// Update session
exports.updateSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await Session.findByPk(sessionId);
  if (!session) return next(new AppError('Session not found', 404));

  const updates = { ...req.body };
  
  // Update expectedAttendeesCount if expectedAttendees is being updated
  if (updates.expectedAttendees) {
    updates.expectedAttendeesCount = updates.expectedAttendees.length;
  }

  const previousExpectedAttendees = session.expectedAttendees || [];
  
  await session.update(updates);

  // Send email notifications for newly added expected attendees
  if (updates.expectedAttendees && updates.expectedAttendees.length > 0) {
    try {
      // Find newly added attendees
      const newAttendees = updates.expectedAttendees.filter(
        attendeeId => !previousExpectedAttendees.includes(attendeeId)
      );

      if (newAttendees.length > 0) {
        // Fetch new expected users
        const newExpectedUsers = await User.findAll({ 
          where: { 
            id: { [Op.in]: newAttendees },
            isActive: true 
          } 
        });

        // Send invites to new expected attendees
        newExpectedUsers.forEach(user => {
          sendSessionInvite(user, session).catch(err => {
            console.error(`Failed to send session invite to ${user.email}:`, err.message);
          });
        });
        
        console.log(`Session invites sent to ${newExpectedUsers.length} new expected attendees`);
      }
    } catch (error) {
      console.error('Error sending session invites to new attendees:', error.message);
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      session
    }
  });
});

// Get session details
exports.getSessionDetails = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await Session.findByPk(sessionId, {
    include: [
      {
        model: User,
        as: 'facilitator',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });
  
  if (!session) return next(new AppError('Session not found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      session
    }
  });
});

// Delete a session
exports.deleteSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const deleted = await Session.destroy({ where: { id: sessionId } });
  if (!deleted) return next(new AppError('Session not found', 404));

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// List all sessions with filters and pagination
exports.getAllSessions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, date, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) where.title = { [Op.iLike]: `%${search}%` };
  if (date) where.sessionDate = date;
  if (status) where.status = status;

  const { count, rows: sessions } = await Session.findAndCountAll({ 
    where, 
    limit, 
    offset,
    include: [
      {
        model: Attendance,
        as: 'attendances',
        attributes: []
      },
      {
        model: User,
        as: 'facilitator',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ],
    attributes: {
      include: [
        [Sequelize.fn('COUNT', Sequelize.col('attendances.id')), 'attendanceCount']
      ]
    },
    group: ['Session.id', 'facilitator.id'],
    subQuery: false
  });

  res.status(200).json({
    status: 'success',
    results: sessions.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      sessions
    }
  });
});

// Get session statistics
// Get session statistics
exports.getSessionStatistics = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const where = {};
  if (startDate || endDate) {
    where.sessionDate = {};
    if (startDate) where.sessionDate[Op.gte] = new Date(startDate);
    if (endDate) where.sessionDate[Op.lte] = new Date(endDate);
  }

  // Get total sessions count
  const totalSessions = await Session.count({ where });

  // Get sessions by status with proper status calculation
  const now = new Date();
  const allSessions = await Session.findAll({
    where,
    attributes: ['id', 'status', 'sessionDate', 'startTime', 'endTime', 'totalAttendance', 'facilitatorId', 'expectedAttendeesCount', 'capacity'],
    raw: true
  });

  // Calculate real-time status for each session
  let activeCount = 0;
  let upcomingCount = 0;
  let completedCount = 0;
  let totalAttendees = 0;
  let facilitatorSessions = 0;
  let totalCapacity = 0;

  allSessions.forEach(session => {
    // Calculate real status based on current time
    const sessionDate = new Date(session.sessionDate);
    // Handle different date formats from raw query
    const sessionDateStr = session.sessionDate instanceof Date 
      ? session.sessionDate.toISOString() 
      : session.sessionDate.toString();
    const startTime = new Date(`${sessionDateStr.split("T")[0]}T${session.startTime}`);
    const endTime = new Date(`${sessionDateStr.split("T")[0]}T${session.endTime}`);
    
    let realStatus;
    if (session.status === 'cancelled') {
      realStatus = 'cancelled';
    } else if (now >= startTime && now <= endTime) {
      realStatus = 'active';
      activeCount++;
    } else if (now < startTime) {
      realStatus = 'upcoming';
      upcomingCount++;
    } else {
      realStatus = 'completed';
      completedCount++;
    }

    // Count attendance
    totalAttendees += session.totalAttendance || 0;
    
    // Count capacity (use capacity, fallback to expectedAttendeesCount)
    totalCapacity += session.capacity || session.expectedAttendeesCount || 0;
    
    // Count facilitator sessions (if user is logged in)
    if (req.user && session.facilitatorId === req.user.id) {
      facilitatorSessions++;
    }
  });

  // Calculate rates
  const averageAttendance = totalSessions > 0 ? (totalAttendees / totalSessions) : 0;
  const attendanceRate = totalCapacity > 0 ? ((totalAttendees / totalCapacity) * 100) : 0;

  const statistics = {
    total: totalSessions,
    active: activeCount,
    upcoming: upcomingCount,
    completed: completedCount,
    cancelled: allSessions.filter(s => s.status === 'cancelled').length,
    attendance: {
      totalAttendees,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    },
    facilitation: req.user ? {
      sessionsCreated: facilitatorSessions,
      totalParticipants: allSessions
        .filter(s => s.facilitatorId === req.user.id)
        .reduce((sum, s) => sum + (s.totalAttendance || 0), 0)
    } : undefined
  };

  res.status(200).json({
    status: 'success',
    data: {
      statistics
    }
  });
});
exports.searchSessions = catchAsync(async (req, res, next) => {
  const { q, limit = 10 } = req.query;
  
  if (!q || q.length < 2) {
    return res.status(200).json({
      status: 'success',
      data: { suggestions: [] }
    });
  }

  const sessions = await Session.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.iLike]: `%${q}%` } },
        { category: { [Op.iLike]: `%${q}%` } }
      ],
      status: { [Op.ne]: 'cancelled' }
    },
    attributes: ['id', 'title', 'sessionDate', 'status'],
    limit: parseInt(limit),
    order: [['sessionDate', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: {
      suggestions: sessions
    }
  });
});

// Recurring session methods
const recurringSessionService = require('../services/recurringSession.service');

// Create recurring sessions
exports.createRecurringSessions = catchAsync(async (req, res, next) => {
  // Check permissions
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return next(new AppError('You do not have permission to create sessions', 403));
  }

  const sessionData = {
    ...req.body,
    facilitatorId: req.body.facilitatorId || req.user.id
  };

  const result = await recurringSessionService.createRecurringSessions(sessionData);

  res.status(201).json({
    status: 'success',
    message: `Created ${result.totalCreated} sessions successfully`,
    data: {
      parentSession: result.parentSession,
      childSessions: result.childSessions
    }
  });
});

// Update recurring sessions
exports.updateRecurringSessions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { updateScope = 'all', ...updateData } = req.body;

  // Check permissions
  const session = await Session.findByPk(id);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  if (req.user.role !== 'admin' && 
      req.user.role !== 'moderator' && 
      session.facilitatorId !== req.user.id) {
    return next(new AppError('You do not have permission to update this session', 403));
  }

  const result = await recurringSessionService.updateRecurringSessions(id, updateData, updateScope);

  res.status(200).json({
    status: 'success',
    message: `Updated ${result.updated} sessions with scope: ${result.scope}`,
    data: result
  });
});

// Delete recurring sessions
exports.deleteRecurringSessions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { deleteScope = 'all' } = req.query;

  // Check permissions
  const session = await Session.findByPk(id);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  if (req.user.role !== 'admin' && 
      req.user.role !== 'moderator' && 
      session.facilitatorId !== req.user.id) {
    return next(new AppError('You do not have permission to delete this session', 403));
  }

  const result = await recurringSessionService.deleteRecurringSessions(id, deleteScope);

  res.status(200).json({
    status: 'success',
    message: `Deleted ${result.deleted} sessions with scope: ${result.scope}`,
    data: result
  });
});

// Get recurring session instances
exports.getRecurringInstances = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate, limit = 50, offset = 0 } = req.query;

  const instances = await recurringSessionService.getRecurringInstances(id, {
    startDate,
    endDate,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.status(200).json({
    status: 'success',
    results: instances.length,
    data: {
      instances
    }
  });
});

// Generate upcoming sessions (can be called manually or via scheduled job)
exports.generateUpcomingSessions = catchAsync(async (req, res, next) => {
  // Admin only
  if (req.user.role !== 'admin') {
    return next(new AppError('Only admins can generate upcoming sessions', 403));
  }

  const { daysAhead = 30 } = req.body;
  const results = await recurringSessionService.generateUpcomingSessions(daysAhead);

  res.status(200).json({
    status: 'success',
    message: `Generated upcoming sessions for ${results.length} recurring series`,
    data: {
      results
    }
  });
});

// Update session attendance count
exports.updateSessionAttendanceCount = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  
  // Get the session
  const session = await Session.findByPk(sessionId);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }
  
  // Count total attendance for this session
  const totalAttendance = await Attendance.count({
    where: {
      sessionId: sessionId,
      status: 'present'
    }
  });
  
  // Update the session with the attendance count
  await session.update({
    totalAttendance: totalAttendance
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      sessionId,
      totalAttendance
    }
  });
});

// Add files to session
exports.addFilesToSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const { files } = req.body; // Array of file objects
  
  const session = await Session.findByPk(sessionId);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }
  
  // Check permissions
  if (req.user.role !== 'admin' && 
      req.user.role !== 'moderator' && 
      session.facilitatorId !== req.user.id) {
    return next(new AppError('You do not have permission to add files to this session', 403));
  }
  
  // Add new files to existing ones
  const updatedFiles = [...(session.files || []), ...files.map(file => ({
    ...file,
    uploadedBy: req.user.id,
    uploadedAt: new Date()
  }))];
  
  await session.update({ files: updatedFiles });
  
  res.status(200).json({
    status: 'success',
    data: {
      files: updatedFiles
    }
  });
});

// Remove file from session
exports.removeFileFromSession = catchAsync(async (req, res, next) => {
  const { sessionId, fileId } = req.params;
  
  const session = await Session.findByPk(sessionId);
  if (!session) {
    return next(new AppError('Session not found', 404));
  }
  
  // Check permissions
  if (req.user.role !== 'admin' && 
      req.user.role !== 'moderator' && 
      session.facilitatorId !== req.user.id) {
    return next(new AppError('You do not have permission to remove files from this session', 403));
  }
  
  // Remove the file
  const updatedFiles = (session.files || []).filter((_, index) => index !== parseInt(fileId));
  
  await session.update({ files: updatedFiles });
  
  res.status(200).json({
    status: 'success',
    data: {
      files: updatedFiles
    }
  });
});

// Get sessions by status with pagination
exports.getSessionsByStatus = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let where = {};
  const now = new Date();

  // If specific status requested, we need to filter by real-time status
  if (status && status !== "all") {
    // For database-stored statuses
    if (status === "cancelled") {
      where.status = "cancelled";
    } else {
      // For time-based statuses, we need to calculate in application
      // Get all non-cancelled sessions first, then filter by time
      where.status = { [Op.ne]: "cancelled" };
    }
  }

  const allSessions = await Session.findAll({
    where,
    include: [
      {
        model: User,
        as: "facilitator",
        attributes: ["id", "firstName", "lastName", "email"]
      }
    ],
    attributes: {
      include: [
        [Sequelize.literal('(SELECT COUNT(*) FROM "Attendances" WHERE "Attendances"."session_id" = "Session"."id")'), "attendanceCount"]
      ]
    },
    order: [["createdAt", "DESC"]]
  });

  // Filter by real-time status if needed
  let filteredSessions = allSessions;
  if (status && status !== "all" && status !== "cancelled") {
    filteredSessions = allSessions.filter(session => {
    // Handle different date formats from raw query
    const sessionDateStr = session.sessionDate instanceof Date 
      ? session.sessionDate.toISOString() 
      : session.sessionDate.toString();
    const startTime = new Date(`${sessionDateStr.split("T")[0]}T${session.startTime}`);
    const endTime = new Date(`${sessionDateStr.split("T")[0]}T${session.endTime}`);
      
      if (status === "active") {
        return now >= startTime && now <= endTime;
      } else if (status === "upcoming") {
        return now < startTime;
      } else if (status === "completed") {
        return now > endTime;
      }
      return false;
    });
  }

  // Apply pagination to filtered results
  const paginatedSessions = filteredSessions.slice(offset, offset + parseInt(limit));
  const totalCount = filteredSessions.length;

  res.status(200).json({
    status: "success",
    results: paginatedSessions.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / limit),
      totalResults: totalCount
    },
    data: {
      sessions: paginatedSessions
    }
  });
});
