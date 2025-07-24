const { Task, TaskCompletionLog, User, TaskComment } = require('../models');
const logger = require('../utils/logger');

// Log task completion - Now changes status to 'under-review' for regular users
exports.logCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Determine the new status based on user role
    const newStatus = isAdmin ? 'done' : 'under-review';
    const completionDate = isAdmin ? new Date() : null;
    const action = isAdmin ? 'completed' : 'submitted-for-review';

    // Create completion log
    const log = await TaskCompletionLog.create({
      taskId,
      userId,
      action: action,
      completedAt: completionDate,
      metadata: {
        previousStatus: task.status,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        userRole: req.user.role
      }
    });

    // Update task
    await task.update({
      status: newStatus,
      completedAt: completionDate,
      submittedForReviewAt: !isAdmin ? new Date() : task.submittedForReviewAt
    });

    // Create automatic comment
    const commentContent = isAdmin 
      ? `✅ Task marked as completed on ${new Date().toLocaleDateString()}`
      : `📝 Task submitted for review on ${new Date().toLocaleDateString()}`;
    
    const comment = await TaskComment.create({
      taskId,
      userId,
      content: commentContent,
      isSystemGenerated: true
    });

    logger.info(`Task ${taskId} ${isAdmin ? 'completed' : 'submitted for review'} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: isAdmin ? 'Task marked as completed' : 'Task submitted for review',
      data: {
        log,
        task: await Task.findByPk(taskId)
      }
    });
  } catch (error) {
    logger.error('Error in logCompletion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message
    });
  }
};

// Admin approves task completion
exports.approveCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if user is admin/moderator
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can approve task completion'
      });
    }

    // Verify task exists and is under review
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.status !== 'under-review') {
      return res.status(400).json({
        success: false,
        message: 'Task is not under review'
      });
    }

    // Create completion log
    const log = await TaskCompletionLog.create({
      taskId,
      userId,
      action: 'completed',
      completedAt: new Date(),
      metadata: {
        previousStatus: task.status,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        approvedBy: userId,
        submittedForReviewAt: task.submittedForReviewAt
      }
    });

    // Update task
    await task.update({
      status: 'done',
      completedAt: new Date(),
      approvedBy: userId,
      approvedAt: new Date()
    });

    // Create automatic comment
    const comment = await TaskComment.create({
      taskId,
      userId,
      content: `✅ Task completion approved by admin on ${new Date().toLocaleDateString()}`,
      isSystemGenerated: true
    });

    logger.info(`Task ${taskId} completion approved by admin ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Task completion approved',
      data: {
        log,
        task: await Task.findByPk(taskId)
      }
    });
  } catch (error) {
    logger.error('Error in approveCompletion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve task completion',
      error: error.message
    });
  }
};

// Log task uncompletion (admin only)
exports.logUncompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Check if user is admin/moderator
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can mark tasks as uncompleted'
      });
    }

    // Validate reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for marking task as uncompleted'
      });
    }

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Store previous completion date if exists
    const previousCompletedAt = task.completedAt;

    // Create uncompletion log
    const log = await TaskCompletionLog.create({
      taskId,
      userId,
      action: 'uncompleted',
      reason,
      uncompletedAt: new Date(),
      metadata: {
        previousStatus: task.status,
        previousCompletedAt,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    });

    // Update task
    await task.update({
      status: 'in-progress',
      completedAt: null,
      approvedBy: null,
      approvedAt: null,
      submittedForReviewAt: null
    });

    // Create automatic comment
    const comment = await TaskComment.create({
      taskId,
      userId,
      content: `❌ Task marked as uncompleted by admin\n\nReason: ${reason}`,
      isSystemGenerated: true
    });

    logger.info(`Task ${taskId} marked as uncompleted by admin ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Task marked as uncompleted',
      data: {
        log,
        task: await Task.findByPk(taskId)
      }
    });
  } catch (error) {
    logger.error('Error in logUncompletion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark task as uncompleted',
      error: error.message
    });
  }
};

// Reject task completion (admin only) - sends it back to in-progress
exports.rejectCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Check if user is admin/moderator
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can reject task completion'
      });
    }

    // Validate reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for rejecting task completion'
      });
    }

    // Verify task exists and is under review
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.status !== 'under-review') {
      return res.status(400).json({
        success: false,
        message: 'Task is not under review'
      });
    }

    // Create rejection log
    const log = await TaskCompletionLog.create({
      taskId,
      userId,
      action: 'rejected',
      reason,
      metadata: {
        previousStatus: task.status,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        rejectedBy: userId,
        submittedForReviewAt: task.submittedForReviewAt
      }
    });

    // Update task
    await task.update({
      status: 'in-progress',
      submittedForReviewAt: null
    });

    // Create automatic comment
    const comment = await TaskComment.create({
      taskId,
      userId,
      content: `⚠️ Task completion rejected by admin\n\nReason: ${reason}`,
      isSystemGenerated: true
    });

    logger.info(`Task ${taskId} completion rejected by admin ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Task completion rejected',
      data: {
        log,
        task: await Task.findByPk(taskId)
      }
    });
  } catch (error) {
    logger.error('Error in rejectCompletion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject task completion',
      error: error.message
    });
  }
};

// Get task completion history
exports.getTaskCompletionHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get completion logs with user info
    const { count, rows: logs } = await TaskCompletionLog.findAndCountAll({
      where: { taskId },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error in getTaskCompletionHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task completion history',
      error: error.message
    });
  }
};

// Get user completion statistics
exports.getUserCompletionStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Get completion counts
    const completedCount = await TaskCompletionLog.count({
      where: { 
        userId, 
        action: 'completed' 
      }
    });

    const uncompletedCount = await TaskCompletionLog.count({
      where: { 
        userId, 
        action: 'uncompleted' 
      }
    });

    const submittedForReviewCount = await TaskCompletionLog.count({
      where: { 
        userId, 
        action: 'submitted-for-review' 
      }
    });

    // Get recent completions
    const recentCompletions = await TaskCompletionLog.findAll({
      where: { 
        userId,
        action: ['completed', 'submitted-for-review']
      },
      include: [{
        model: Task,
        attributes: ['id', 'title', 'status']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCompleted: completedCount,
          totalUncompleted: uncompletedCount,
          totalSubmittedForReview: submittedForReviewCount
        },
        recentCompletions
      }
    });
  } catch (error) {
    logger.error('Error in getUserCompletionStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user completion statistics',
      error: error.message
    });
  }
};
