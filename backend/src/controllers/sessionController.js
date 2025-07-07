const { Op, Sequelize } = require('sequelize');
const { Session, User, Attendance } = require('../models');
const { sendSessionInvite } = require('../utils/email');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create a new session
exports.createSession = catchAsync(async (req, res, next) => {
  const { title, description, sessionDate, startTime, endTime, facilitatorId, meetingLink, meetingType, tags, category } = req.body;

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
    category
  });

  // Send email invites
  // For simplicity, sending to all users - you may customize this
  const users = await User.findAll({ where: { isActive: true } });
  users.forEach(user => {
    sendSessionInvite(user, session).catch(err => {
      console.error(`Failed to send session invite to ${user.email}:`, err.message);
    });
  });

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
  await session.update(updates);

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

  const session = await Session.findByPk(sessionId);
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

  const { count, rows: sessions } = await Session.findAndCountAll({ where, limit, offset });

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
exports.getSessionStatistics = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const where = {};
  if (startDate || endDate) {
    where.sessionDate = {};
    if (startDate) where.sessionDate[Op.gte] = new Date(startDate);
    if (endDate) where.sessionDate[Op.lte] = new Date(endDate);
  }

  // Get various statistics
  const totalSessions = await Session.count({ where });
  const upcomingSessions = await Session.count({
    where: {
      ...where,
      sessionDate: { [Op.gte]: new Date() },
      status: 'scheduled'
    }
  });

  // Sessions by status
  const statusCounts = await Session.findAll({
    where,
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  // Format the statistics
  const statistics = {
    total: totalSessions,
    upcoming: upcomingSessions,
    byStatus: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {})
  };

  res.status(200).json({
    status: 'success',
    data: {
      statistics
    }
  });
});

// Search sessions with autocomplete
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
