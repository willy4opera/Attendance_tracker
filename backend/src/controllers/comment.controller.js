const { TaskComment, CommentLike, User, Task } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const mediaService = require('../services/mediaService');
const multer = require('multer');
const path = require('path');

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 128 * 1024 * 1024 // 128MB max (for videos)
  }
});

class CommentController {
  // Create a comment with media attachments
  async createComment(req, res) {
    console.log("DEBUG - createComment called");
    console.log("DEBUG - req.files:", req.files);
    console.log("DEBUG - req.file:", req.file);
    console.log("DEBUG - Content-Type:", req.get("content-type"));
    try {
      const { taskId, content, parentId, mentions, videoPrivacy } = req.body;

      if (!taskId || !content) {
        return res.status(400).json({
          success: false,
          message: 'Task ID and content are required'
        });
      }

      // Process attachments
      const attachments = [];
      
      // Handle image uploads (to Cloudinary)
      if (req.files && req.files.images) {
        for (const imageFile of req.files.images) {
          try {
            mediaService.validateFile(imageFile, 'image');
            const imageAttachment = await mediaService.uploadImage(imageFile);
            attachments.push(imageAttachment);
          } catch (error) {
            logger.error('Image upload error:', error);
            // Continue with other attachments
          }
        }
      }

      // Handle video uploads (to YouTube)
      if (req.files && req.files.videos) {
        for (const videoFile of req.files.videos) {
          try {
            mediaService.validateFile(videoFile, 'video');
            const videoAttachment = await mediaService.uploadVideo(videoFile, {
              title: `Comment on Task #${taskId}`,
              description: content.substring(0, 100),
              privacyStatus: videoPrivacy || 'unlisted'
            });
            attachments.push(videoAttachment);
          } catch (error) {
            logger.error('Video upload error:', error);
            // Continue with other attachments
          }
        }
      }

      // Create comment with attachments
      const comment = await TaskComment.create({
        taskId,
        userId: req.user.id,
        content,
        parentId: parentId || null,
        mentions: mentions || [],
        attachments: attachments
      });

      const fullComment = await TaskComment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: TaskComment,
            as: 'replies',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
              }
            ]
          }
        ]
      });

      // Update task comment count
      await Task.increment('commentCount', { where: { id: taskId } });

      logger.info(`Comment created on task ${taskId} by user ${req.user.id} with ${attachments.length} attachments`);

      // Emit socket event for real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`task:${taskId}`).emit('comment_added', {
          taskId,
          comment: fullComment,
          userId: req.user.id
        });
        console.log('Emitted comment_added event for task:', taskId);
      }

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: fullComment
      });
    } catch (error) {
      logger.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating comment',
        error: error.message
      });
    }
  }

  // Get comments for a task
  async getTaskComments(req, res) {
    try {
      const { taskId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const comments = await TaskComment.findAndCountAll({
        where: { 
          taskId,
          parentId: null // Only get top-level comments
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          },
          {
            model: TaskComment,
            as: 'replies',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
              }
            ]
          },
          {
            model: CommentLike,
            as: 'likes',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        distinct: true
      });

      // Calculate reaction summary for each comment
      const commentsWithReactions = comments.rows.map(comment => {
        const commentData = comment.toJSON();
        
        // Calculate reaction summary
        const reactionSummary = {};
        if (commentData.likes && commentData.likes.length > 0) {
          commentData.likes.forEach(like => {
            reactionSummary[like.reactionType] = (reactionSummary[like.reactionType] || 0) + 1;
          });
        }
        
        commentData.reactionSummary = reactionSummary;
        return commentData;
      });

      res.status(200).json({
        success: true,
        data: commentsWithReactions,
        pagination: {
          total: comments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(comments.count / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  }

  // Update a comment
  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const comment = await TaskComment.findByPk(id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if the user is the comment owner
      if (comment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to update this comment'
        });
      }

      comment.content = content;
      comment.isEdited = true;
      comment.editedAt = new Date();
      await comment.save();

      const updatedComment = await TaskComment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: updatedComment
      });
    } catch (error) {
      logger.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating comment',
        error: error.message
      });
    }
  }

  // Delete a comment
  async deleteComment(req, res) {
    try {
      const { id } = req.params;

      const comment = await TaskComment.findByPk(id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if the user is the comment owner
      if (comment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to delete this comment'
        });
      }

      // Delete media attachments
      if (comment.attachments && comment.attachments.length > 0) {
        await mediaService.deleteAttachments(comment.attachments);
      }

      // Delete the comment
      await comment.destroy();

      // Update task comment count
      await Task.decrement('commentCount', { where: { id: comment.taskId } });

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting comment',
        error: error.message
      });
    }
  }

  // Toggle like/reaction on a comment
  async toggleCommentLike(req, res) {
    try {
      const { id } = req.params;
      const { reactionType = 'like' } = req.body;

      const comment = await TaskComment.findByPk(id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if the user has already liked this comment
      const existingLike = await CommentLike.findOne({
        where: {
          commentId: id,
          userId: req.user.id
        }
      });

      let liked = false;

      if (existingLike) {
        if (existingLike.reactionType === reactionType) {
          // Remove the like
          await existingLike.destroy();
          await comment.decrement('likeCount');
        } else {
          // Update the reaction type
          existingLike.reactionType = reactionType;
          await existingLike.save();
          liked = true;
        }
      } else {
        // Create a new like
        await CommentLike.create({
          commentId: id,
          userId: req.user.id,
          reactionType
        });
        await comment.increment('likeCount');
        liked = true;
      }

      // Get updated reaction summary
      const likes = await CommentLike.findAll({
        where: { commentId: id }
      });

      const reactionSummary = {};
      likes.forEach(like => {
        reactionSummary[like.reactionType] = (reactionSummary[like.reactionType] || 0) + 1;
      });

      // Update comment's reaction summary
      comment.reactionSummary = reactionSummary;
      await comment.save();

      // Emit socket event for real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`task:${comment.taskId}`).emit('comment_liked', {
          commentId: id,
          taskId: comment.taskId,
          userId: req.user.id,
          liked,
          likeCount: comment.likeCount,
          reactionSummary
        });
        console.log('Emitted comment_liked event for task:', comment.taskId);
      }

      res.status(200).json({
        success: true,
        data: {
          liked,
          likeCount: comment.likeCount,
          reactionSummary
        }
      });
    } catch (error) {
      logger.error('Error toggling comment like:', error);
      res.status(500).json({
        success: false,
        message: 'Error toggling comment like',
        error: error.message
      });
    }
  }

  // Share a comment
  async shareComment(req, res) {
    try {
      const { commentId, recipients, message } = req.body;

      // Here you would implement the logic to share the comment
      // For example, sending emails or creating notifications

      res.status(200).json({
        success: true,
        message: 'Comment shared successfully'
      });
    } catch (error) {
      logger.error('Error sharing comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error sharing comment',
        error: error.message
      });
    }
  }

  // Generate shareable link
  generateShareableLink(commentId, taskId) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/tasks/${taskId}?comment=${commentId}`;
  }
}

module.exports = new CommentController();
