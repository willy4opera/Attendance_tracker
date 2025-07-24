const { Task, TaskList, User, Board, TaskComment, TaskActivity, TaskWatcher } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const taskAssignmentNotification = require('./taskAssignmentNotificationSimple.controller');

class TaskController {
  // Get all tasks for the current user
  async getAllTasks(req, res) {
    try {
      const { search, status, priority, page = 1, limit = 50 } = req.query;

      const offset = (page - 1) * limit;
      const filter = {
        createdBy: req.user.id,
        isArchived: false
      };

      if (search) {
        filter.title = {
          [Op.iLike]: `%${search}%`
        };
      }

      if (status) {
        filter.status = status;
      }

      if (priority) {
        filter.priority = priority;
      }

      const tasks = await Task.findAndCountAll({
        where: filter,
        include: [
          {
            model: TaskList,
            as: "list",
            attributes: ["id", "name"],
            include: [{
              model: Board,
              as: "board",
              attributes: ["id", "name"]
            }]
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "firstName", "lastName"]
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          tasks: tasks.rows,
          total: tasks.count,
          page: parseInt(page),
          totalPages: Math.ceil(tasks.count / limit)
        }
      });
    } catch (error) {
      logger.error("Error fetching all tasks:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching all tasks",
        error: error.message
      });
    }
  }

  // Create task
  async createTask(req, res) {
    try {
      const {
        title,
        description,
        taskListId,
        position = 0,
        priority = 'medium',
        assignedTo = [],
        assignedDepartments = [],
        dueDate,
        startDate,
        estimatedHours,
        labels = [],
        checklist = []
      } = req.body;

      if (!title || !taskListId) {
        return res.status(400).json({
          success: false,
          message: 'Title and task list ID are required'
        });
      }

      // Verify task list exists
      const taskList = await TaskList.findByPk(taskListId);
      if (!taskList) {
        return res.status(404).json({
          success: false,
          message: 'Task list not found'
        });
      }

      const task = await Task.create({
        title,
        description,
        taskListId,
        boardId: taskList.boardId,
        position,
        createdBy: req.user.id,
        priority,
        assignedTo,
        assignedDepartments,
        dueDate,
        startDate,
        estimatedHours,
        labels,
        checklist
      });

      // Auto-watch the task for the creator
      await TaskWatcher.create({
        taskId: task.id,
        userId: req.user.id,
        isWatching: true
      });

      // Auto-watch the task for assigned users
      if (assignedTo && assignedTo.length > 0) {
        const watcherPromises = assignedTo
          .filter(userId => userId !== req.user.id) // Don't duplicate if creator is also assigned
          .map(userId => 
            TaskWatcher.create({
              taskId: task.id,
              userId: userId,
              isWatching: true
            })
          );
        
        await Promise.all(watcherPromises);
        
        // Update watcher count
        const totalWatchers = await TaskWatcher.count({
          where: { taskId: task.id, isWatching: true }
        });
        await task.update({ watcherCount: totalWatchers });
      }

      // Create activity log - using the correct field names
      await TaskActivity.create({
        taskId: task.id,
        boardId: taskList.boardId,
        userId: req.user.id,
        activityType: 'created',
        details: {
          message: `Created task "${title}"`,
          taskId: task.id,
          taskTitle: title
        },
        metadata: { taskId: task.id }
      });

      // Send assignment notifications
      if (assignedTo.length > 0 || assignedDepartments.length > 0) {
        console.log('DEBUG: Attempting to send assignment notifications');
        console.log('DEBUG: assignedTo:', assignedTo);
        console.log('DEBUG: assignedDepartments:', assignedDepartments);
        taskAssignmentNotification.handleTaskAssignment(
          task,
          assignedTo,
          assignedDepartments,
          'task_assigned'
        ).catch(err => {
          logger.error('Failed to send assignment notifications:', err);
        });
      }

      const fullTask = await Task.findByPk(task.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: TaskList,
            as: 'list',
            attributes: ['id', 'name']
          }
        ]
      });

      logger.info(`Task created: ${title} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: fullTask
      });
    } catch (error) {
      logger.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating task',
        error: error.message
      });
    }
  }

  // Get task by ID
  // Get task by ID
  async getTaskById(req, res) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: TaskList,
            as: 'list',
            attributes: ['id', 'name', 'boardId'],
            include: [
              {
                model: Board,
                as: 'board',
                attributes: ['id', 'name', 'projectId', 'departmentId']
              }
            ]
          },
          {
            model: User,
            as: 'watchers',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            through: { attributes: ['isWatching'] }
          }
        ]
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Convert to plain object to add additional data
      const taskData = task.toJSON();

      // Fetch assigned users if assignedTo array has values
      if (taskData.assignedTo && taskData.assignedTo.length > 0) {
        const assignedUsers = await User.findAll({
          where: { id: taskData.assignedTo },
          attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture', 'role']
        });
        taskData.assignedUsers = assignedUsers;
      } else {
        taskData.assignedUsers = [];
      }

      // Fetch assigned departments if array has values
      if (taskData.assignedDepartments && taskData.assignedDepartments.length > 0) {
        const Department = require('../models').Department;
        const departments = await Department.findAll({
          where: { id: taskData.assignedDepartments },
          attributes: ['id', 'name', 'code']
        });
        taskData.assignedDepartmentDetails = departments;
      } else {
        taskData.assignedDepartmentDetails = [];
      }

      // Fetch task dependencies
      const TaskDependency = require('../models').TaskDependency;
      const [predecessorDeps, successorDeps] = await Promise.all([
        TaskDependency.findAll({
          where: { successorTaskId: id },
          include: [{
            model: Task,
            as: 'predecessorTask',
            attributes: ['id', 'title', 'status', 'completedAt']
          }]
        }),
        TaskDependency.findAll({
          where: { predecessorTaskId: id },
          include: [{
            model: Task,
            as: 'successorTask',
            attributes: ['id', 'title', 'status']
          }]
        })
      ]);

      // Format dependencies
      taskData.dependencies = {
        predecessors: predecessorDeps.map(dep => ({
          id: dep.predecessorTask.id,
          title: dep.predecessorTask.title,
          status: dep.predecessorTask.status,
          completedAt: dep.predecessorTask.completedAt,
          dependencyType: dep.dependencyType
        })),
        successors: successorDeps.map(dep => ({
          id: dep.successorTask.id,
          title: dep.successorTask.title,
          status: dep.successorTask.status,
          dependencyType: dep.dependencyType
        }))
      };

      // Add completion status
      taskData.isCompleted = taskData.status === 'done' || taskData.completedAt !== null;

      // Extract project info if available
      if (taskData.list && taskData.list.board && taskData.list.board.projectId) {
        taskData.projectId = taskData.list.board.projectId;
        taskData.boardId = taskData.list.board.id;
        taskData.boardName = taskData.list.board.name;
        
        // Get project details if needed
        const Project = require('../models').Project;
        const project = await Project.findByPk(taskData.list.board.projectId, {
          attributes: ['id', 'name']
        });
        if (project) {
          taskData.projectName = project.name;
        }
      }

      res.json({
        success: true,
        data: taskData
      });
    } catch (error) {
      logger.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching task',
        error: error.message
      });
    }
  }

  // Update task
  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const task = await Task.findByPk(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const oldValues = {
        title: task.title,
        details: { message: `Task updated` },
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo
      };

      await task.update(updates);

      // Handle watcher updates for assigned users
      if (updates.assignedTo && Array.isArray(updates.assignedTo)) {
        // Get current watchers
        const currentWatchers = await TaskWatcher.findAll({
          where: { taskId: task.id }
        });
        
        // Add new assigned users as watchers
        const newAssignees = updates.assignedTo.filter(userId => 
          !currentWatchers.some(w => w.userId === userId)
        );
        
        if (newAssignees.length > 0) {
          const watcherPromises = newAssignees.map(userId =>
            TaskWatcher.create({
              taskId: task.id,
              userId: userId,
              isWatching: true
            })
          );
          await Promise.all(watcherPromises);
          
          // Update watcher count
          const totalWatchers = await TaskWatcher.count({
            where: { taskId: task.id, isWatching: true }
          });
          await task.update({ watcherCount: totalWatchers });
        }
      }

      // Create activity log for significant changes
      const taskList = await TaskList.findByPk(task.taskListId);
      if (updates.title && updates.title !== oldValues.title) {
        await TaskActivity.create({
          taskId: task.id,
          boardId: taskList.boardId,
          userId: req.user.id,
          activityType: 'updated',
          details: {
            message: `Changed title from "${oldValues.title}" to "${updates.title}"`,
            field: 'title',
            oldValue: oldValues.title,
            newValue: updates.title
          },
          metadata: { field: 'title', oldValue: oldValues.title, newValue: updates.title }
        });
      }

      if (updates.status && updates.status !== oldValues.status) {
        await TaskActivity.create({
          taskId: task.id,
          boardId: taskList.boardId,
          userId: req.user.id,
          activityType: 'updated',
          details: {
            message: `Changed status from "${oldValues.status}" to "${updates.status}"`,
            field: 'status',
            oldValue: oldValues.status,
            newValue: updates.status
          },
          metadata: { field: 'status', oldValue: oldValues.status, newValue: updates.status }
        });
      }

      const updatedTask = await Task.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: TaskList,
            as: 'list',
            attributes: ['id', 'name']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      });
    } catch (error) {
      logger.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating task',
        error: error.message
      });
    }
  }

  // Delete task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check permissions
      if (task.createdBy !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own tasks'
        });
      }

      await task.destroy();

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting task',
        error: error.message
      });
    }
  }

  // Watch/Unwatch task
  async toggleWatchTask(req, res) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const existingWatcher = await TaskWatcher.findOne({
        where: {
          taskId: id,
          userId: req.user.id
        }
      });

      if (existingWatcher) {
        await existingWatcher.update({ isWatching: !existingWatcher.isWatching });
        
        // Update watcher count
        const watcherCount = await TaskWatcher.count({
          where: { taskId: id, isWatching: true }
        });
        await task.update({ watcherCount });

        res.json({
          success: true,
          message: existingWatcher.isWatching ? 'Task watched' : 'Task unwatched',
          data: { watching: existingWatcher.isWatching }
        });
      } else {
        await TaskWatcher.create({
          taskId: id,
          userId: req.user.id,
          isWatching: true
        });

        await task.increment('watcherCount');

        res.json({
          success: true,
          message: 'Task watched',
          data: { watching: true }
        });
      }
    } catch (error) {
      logger.error('Error toggling task watch:', error);
      res.status(500).json({
        success: false,
        message: 'Error toggling task watch',
        error: error.message
      });
    }
  }

  // Get tasks for a list
  async getListTasks(req, res) {
    try {
      const { listId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const tasks = await Task.findAndCountAll({
        where: { 
          taskListId: listId,
          isArchived: false 
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['position', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          tasks: tasks.rows,
          total: tasks.count,
          page: parseInt(page),
          totalPages: Math.ceil(tasks.count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching list tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching list tasks',
        error: error.message
      });
    }
  }
}

module.exports = new TaskController();
