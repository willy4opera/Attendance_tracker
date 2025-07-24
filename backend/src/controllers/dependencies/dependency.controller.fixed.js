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
      const usersToNotify = await this.getUsersToNotify(
        notificationData.predecessorTask,
        notificationData.successorTask
      );
      
      if (usersToNotify.length > 0) {
        await DependencyNotification.createNotification({
          dependency: createdDependency,
          type: 'dependency_created',
          recipients: usersToNotify,
          channels: ['inApp', 'email'],
          priority: 'normal'
        });
        logger.info(`Notifications created for dependency ${createdDependency.id}`);
      }
    } catch (notificationError) {
      // Log error but don't fail the whole operation
      logger.error('Failed to create notification:', notificationError);
    }
  }

  // Clear cache
  await redisHelpers.del(`dependencies:${createdDependency.successorTaskId}`);
  await redisHelpers.del(`dependencies:${createdDependency.predecessorTaskId}`);

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
