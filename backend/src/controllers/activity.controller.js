const { TaskActivity, Task, User, Board, TaskList } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ActivityController {
  // Get general activity feed with optional filters
  async getActivities(req, res) {
    try {
      const { page = 1, limit = 20, taskId, boardId, userId, activityType } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (taskId) {
        where.taskId = taskId;
      }
      
      if (boardId) {
        where.boardId = boardId;
      }
      
      if (userId) {
        where.userId = userId;
      }
      
      if (activityType) {
        where.activityType = activityType;
      }

      // Filter by visibility based on user permissions
      if (!userId || userId != req.user.id) {
        where.visibility = ['public', 'board'];
      }

      const activities = await TaskActivity.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'title'],
            include: [
              {
                model: TaskList,
                as: 'list',
                attributes: ['id', 'name'],
                include: [
                  {
                    model: Board,
                    as: 'board',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          },
          {
            model: Board,
            as: 'board',
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          activities: activities.rows,
          total: activities.count,
          page: parseInt(page),
          totalPages: Math.ceil(activities.count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching activities:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching activities',
        error: error.message
      });
    }
  }

  // Get task activity feed
  async getTaskActivityFeed(req, res) {
    try {
      const { taskId } = req.params;
      const { page = 1, limit = 20, activityType } = req.query;
      const offset = (page - 1) * limit;

      const where = { taskId };
      
      if (activityType) {
        where.activityType = activityType;
      }

      // Check if task exists
      const task = await Task.findByPk(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const activities = await TaskActivity.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'title'],
            include: [
              {
                model: TaskList,
                as: 'list',
                attributes: ['id', 'name'],
                include: [
                  {
                    model: Board,
                    as: 'board',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          },
          {
            model: Board,
            as: 'board',
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          activities: activities.rows,
          total: activities.count,
          page: parseInt(page),
          totalPages: Math.ceil(activities.count / limit),
          task: {
            id: task.id,
            title: task.title
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching task activity feed:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching task activity feed',
        error: error.message
      });
    }
  }

  // Get activity feed for a user
  async getUserActivityFeed(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, activityType } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (activityType) {
        where.activityType = activityType;
      }

      // If requesting own feed, include private activities
      if (userId == req.user.id) {
        where[Op.or] = [
          { userId: req.user.id },
          { visibility: ['public', 'board'] }
        ];
      } else {
        // For other users, only show public activities
        where.visibility = 'public';
        where.userId = userId;
      }

      const activities = await TaskActivity.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'title'],
            include: [
              {
                model: TaskList,
                as: 'list',
                attributes: ['id', 'name'],
                include: [
                  {
                    model: Board,
                    as: 'board',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          },
          {
            model: Board,
            as: 'board',
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          activities: activities.rows,
          total: activities.count,
          page: parseInt(page),
          totalPages: Math.ceil(activities.count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching activity feed:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching activity feed',
        error: error.message
      });
    }
  }

  // Get board activity feed
  async getBoardActivityFeed(req, res) {
    try {
      const { boardId } = req.params;
      const { page = 1, limit = 20, activityType } = req.query;
      const offset = (page - 1) * limit;

      const where = { boardId };
      
      if (activityType) {
        where.activityType = activityType;
      }

      // Check if user has access to this board
      const board = await Board.findByPk(boardId);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found'
        });
      }

      const activities = await TaskActivity.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'title'],
            include: [
              {
                model: TaskList,
                as: 'list',
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          activities: activities.rows,
          total: activities.count,
          page: parseInt(page),
          totalPages: Math.ceil(activities.count / limit),
          board: {
            id: board.id,
            name: board.name
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching board activity feed:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching board activity feed',
        error: error.message
      });
    }
  }

  // Create activity log
  async createActivity(req, res) {
    try {
      const { taskId, boardId, activityType, description, metadata, visibility = 'board' } = req.body;

      const activity = await TaskActivity.create({
        taskId,
        boardId,
        userId: req.user.id,
        activityType,
        details: { message: description },
        metadata: metadata || {},
        visibility
      });

      const fullActivity = await TaskActivity.findByPk(activity.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'title']
          },
          {
            model: Board,
            as: 'board',
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Activity created successfully',
        data: fullActivity
      });
    } catch (error) {
      logger.error('Error creating activity:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating activity',
        error: error.message
      });
    }
  }

  // Get activity statistics
  async getActivityStats(req, res) {
    try {
      const { userId } = req.params;
      const { timeRange = '7d' } = req.query;

      let dateFilter = new Date();
      switch (timeRange) {
        case '1d':
          dateFilter.setDate(dateFilter.getDate() - 1);
          break;
        case '7d':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case '30d':
          dateFilter.setDate(dateFilter.getDate() - 30);
          break;
        default:
          dateFilter.setDate(dateFilter.getDate() - 7);
      }

      const stats = await TaskActivity.findAll({
        where: {
          userId,
          createdAt: {
            [Op.gte]: dateFilter
          }
        },
        attributes: [
          'activityType',
          [sequelize.fn('COUNT', sequelize.col('activityType')), 'count']
        ],
        group: ['activityType'],
        raw: true
      });

      const totalActivities = await TaskActivity.count({
        where: {
          userId,
          createdAt: {
            [Op.gte]: dateFilter
          }
        }
      });

      res.json({
        success: true,
        data: {
          stats,
          totalActivities,
          timeRange
        }
      });
    } catch (error) {
      logger.error('Error fetching activity stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching activity stats',
        error: error.message
      });
    }
  }
}

module.exports = new ActivityController();
