const { Op } = require('sequelize');

/**
 * Get session statistics with accurate attendance rates using expectedAttendeesCount
 * @param {Object} dateFilter - Date range filter
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {number} userId - User ID for non-admin queries
 * @returns {Object} Session statistics
 */
async function getSessionStats(dateFilter, isAdmin, userId) {
  try {
    const db = require('../../../models');
    const { Session, Attendance, User } = db;

    console.log('getSessionStats called with:', { dateFilter, isAdmin, userId });
    
    // Build base where condition
    const baseWhere = {};
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      baseWhere.sessionDate = dateFilter;
    }

    if (!isAdmin) {
      // For non-admin users, show sessions they're facilitating
      baseWhere.facilitatorId = userId;
    }

    // Get current date for comparisons
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Count total sessions
    const totalSessions = await Session.count({
      where: baseWhere
    });

    // Count completed sessions (session date is in the past)
    const completedSessions = await Session.count({
      where: {
        ...baseWhere,
        sessionDate: { [Op.lt]: today }
      }
    });

    // Count upcoming sessions (session date is in the future)
    const upcomingSessions = await Session.count({
      where: {
        ...baseWhere,
        sessionDate: { [Op.gt]: today }
      }
    });

    // Count today's sessions
    const todaySessions = await Session.count({
      where: {
        ...baseWhere,
        sessionDate: today
      }
    });

    // Calculate attendance rate using expectedAttendeesCount for better accuracy
    let averageAttendance = 0;
    
    const sessionsWithAttendance = await Session.findAll({
      where: {
        ...baseWhere,
        sessionDate: { [Op.lt]: today }, // Only completed sessions
        [Op.or]: [
          { expectedAttendeesCount: { [Op.gt]: 0 } }, // Sessions with expected count
          { '$attendances.id$': { [Op.ne]: null } }   // Or sessions with actual attendance
        ]
      },
      attributes: ['id', 'title', 'sessionDate', 'expectedAttendeesCount'],
      include: [{
        model: Attendance,
        as: 'attendances',
        attributes: ['id', 'status'],
        required: false
      }]
    });

    console.log(`Found ${sessionsWithAttendance.length} completed sessions to calculate attendance`);

    let totalAttendanceRate = 0;
    let sessionsWithData = 0;

    for (const session of sessionsWithAttendance) {
      const attendances = session.attendances || [];
      const actualAttendees = attendances.length;
      const expectedCount = session.expectedAttendeesCount || actualAttendees; // Fallback to actual if no expected count
      
      if (expectedCount > 0) {
        const presentCount = attendances.filter(a => a.status === 'present').length;
        const lateCount = attendances.filter(a => a.status === 'late').length;
        const attendedCount = presentCount + lateCount;
        
        // Use expectedCount as denominator for more accurate rate
        const sessionRate = (attendedCount / expectedCount) * 100;
        totalAttendanceRate += sessionRate;
        sessionsWithData++;
        
        console.log(`Session ${session.id}: ${attendedCount}/${expectedCount} = ${sessionRate.toFixed(1)}%`);
      }
    }

    averageAttendance = sessionsWithData > 0 ? 
      Math.round((totalAttendanceRate / sessionsWithData) * 10) / 10 : 0;

    console.log(`Average attendance calculated: ${averageAttendance}% from ${sessionsWithData} sessions`);

    // Get sessions by status
    const sessionsByStatus = await Session.findAll({
      where: baseWhere,
      attributes: [
        'status',
        [Session.sequelize.fn('COUNT', Session.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get sessions by category
    const sessionsByCategory = await Session.findAll({
      where: baseWhere,
      attributes: [
        'category',
        [Session.sequelize.fn('COUNT', Session.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    // Get detailed attendance rates per session (for recent sessions)
    const recentSessionsWithRates = await Session.findAll({
      where: {
        ...baseWhere,
        sessionDate: { [Op.lt]: today }
      },
      attributes: ['id', 'title', 'sessionDate', 'status', 'expectedAttendeesCount'],
      include: [{
        model: Attendance,
        as: 'attendances',
        attributes: ['id', 'status'],
        required: false
      }],
      order: [['sessionDate', 'DESC']],
      limit: 10
    });

    const recentSessions = recentSessionsWithRates.map(session => {
      const attendances = session.attendances || [];
      const actualTotal = attendances.length;
      const expectedTotal = session.expectedAttendeesCount || actualTotal;
      const present = attendances.filter(a => a.status === 'present').length;
      const late = attendances.filter(a => a.status === 'late').length;
      const absent = attendances.filter(a => a.status === 'absent').length;
      
      // Calculate rate based on expected attendees for better accuracy
      const attendanceRate = expectedTotal > 0 ? 
        Math.round(((present + late) / expectedTotal) * 100 * 10) / 10 : 0;

      return {
        id: session.id,
        title: session.title,
        date: session.sessionDate,
        status: session.status,
        attendance: {
          expected: expectedTotal,
          actual: actualTotal,
          present,
          late,
          absent,
          rate: attendanceRate
        }
      };
    });

    // Return enhanced session statistics
    return {
      summary: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        todaySessions,
        averageAttendance
      },
      byStatus: sessionsByStatus.map(item => ({
        status: item.status || 'unspecified',
        count: parseInt(item.count),
        percentage: totalSessions > 0 ? 
          Math.round((parseInt(item.count) / totalSessions) * 100 * 10) / 10 : 0
      })),
      byCategory: sessionsByCategory.map(item => ({
        category: item.category || 'unspecified',
        count: parseInt(item.count),
        percentage: totalSessions > 0 ? 
          Math.round((parseInt(item.count) / totalSessions) * 100 * 10) / 10 : 0
      })),
      attendanceRates: {
        average: averageAttendance,
        sessionsAnalyzed: sessionsWithData,
        description: 'Rate calculated using expected attendees count where available'
      },
      upcomingList: [], // Can be implemented later
      recentSessions
    };

  } catch (error) {
    console.error('Error in getSessionStats:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = getSessionStats;
