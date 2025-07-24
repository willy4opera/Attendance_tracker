const { Op } = require('sequelize');

/**
 * Get task statistics grouped by project
 * @param {Object} dateFilter - Date range filter
 * @param {boolean} isAdmin - Whether the user is an admin
 * @param {number} userId - User ID for non-admin queries
 * @returns {Object} Tasks grouped by project
 */
async function getTasksByProject(dateFilter, isAdmin, userId) {
  try {
    const db = require('../../../models');
    const { Task, Board, TaskList } = db;
    
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

    // Get tasks grouped by board (project) with status counts
    const tasksByProject = await Task.findAll({
      where: baseWhere,
      attributes: [
        'status',
        'boardId',
        [Task.sequelize.fn('COUNT', Task.sequelize.col('Task.id')), 'count']
      ],
      include: [{
        model: Board,
        as: 'board',
        attributes: ['id', 'name', 'description']
      }],
      group: ['boardId', 'board.id', 'board.name', 'board.description', 'status'],
      raw: false
    });

    // Organize data by project
    const projectMap = new Map();
    
    tasksByProject.forEach(item => {
      if (item.board) {
        const projectId = item.board.id;
        const projectData = projectMap.get(projectId) || {
          id: projectId,
          name: item.board.name,
          description: item.board.description,
          totalTasks: 0,
          tasksByStatus: {
            todo: 0,
            'in-progress': 0,
            completed: 0,
            'on-hold': 0,
            cancelled: 0
          }
        };
        
        const count = parseInt(item.dataValues.count);
        projectData.tasksByStatus[item.status] = count;
        projectData.totalTasks += count;
        
        projectMap.set(projectId, projectData);
      }
    });

    // Convert to array and calculate completion rates
    const projects = Array.from(projectMap.values()).map(project => ({
      ...project,
      completionRate: project.totalTasks > 0 
        ? Math.round((project.tasksByStatus.completed / project.totalTasks) * 100 * 10) / 10 
        : 0
    }));

    // Sort by total tasks descending
    projects.sort((a, b) => b.totalTasks - a.totalTasks);

    return projects.slice(0, 10); // Return top 10 projects
  } catch (error) {
    console.error('Error in getTasksByProject:', error);
    throw error;
  }
}

module.exports = getTasksByProject;
