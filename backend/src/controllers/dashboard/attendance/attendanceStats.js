const { Op } = require('sequelize');
const { Session, Attendance, User, sequelize } = require('../../../models');

async function getAttendanceStats(dateFilter, isAdmin, userId, interval) {
  try {
    // Base queries
    const sessionWhereClause = dateFilter && Object.keys(dateFilter).length ? { sessionDate: dateFilter } : {};
    const attendanceWhereClause = isAdmin ? {} : { userId };

    // Get summary statistics
    const [
      totalSessions,
      totalAttendance,
      todaysSessions,
      upcomingSessions
    ] = await Promise.all([
      Session.count({ where: sessionWhereClause }),
      Attendance.count({ 
        where: { 
          ...attendanceWhereClause,
          status: { [Op.in]: ['present', 'late'] }
        }
      }),
      Session.count({
        where: {
          sessionDate: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0),
            [Op.lt]: new Date().setHours(23, 59, 59, 999)
          }
        }
      }),
      Session.count({
        where: {
          sessionDate: { [Op.gte]: new Date() },
          status: 'scheduled'
        }
      })
    ]);

    // Calculate average attendance rate
    const averageAttendanceRate = totalSessions > 0 
      ? Math.round((totalAttendance / totalSessions) * 100 * 10) / 10 
      : 0;

    // Get status distribution
    const statusDistribution = await Attendance.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      where: attendanceWhereClause,
      group: ['status'],
      raw: true
    });

    // Format status distribution for charts
    const statusLabels = ['Present', 'Late', 'Absent', 'Excused'];
    const statusValues = statusLabels.map(label => {
      const status = label.toLowerCase();
      const found = statusDistribution.find(s => s.status === status);
      return found ? parseInt(found.count) : 0;
    });

    // Get trends data based on interval
    let trends = { daily: [], weekly: [], monthly: [] };
    
    if (interval === 'daily' || !interval) {
      // Get daily attendance for last 30 days using PostgreSQL syntax
      const dailyData = await sequelize.query(`
        SELECT 
          DATE(s.session_date) as date,
          COUNT(DISTINCT s.id) as total_sessions,
          COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.id END) as attended,
          CASE 
            WHEN COUNT(DISTINCT s.id) > 0 
            THEN ROUND(COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.id END) * 100.0 / COUNT(DISTINCT s.id), 1)
            ELSE 0 
          END as attendance_rate
        FROM "Sessions" s
        LEFT JOIN "Attendances" a ON s.id = a.session_id ${!isAdmin ? `AND a.user_id = '${userId}'` : ''}
        WHERE s.session_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(s.session_date)
        ORDER BY date DESC
        LIMIT 30
      `, { type: sequelize.QueryTypes.SELECT });

      trends.daily = dailyData.map(d => ({
        date: d.date,
        value: parseFloat(d.attendance_rate)
      }));
    }

    // Get personal stats for non-admin users
    let personalStats = null;
    if (!isAdmin) {
      const [myAttendanceRate, sessionsAttended, sessionsTotal] = await Promise.all([
        // Calculate personal attendance rate
        (async () => {
          const attended = await Attendance.count({
            where: {
              userId,
              status: { [Op.in]: ['present', 'late'] }
            }
          });
          const total = await Attendance.count({ where: { userId } });
          return total > 0 ? Math.round((attended / total) * 100) : 0;
        })(),
        // Sessions attended
        Attendance.count({
          where: {
            userId,
            status: { [Op.in]: ['present', 'late'] }
          }
        }),
        // Total sessions for user
        Attendance.count({ where: { userId } })
      ]);

      // Get recent attendance
      const recentAttendance = await Attendance.findAll({
        where: { userId },
        include: [{
          model: Session,
          as: 'session',
          attributes: ['id', 'title', 'sessionDate']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      personalStats = {
        myAttendanceRate,
        sessionsAttended,
        sessionsTotal,
        recentAttendance: recentAttendance.map(a => ({
          sessionId: a.session.id,
          sessionName: a.session.title,
          date: a.session.sessionDate,
          status: a.status
        }))
      };
    }

    // Get attendance by session (top 10) using PostgreSQL syntax
    const sessionAttendance = await sequelize.query(`
      SELECT 
        s.id,
        s.title as session_name,
        s.session_date as date,
        COUNT(DISTINCT a.id) as total_attendees,
        COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.id END) as present_count,
        CASE 
          WHEN COUNT(DISTINCT a.id) > 0 
          THEN ROUND(COUNT(DISTINCT CASE WHEN a.status IN ('present', 'late') THEN a.id END) * 100.0 / COUNT(DISTINCT a.id), 1)
          ELSE 0 
        END as attendance_rate
      FROM "Sessions" s
      LEFT JOIN "Attendances" a ON s.id = a.session_id
      WHERE s.session_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY s.id, s.title, s.session_date
      ORDER BY s.session_date DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    return {
      summary: {
        totalSessions,
        totalAttendance,
        averageAttendanceRate,
        todaysSessions,
        upcomingSessions
      },
      trends,
      statusDistribution: {
        labels: statusLabels,
        values: statusValues,
        colors: ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
      },
      bySession: sessionAttendance.map(s => ({
        sessionName: s.session_name,
        date: s.date,
        attendanceRate: parseFloat(s.attendance_rate),
        totalAttendees: parseInt(s.total_attendees)
      })),
      personalStats
    };
  } catch (error) {
    console.error('Error in getAttendanceStats:', error);
    throw error;
  }
}

module.exports = getAttendanceStats;
