// Enhanced getAllSessions with advanced filtering
exports.getAllSessions = catchAsync(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    startDate,
    endDate,
    status,
    facilitatorId,
    isVirtual,
    meetingType,
    category,
    tags,
    sortBy = 'sessionDate',
    sortOrder = 'DESC',
    upcoming // true to get only future sessions
  } = req.query;
  
  const offset = (page - 1) * limit;
  const where = {};
  const include = [];

  // Search across multiple fields
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
      { category: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Date range filtering
  if (startDate || endDate) {
    where.sessionDate = {};
    if (startDate) where.sessionDate[Op.gte] = new Date(startDate);
    if (endDate) where.sessionDate[Op.lte] = new Date(endDate);
  }

  // Upcoming sessions only
  if (upcoming === 'true') {
    where.sessionDate = { [Op.gte]: new Date() };
  }

  // Status filter
  if (status) {
    where.status = Array.isArray(status) ? { [Op.in]: status } : status;
  }

  // Virtual/In-person filter
  if (isVirtual !== undefined) {
    where.isVirtual = isVirtual === 'true';
  }

  // Meeting type filter
  if (meetingType) {
    where.meetingType = meetingType;
  }

  // Category filter
  if (category) {
    where.category = category;
  }

  // Tags filter (assuming tags is an array in the database)
  if (tags) {
    const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
    where.tags = { [Op.contains]: tagsArray };
  }

  // Facilitator filter with user details
  if (facilitatorId) {
    where.facilitatorId = facilitatorId;
  }

  // Always include facilitator details
  include.push({
    model: User,
    as: 'facilitator',
    attributes: ['id', 'firstName', 'lastName', 'email']
  });

  // Add attendance count
  include.push({
    model: Attendance,
    as: 'attendances',
    attributes: ['id'],
    required: false
  });

  // Sorting options
  const order = [[sortBy, sortOrder.toUpperCase()]];

  const { count, rows: sessions } = await Session.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order,
    distinct: true
  });

  // Transform sessions to include attendance count
  const sessionsWithStats = sessions.map(session => {
    const sessionData = session.toJSON();
    sessionData.attendanceCount = session.attendances ? session.attendances.length : 0;
    delete sessionData.attendances;
    return sessionData;
  });

  res.status(200).json({
    status: 'success',
    results: sessions.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      sessions: sessionsWithStats
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
  const [
    totalSessions,
    statusCounts,
    categoryCounts,
    virtualCounts,
    upcomingSessions
  ] = await Promise.all([
    // Total sessions
    Session.count({ where }),
    
    // Sessions by status
    Session.findAll({
      where,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
      ],
      group: ['status']
    }),
    
    // Sessions by category
    Session.findAll({
      where: { ...where, category: { [Op.ne]: null } },
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('category')), 'count']
      ],
      group: ['category']
    }),
    
    // Virtual vs In-person
    Session.findAll({
      where,
      attributes: [
        'isVirtual',
        [Sequelize.fn('COUNT', Sequelize.col('isVirtual')), 'count']
      ],
      group: ['isVirtual']
    }),
    
    // Upcoming sessions count
    Session.count({
      where: {
        ...where,
        sessionDate: { [Op.gte]: new Date() },
        status: 'scheduled'
      }
    })
  ]);

  // Format the statistics
  const statistics = {
    total: totalSessions,
    upcoming: upcomingSessions,
    byStatus: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.dataValues.count);
      return acc;
    }, {}),
    byCategory: categoryCounts.reduce((acc, curr) => {
      acc[curr.category] = parseInt(curr.dataValues.count);
      return acc;
    }, {}),
    virtual: virtualCounts.find(v => v.isVirtual === true)?.dataValues.count || 0,
    inPerson: virtualCounts.find(v => v.isVirtual === false)?.dataValues.count || 0
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
