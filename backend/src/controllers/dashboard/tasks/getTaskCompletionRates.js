const { Op } = require('sequelize');

/**
 * Get task completion rates by different periods
 * @param {Object} dateFilter - Date range filter
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {number} userId - User ID for non-admin queries
 * @param {string} interval - Time interval (daily, weekly, monthly)
 * @returns {Object} Task completion rates
 */
async function getTaskCompletionRates(dateFilter, isAdmin, userId, interval = 'daily') {
  try {
    const db = require('../../../models');
    const { Task } = db;
    
    const baseWhere = {};
    if (!isAdmin) {
      baseWhere[Op.or] = [
        { assignedTo: userId },
        { createdBy: userId }
      ];
    }

    let groupByClause;
    let dateFormat;
    
    switch(interval) {
      case 'weekly':
        groupByClause = Task.sequelize.fn('YEARWEEK', Task.sequelize.col('completed_at'));
        dateFormat = 'week';
        break;
      case 'monthly':
        groupByClause = Task.sequelize.fn('DATE_FORMAT', Task.sequelize.col('completed_at'), '%Y-%m');
        dateFormat = 'month';
        break;
      default: // daily
        groupByClause = Task.sequelize.fn('DATE', Task.sequelize.col('completed_at'));
        dateFormat = 'date';
    }

    // Get completed tasks grouped by period
    const completedByPeriod = await Task.findAll({
      where: {
        ...baseWhere,
        status: 'completed',
        completed_at: { [Op.ne]: null },
        ...(dateFilter && { completed_at: dateFilter })
      },
      attributes: [
        [groupByClause, dateFormat],
        [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'completed']
      ],
      group: [groupByClause],
      order: [[groupByClause, 'ASC']],
      raw: true
    });

    // Get created tasks grouped by period
    const createdByPeriod = await Task.findAll({
      where: {
        ...baseWhere,
        ...(dateFilter && { createdAt: dateFilter })
      },
      attributes: [
        [groupByClause, dateFormat],
        [Task.sequelize.fn('COUNT', Task.sequelize.col('id')), 'created']
      ],
      group: [groupByClause],
      order: [[groupByClause, 'ASC']],
      raw: true
    });

    // Merge data and calculate rates
    const periodMap = new Map();
    
    createdByPeriod.forEach(item => {
      const period = item[dateFormat];
      periodMap.set(period, {
        period,
        created: parseInt(item.created),
        completed: 0,
        rate: 0
      });
    });

    completedByPeriod.forEach(item => {
      const period = item[dateFormat];
      if (periodMap.has(period)) {
        const data = periodMap.get(period);
        data.completed = parseInt(item.completed);
        data.rate = data.created > 0 ? Math.round((data.completed / data.created) * 100 * 10) / 10 : 0;
      }
    });

    return Array.from(periodMap.values());
  } catch (error) {
    console.error('Error in getTaskCompletionRates:', error);
    throw error;
  }
}

module.exports = getTaskCompletionRates;
