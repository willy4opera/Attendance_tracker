const { Op } = require('sequelize');
const { 
  Session, Attendance, Task, User, Project, Board, Activity, Notification, 
  sequelize 
} = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Import modular statistics
const { getTaskStats, getTaskCompletionRates, getTasksByProject } = require('./dashboard/tasks');
const { getSessionStats } = require('./dashboard/sessions');
const getAttendanceStats = require('./dashboard/attendance/attendanceStats');

// Main comprehensive dashboard endpoint
exports.getComprehensiveDashboardData = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
  const { 
    startDate, 
    endDate, 
    interval = 'daily', 
    sections,
    refresh 
  } = req.query;
  
  const requestStartTime = Date.now();

  try {
    // Build date filters
    const dateFilter = {};
    if (startDate) {
      dateFilter[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      dateFilter[Op.lte] = new Date(endDate);
    }

    // Build response data object
    const responseData = {
      overview: await getOverviewStats(isAdmin, userId),
      attendance: sections?.includes('attendance') !== false ? 
        await getAttendanceStats(dateFilter, isAdmin, userId, interval) : null,
      tasks: sections?.includes('tasks') !== false ? 
        await getTaskStats(dateFilter, isAdmin, userId) : null,
      taskCompletionRates: sections?.includes('tasks') !== false ?
        await getTaskCompletionRates(dateFilter, isAdmin, userId, interval) : null,
      tasksByProject: sections?.includes('tasks') !== false ?
        await getTasksByProject(dateFilter, isAdmin, userId) : null,
      projects: sections?.includes('projects') !== false ? 
        await getProjectStats(dateFilter, isAdmin, userId) : null,
      sessions: sections?.includes('sessions') !== false ? 
        await getSessionStats(dateFilter, isAdmin, userId) : null,
      users: sections?.includes('users') !== false && isAdmin ? 
        await getUserStats(dateFilter) : null,
      activities: sections?.includes('activities') !== false ? 
        await getActivityStats(dateFilter, isAdmin, userId) : null,
      trends: sections?.includes('trends') !== false ? 
        await getTrendsData(dateFilter, isAdmin, userId) : null
    };

    const processingTime = Date.now() - requestStartTime;

    res.status(200).json({
      status: 'success',
      data: responseData,
      meta: {
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate || 'all-time',
          end: endDate || 'current'
        },
        userRole: req.user.role,
        processingTime: `${processingTime}ms`,
        interval
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return next(new AppError('Failed to fetch dashboard data', 500));
  }
});

// Overview statistics
async function getOverviewStats(isAdmin, userId) {
  const whereCondition = isAdmin ? {} : { userId };
  
  const [totalUsers, activeTasks, completedTasks, upcomingSessions] = await Promise.all([
    isAdmin ? User.count({ where: { isActive: true } }) : 1,
    Task.count({ where: { ...whereCondition, status: { [Op.in]: ['todo', 'in-progress'] } } }),
    Task.count({ where: { ...whereCondition, status: 'done' } }),
    Session.count({ where: { 
      startTime: { [Op.gte]: new Date() }, 
      ...(isAdmin ? {} : { userId }) 
    } })
  ]);

  const completionRate = (activeTasks + completedTasks) > 0 
    ? Math.round((completedTasks / (activeTasks + completedTasks)) * 100) 
    : 0;

  return {
    totalUsers,
    activeTasks,
    completedTasks,
    completionRate,
    upcomingSessions
  };
}

// Project statistics
async function getProjectStats(dateFilter, isAdmin, userId) {
  try {
    console.log("=== getProjectStats called ===");
    console.log("dateFilter:", dateFilter);
    console.log("isAdmin:", isAdmin);
    console.log("userId:", userId);
    
    const baseWhere = {};
    if (!isAdmin) {
      // For non-admin users, show projects they're involved in
      // Use the raw column name from database
      baseWhere[Op.or] = [
        sequelize.where(sequelize.col('project_manager_id'), userId)
      ];
    }
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      baseWhere.createdAt = dateFilter;
    }
    
    console.log("baseWhere after setup:", baseWhere);

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      cancelledProjects
    ] = await Promise.all([
      Project.count({ where: baseWhere }),
      Project.count({ where: { ...baseWhere, status: 'active' } }),
      Project.count({ where: { ...baseWhere, status: 'completed' } }),
      Project.count({ where: { ...baseWhere, status: 'planning' } }), // Use 'planning' instead of 'on-hold'
      Project.count({ where: { ...baseWhere, status: 'cancelled' } })
    ]);

    console.log("Project counts:", { totalProjects, activeProjects, completedProjects, onHoldProjects, cancelledProjects });

    // Get project progress data
    const projectProgress = await Project.findAll({
      where: baseWhere,
      attributes: ['id', 'name', 'status'],
      order: [['updatedAt', 'DESC']],
      limit: 10
    });

    // Get tasks per project - simplified query without complex joins
    const tasksPerProject = await sequelize.query(`
      SELECT 
        p.id as projectId,
        p.name as projectName,
        COUNT(b.id) as boardCount
      FROM "Projects" p
      LEFT JOIN "Boards" b ON p.id = b.project_id
      ${!isAdmin ? 'WHERE p.project_manager_id = :userId' : ''}
      GROUP BY p.id, p.name
      ORDER BY COUNT(b.id) DESC
      LIMIT 10
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    return {
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,
        cancelledProjects,
        completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
      },
      progress: projectProgress.map(p => ({
        id: p.id,
        name: p.name,
        progress: 0, // Default since no progress column exists
        status: p.status
      })),
      taskDistribution: tasksPerProject.map(p => ({
        projectId: p.projectid,
        projectName: p.projectname,
        taskCount: parseInt(p.boardcount || 0)
      }))
    };
  } catch (error) {
    console.error('Error in getProjectStats:', error);
    console.error('Error stack:', error.stack);
    return {
      summary: {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        cancelledProjects: 0,
        completionRate: 0
      },
      progress: [],
      taskDistribution: []
    };
  }
}

// User statistics (admin only)
async function getUserStats(dateFilter) {
  try {
    const baseWhere = { isActive: true };
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      baseWhere.createdAt = dateFilter;
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers24h,
      activeUsers7d,
      activeUsers30d,
      newUsersThisMonth
    ] = await Promise.all([
      User.count({ where: baseWhere }),
      User.count({ where: { ...baseWhere, lastLogin: { [Op.gte]: last24h } } }),
      User.count({ where: { ...baseWhere, lastLogin: { [Op.gte]: last7d } } }),
      User.count({ where: { ...baseWhere, lastLogin: { [Op.gte]: last30d } } }),
      User.count({ where: { ...baseWhere, createdAt: { [Op.gte]: thisMonth } } })
    ]);

    // Get user registration trends (last 30 days)
    const registrationTrends = await User.findAll({
      where: {
        createdAt: { [Op.gte]: last30d }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    // Get top contributors (users with most tasks or activities)
    const topContributors = await User.findAll({
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        [sequelize.fn('COUNT', sequelize.col('assignedTasks.id')), 'taskCount']
      ],
      include: [{
        model: Task,
        as: 'assignedTasks',
        attributes: [],
        required: false
      }],
      group: ['User.id', 'User.firstName', 'User.lastName', 'User.email'],
      order: [[sequelize.fn('COUNT', sequelize.col('assignedTasks.id')), 'DESC']],
      limit: 10
    });

    return {
      summary: {
        totalUsers,
        activeUsers24h,
        activeUsers7d,
        activeUsers30d,
        newUsersThisMonth,
        engagementRate: totalUsers > 0 ? Math.round((activeUsers7d / totalUsers) * 100) : 0
      },
      registrationTrends: registrationTrends.map(r => ({
        date: r.dataValues.date,
        count: parseInt(r.dataValues.count)
      })),
      topContributors: topContributors.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        taskCount: parseInt(u.dataValues.taskCount || 0)
      }))
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      summary: {
        totalUsers: 0,
        activeUsers24h: 0,
        activeUsers7d: 0,
        activeUsers30d: 0,
        newUsersThisMonth: 0,
        engagementRate: 0
      },
      registrationTrends: [],
      topContributors: []
    };
  }
}

// Activity statistics
async function getActivityStats(dateFilter, isAdmin, userId) {
  try {
    const baseWhere = {};
    if (!isAdmin) {
      baseWhere.userId = userId;
    }
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      baseWhere.createdAt = dateFilter;
    }

    // Get recent activities
    const recentActivities = await Activity.findAll({
      where: baseWhere,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // Get activity counts by type
    const activityByType = await Activity.findAll({
      where: baseWhere,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    return {
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        action: a.action,
        description: a.description,
        user: a.user ? {
          id: a.user.id,
          name: `${a.user.firstName} ${a.user.lastName}`
        } : null,
        createdAt: a.createdAt
      })),
      byType: activityByType.map(a => ({
        type: a.action,
        count: parseInt(a.dataValues.count)
      }))
    };
  } catch (error) {
    console.error('Error in getActivityStats:', error);
    return {
      recentActivities: [],
      byType: []
    };
  }
}

// Trends data
async function getTrendsData(dateFilter, isAdmin, userId) {
  try {
    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get task completion trends
    const taskTrends = await Task.findAll({
      where: {
        status: 'done',
        completedAt: { [Op.gte]: last30d },
        ...(isAdmin ? {} : { 
          [Op.or]: [
            { assignedTo: userId },
            { createdBy: userId }
          ]
        })
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('completedAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('completedAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('completedAt')), 'ASC']]
    });

    // Get user engagement trends (login frequency)
    let engagementTrends = [];
    if (isAdmin) {
      engagementTrends = await sequelize.query(`
        SELECT 
          DATE(last_login) as date,
          COUNT(DISTINCT id) as active_users
        FROM "Users" 
        WHERE last_login >= :last30d
        GROUP BY DATE(last_login)
        ORDER BY date ASC
      `, {
        replacements: { last30d },
        type: sequelize.QueryTypes.SELECT
      });
    }

    return {
      taskProgress: taskTrends.map(t => ({
        date: t.dataValues.date,
        completed: parseInt(t.dataValues.count)
      })),
      userEngagement: engagementTrends.map(e => ({
        date: e.date,
        activeUsers: parseInt(e.active_users)
      }))
    };
  } catch (error) {
    console.error('Error in getTrendsData:', error);
    return {
      taskProgress: [],
      userEngagement: []
    };
  }
}
