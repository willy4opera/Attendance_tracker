const { Op } = require('sequelize');
const {
  Task,
  TaskList,
  Board,
  TaskDependency,
  DependencyNotification,
  User,
  Project,
  sequelize
} = require('../../models');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const logger = require('../../utils/logger');
const { debugLog } = require('../../utils/debugLogger');
const { emitSocketEvent } = require('../../utils/socketEmitter');
const { redisHelpers } = require('../../config/redis');

// Create a new dependency
exports.createDependency = catchAsync(async (req, res, next) => {
  const {
    predecessorTaskId,
    successorTaskId,
    dependencyType = 'FS',
    lagTime = 0,
    notifyUsers = true
  } = req.body;

  const userId = req.user.id;
  let createdDependency = null;
  let notificationData = null;

  // Start transaction
  createdDependency = await sequelize.transaction(async (t) => {
    // Validate tasks exist and user has access
    const [predecessorTask, successorTask] = await Promise.all([
      Task.findByPk(predecessorTaskId, {
        include: [{ model: TaskList, as: 'list', include: [{ model: Board, as: 'board' }] }],
        transaction: t
      }),
      Task.findByPk(successorTaskId, {
        include: [{ model: TaskList, as: 'list', include: [{ model: Board, as: 'board' }] }],
        transaction: t
      })
    ]);

    if (!predecessorTask || !successorTask) {
      throw new AppError('One or both tasks not found', 404);
    }

    // Store task data for notification
    if (notifyUsers) {
      notificationData = {
        predecessorTask: predecessorTask.toJSON(),
        successorTask: successorTask.toJSON()
      };
    }

    // Validate dependency
    await TaskDependency.validateDependency(predecessorTaskId, successorTaskId, dependencyType);

    // Create dependency
    const dependency = await TaskDependency.create({
      predecessorTaskId,
      successorTaskId,
      dependencyType,
      lagTime,
      createdBy: userId,
      updatedBy: userId
    }, { transaction: t });

    // Reload with associations
    const result = await TaskDependency.findByPk(dependency.id, {
      include: [
        {
          model: Task,
          as: 'predecessorTask',
          attributes: ['id', 'title', 'status', 'startDate', 'dueDate', 'createdBy']
        },
        {
          model: Task,
          as: 'successorTask',
          attributes: ['id', 'title', 'status', 'startDate', 'dueDate', 'createdBy']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      transaction: t
    });

    return result;
  });

  // Create notification AFTER transaction commits
  if (notifyUsers && createdDependency && notificationData) {
    try {
      // Get users to notify
      const usersToNotify = await exports.getUsersToNotify(
        notificationData.predecessorTask,
        notificationData.successorTask
      );
      
      if (usersToNotify.length > 0) {
        const notification = await DependencyNotification.createNotification({
          dependency: createdDependency,
          type: 'dependency_created',
          recipients: usersToNotify,
          channels: ['inApp', 'email'],
          priority: 'normal'
        });
        
        // Process notification immediately
        try {
          const notificationController = require('./dependencyNotification.controller');
          await notificationController.processNotification(notification);
          logger.info('Notification processed immediately');
        } catch (err) {
          logger.error('Failed to process notification immediately:', err);
        }
        logger.info(`Notifications created for dependency ${createdDependency.id}`);
      }
    } catch (notificationError) {
      // Log error but don't fail the whole operation
      logger.error('Failed to create notification:', notificationError);
    }
  }

  // Clear cache
  try {
    await redisHelpers.del(`dependencies:${createdDependency.successorTaskId}`);
    await redisHelpers.del(`dependencies:${createdDependency.predecessorTaskId}`);
  } catch (cacheError) {
    logger.error('Cache clear error:', cacheError);
  }

  // Emit socket event
  emitSocketEvent('dependency:created', {
    dependency: createdDependency,
    boardId: notificationData?.successorTask?.list?.board?.id
  });

  logger.info(`Dependency created: ${createdDependency.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: createdDependency,
    message: 'Dependency created successfully'
  });
});

// Get task dependencies
exports.getTaskDependencies = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { direction = 'both' } = req.query;

  // Check cache
  const cacheKey = `dependencies:${taskId}:${direction}`;
  try {
    const cachedData = await redisHelpers.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        count: cachedData.length,
        fromCache: true
      });
    }
  } catch (cacheError) {
    logger.error('Cache get error:', cacheError);
  }

  const task = await Task.findByPk(taskId);
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  let whereClause = {};
  if (direction === 'predecessor') {
    whereClause.successorTaskId = taskId;
  } else if (direction === 'successor') {
    whereClause.predecessorTaskId = taskId;
  } else {
    whereClause = {
      [Op.or]: [
        { predecessorTaskId: taskId },
        { successorTaskId: taskId }
      ]
    };
  }

  const dependencies = await TaskDependency.findAll({
    where: {
      ...whereClause,
      isActive: true
    },
    include: [
      {
        model: Task,
        as: 'predecessorTask',
        attributes: ['id', 'title', 'status', 'startDate', 'dueDate', 'createdBy']
      },
      {
        model: Task,
        as: 'successorTask',
        attributes: ['id', 'title', 'status', 'startDate', 'dueDate', 'createdBy']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  // Cache result
  try {
    await redisHelpers.setEx(cacheKey, dependencies, 3600);
  } catch (cacheError) {
    logger.error('Cache set error:', cacheError);
  }

  res.status(200).json({
    success: true,
    data: dependencies,
    count: dependencies.length
  });
});

// Update dependency
exports.updateDependency = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { dependencyType, lagTime, isActive } = req.body;
  const userId = req.user.id;

  const dependency = await TaskDependency.findByPk(id, {
    include: [
      { model: Task, as: 'predecessorTask' },
      { model: Task, as: 'successorTask' }
    ]
  });

  if (!dependency) {
    return next(new AppError('Dependency not found', 404));
  }

  // Update fields
  const updates = {};
  if (dependencyType !== undefined) updates.dependencyType = dependencyType;
  if (lagTime !== undefined) updates.lagTime = lagTime;
  if (isActive !== undefined) updates.isActive = isActive;
  updates.updatedBy = userId;

  await dependency.update(updates);

  // Clear cache
  try {
    await redisHelpers.del(`dependencies:${dependency.successorTaskId}`);
    await redisHelpers.del(`dependencies:${dependency.predecessorTaskId}`);
  } catch (cacheError) {
    logger.error('Cache clear error:', cacheError);
  }

  // Create update notification
  try {
    const usersToNotify = await exports.getUsersToNotify(
      dependency.predecessorTask,
      dependency.successorTask
    );

    if (usersToNotify.length > 0) {
      await DependencyNotification.createNotification({
        dependency,
        type: 'dependency_updated',
        recipients: usersToNotify,
        channels: ['inApp'],
        priority: 'low'
      });
    }
  } catch (notificationError) {
    logger.error('Failed to create update notification:', notificationError);
  }

  // Emit socket event
  emitSocketEvent('dependency:updated', {
    dependency,
    boardId: dependency.successorTask.list?.boardId
  });

  res.status(200).json({
    success: true,
    data: dependency,
    message: 'Dependency updated successfully'
  });
});

// Delete dependency
exports.deleteDependency = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const dependency = await TaskDependency.findByPk(id, {
    include: [
      { model: Task, as: 'predecessorTask' },
      { model: Task, as: 'successorTask' }
    ]
  });

  if (!dependency) {
    return next(new AppError('Dependency not found', 404));
  }

  // Soft delete by setting isActive to false
  await dependency.update({ isActive: false, updatedBy: userId });

  // Clear cache
  try {
    await redisHelpers.del(`dependencies:${dependency.successorTaskId}`);
    await redisHelpers.del(`dependencies:${dependency.predecessorTaskId}`);
  } catch (cacheError) {
    logger.error('Cache clear error:', cacheError);
  }

  // Create removal notification
  try {
    const usersToNotify = await exports.getUsersToNotify(
      dependency.predecessorTask,
      dependency.successorTask
    );

    if (usersToNotify.length > 0) {
      await DependencyNotification.createNotification({
        dependency,
        type: 'dependency_removed',
        recipients: usersToNotify,
        channels: ['inApp'],
        priority: 'low'
      });
    }
  } catch (notificationError) {
    logger.error('Failed to create removal notification:', notificationError);
  }

  // Emit socket event
  emitSocketEvent('dependency:deleted', {
    dependencyId: id,
    boardId: dependency.successorTask.list?.boardId
  });

  res.status(200).json({
    success: true,
    message: 'Dependency removed successfully'
  });
});

// Get project dependencies
exports.getProjectDependencies = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const { includeInactive = false } = req.query;

  // Get all tasks in the project
  const tasks = await Task.findAll({
    include: [{
      model: TaskList,
      as: 'list',
      required: true,
      include: [{
        model: Board,
        as: 'board',
        where: { projectId },
        required: true
      }]
    }],
    attributes: ['id']
  });

  const taskIds = tasks.map(t => t.id);

  const whereClause = {
    [Op.or]: [
      { predecessorTaskId: { [Op.in]: taskIds } },
      { successorTaskId: { [Op.in]: taskIds } }
    ]
  };

  if (!includeInactive) {
    whereClause.isActive = true;
  }

  const dependencies = await TaskDependency.findAll({
    where: whereClause,
    include: [
      {
        model: Task,
        as: 'predecessorTask',
        attributes: ['id', 'title', 'status', 'startDate', 'dueDate'],
        include: [{
          model: TaskList,
          as: 'list',
          attributes: ['id', 'name'],
          include: [{
            model: Board,
            as: 'board',
            attributes: ['id', 'name']
          }]
        }]
      },
      {
        model: Task,
        as: 'successorTask',
        attributes: ['id', 'title', 'status', 'startDate', 'dueDate'],
        include: [{
          model: TaskList,
          as: 'list',
          attributes: ['id', 'name'],
          include: [{
            model: Board,
            as: 'board',
            attributes: ['id', 'name']
          }]
        }]
      }
    ],
    order: [['created_at', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: dependencies,
    count: dependencies.length
  });
});

// Validate dependencies for a task
exports.validateTaskDependencies = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { newStatus } = req.body;

  const task = await Task.findByPk(taskId);
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Get all active dependencies where this task is involved
  const dependencies = await TaskDependency.findAll({
    where: {
      [Op.or]: [
        { predecessorTaskId: taskId },
        { successorTaskId: taskId }
      ],
      isActive: true
    },
    include: [
      { model: Task, as: 'predecessorTask' },
      { model: Task, as: 'successorTask' }
    ]
  });

  const violations = [];
  const warnings = [];

  for (const dep of dependencies) {
    const canProceed = await dep.canProceed(
      dep.predecessorTask.status,
      dep.successorTask.status
    );

    if (!canProceed) {
      if (dep.successorTaskId === taskId && newStatus === 'in_progress') {
        violations.push({
          dependency: dep,
          message: `Cannot start this task. ${dep.predecessorTask.title} must be ${dep.dependencyType === 'FS' ? 'completed' : 'started'} first.`
        });
      }
    }

    // Check for warnings (e.g., deadline conflicts)
    if (dep.predecessorTask.dueDate && dep.successorTask.startDate) {
      const lagTimeMs = dep.lagTime * 60 * 60 * 1000; // Convert hours to milliseconds
      const expectedStart = new Date(dep.predecessorTask.dueDate.getTime() + lagTimeMs);
      
      if (expectedStart > dep.successorTask.startDate) {
        warnings.push({
          dependency: dep,
          message: `Warning: Based on dependency lag time, this task should start after ${expectedStart.toISOString()}`
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    valid: violations.length === 0,
    violations,
    warnings
  });
});

// Check for circular dependencies
exports.checkCircularDependency = catchAsync(async (req, res, next) => {
  const { predecessorTaskId, successorTaskId, dependencyType } = req.body;

  try {
    const hasCircular = await TaskDependency.hasCircularDependency(
      predecessorTaskId,
      successorTaskId
    );

    res.status(200).json({
      success: true,
      hasCircular,
      message: hasCircular ? 'Circular dependency detected' : 'No circular dependency'
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      hasCircular: false,
      error: error.message
    });
  }
});

// Get dependency chain for a task
exports.getDependencyChain = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { direction = 'forward' } = req.query;

  const chain = await TaskDependency.getDependencyChain(taskId, direction);

  res.status(200).json({
    success: true,
    data: chain,
    count: chain.length,
    direction
  });
});

// Helper function to get users to notify
exports.getUsersToNotify = async (predecessorTask, successorTask) => {
  const userIds = new Set();

  // Add task assignees if they exist
  if (predecessorTask.createdBy) userIds.add(predecessorTask.createdBy);
  if (successorTask.createdBy) userIds.add(successorTask.createdBy);

  // Add assigned users if the field exists
  if (predecessorTask.assignedTo && Array.isArray(predecessorTask.assignedTo)) {
    predecessorTask.assignedTo.forEach(userId => userIds.add(userId));
  }
  if (successorTask.assignedTo && Array.isArray(successorTask.assignedTo)) {
    successorTask.assignedTo.forEach(userId => userIds.add(userId));
  }

  // TODO: Add watchers and board members

  return Array.from(userIds);
};

module.exports = exports;
