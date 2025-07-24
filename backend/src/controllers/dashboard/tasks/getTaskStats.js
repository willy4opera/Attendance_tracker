const { Op } = require('sequelize');

/**
 * Get comprehensive task statistics
 * @param {Object} dateFilter - Date range filter
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {number} userId - User ID for non-admin queries
 * @returns {Object} Task statistics
 */
async function getTaskStats(dateFilter, isAdmin, userId) {
  try {
    // Import models inside the function to avoid circular dependency issues
    const db = require('../../../models');
    const { Task, User, Project, TaskList } = db;
    
    console.log('getTaskStats called with:', { dateFilter, isAdmin, userId });
    
    // Build base where condition
    const baseWhere = {};
    if (!isAdmin) {
      baseWhere[Op.or] = [
        { assignedTo: userId },
        { createdBy: userId }
      ];
    }
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      baseWhere.createdAt = dateFilter;
    }

    console.log('Base where condition:', baseWhere);

    // Get task counts by status
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      onHoldTasks,
      cancelledTasks
    ] = await Promise.all([
      Task.count({ where: baseWhere }),
      Task.count({ where: { ...baseWhere, status: 'done' } }),
      Task.count({ where: { ...baseWhere, status: 'in-progress' } }),
      Task.count({ where: { ...baseWhere, status: 'todo' } }),
      Task.count({ where: { ...baseWhere, status: 'on-hold' } }),
      Task.count({ where: { ...baseWhere, status: 'cancelled' } })
    ]);

    console.log('Task counts:', { totalTasks, completedTasks, inProgressTasks, todoTasks });

    // Calculate overdue tasks
    const overdueTasks = await Task.count({
      where: {
        ...baseWhere,
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.notIn]: ['done', 'cancelled'] }
      }
    });

    // Calculate tasks due soon (next 7 days)
    const dueSoonTasks = await Task.count({
      where: {
        ...baseWhere,
        dueDate: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: { [Op.notIn]: ['done', 'cancelled'] }
      }
    });

    // Get tasks by priority
    const tasksByPriority = await Task.findAll({
      where: baseWhere,
      attributes: [
        'priority',
        [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    // Get tasks by assignee (simplified without join)
    const tasksByAssignee = await Task.findAll({
      where: baseWhere,
      attributes: [
        'assignedTo',
        [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']
      ],
      group: ['assignedTo'],
      order: [[Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Extract unique user IDs and filter out invalid ones
    const assigneeIds = [];
    tasksByAssignee.forEach(task => {
      if (task.assignedTo) {
        // Handle comma-separated values
        const ids = task.assignedTo.toString().split(',').map(id => id.trim());
        ids.forEach(id => {
          const numId = parseInt(id);
          if (!isNaN(numId) && numId > 0 && !assigneeIds.includes(numId)) {
            assigneeIds.push(numId);
          }
        });
      }
    });

    console.log('Valid assignee IDs:', assigneeIds);

    // Get user details separately for assignees
    const users = assigneeIds.length > 0 ? await User.findAll({
      where: { id: assigneeIds },
      attributes: ['id', 'firstName', 'lastName', 'email']
    }) : [];
    
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? 
      Math.round((completedTasks / totalTasks) * 100 * 10) / 10 : 0;

    // Get completion trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completionTrends = await Task.findAll({
      where: {
        ...baseWhere,
        status: 'done',
        completed_at: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [Task.sequelize.fn('DATE', Task.sequelize.col('completed_at')), 'date'],
        [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'count']
      ],
      group: [Task.sequelize.fn('DATE', Task.sequelize.col('completed_at'))],
      order: [[Task.sequelize.fn('DATE', Task.sequelize.col('completed_at')), 'ASC']],
      raw: true
    });

    // Format the response - handle assignee mapping properly
    const formattedByAssignee = [];
    tasksByAssignee.forEach(item => {
      if (item.assignedTo) {
        // For comma-separated values, get the first valid ID
        const ids = item.assignedTo.toString().split(',').map(id => id.trim());
        const firstValidId = ids.find(id => {
          const numId = parseInt(id);
          return !isNaN(numId) && numId > 0 && userMap[numId];
        });
        
        if (firstValidId) {
          const user = userMap[parseInt(firstValidId)];
          formattedByAssignee.push({
            assignee: {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email
            },
            count: parseInt(item.count)
          });
        } else {
          formattedByAssignee.push({
            assignee: { id: null, name: 'Unassigned', email: null },
            count: parseInt(item.count)
          });
        }
      } else {
        formattedByAssignee.push({
          assignee: { id: null, name: 'Unassigned', email: null },
          count: parseInt(item.count)
        });
      }
    });

    return {
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        onHoldTasks,
        cancelledTasks,
        overdueTasks,
        dueSoonTasks,
        completionRate
      },
      statusDistribution: [
        { status: 'done', count: completedTasks, percentage: totalTasks ? (completedTasks / totalTasks * 100) : 0 },
        { status: 'in-progress', count: inProgressTasks, percentage: totalTasks ? (inProgressTasks / totalTasks * 100) : 0 },
        { status: 'todo', count: todoTasks, percentage: totalTasks ? (todoTasks / totalTasks * 100) : 0 },
        { status: 'on-hold', count: onHoldTasks, percentage: totalTasks ? (onHoldTasks / totalTasks * 100) : 0 },
        { status: 'cancelled', count: cancelledTasks, percentage: totalTasks ? (cancelledTasks / totalTasks * 100) : 0 }
      ],
      byPriority: tasksByPriority.map(item => ({
        priority: item.priority || 'none',
        count: parseInt(item.count),
        percentage: totalTasks ? (parseInt(item.count) / totalTasks * 100) : 0
      })),
      byAssignee: formattedByAssignee,
      completionTrends: completionTrends.map(item => ({
        date: item.date,
        completed: parseInt(item.count)
      }))
    };
  } catch (error) {
    console.error('Error in getTaskStats:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = getTaskStats;
