const path = require('path');
const fs = require('fs').promises;
const { Attachment, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { deleteFile, getFileUrl } = require('../config/multer.config');

// Upload single file
exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const { sessionId, description } = req.body;
  
  // Create attachment record in database
  const attachment = await Attachment.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    url: getFileUrl(req.file.filename, req.file.destination.split('/').pop()),
    uploadedBy: req.user.id,
    sessionId: sessionId || null,
    description: description || null
  });

  res.status(201).json({
    status: 'success',
    data: {
      attachment
    }
  });
});

// Upload multiple files
exports.uploadMultipleFiles = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one file', 400));
  }

  const { sessionId, description } = req.body;
  
  // Create attachment records for all files
  const attachments = await Promise.all(
    req.files.map(file => 
      Attachment.create({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: getFileUrl(file.filename, file.destination.split('/').pop()),
        uploadedBy: req.user.id,
        sessionId: sessionId || null,
        description: description || null
      })
    )
  );

  res.status(201).json({
    status: 'success',
    results: attachments.length,
    data: {
      attachments
    }
  });
});

// Get all attachments
exports.getAllAttachments = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, sessionId, uploadedBy } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (sessionId) where.sessionId = sessionId;
  if (uploadedBy) where.uploadedBy = uploadedBy;

  const { count, rows: attachments } = await Attachment.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [{
      model: User,
      as: 'uploader',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }]
  });

  res.status(200).json({
    status: 'success',
    results: attachments.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      attachments
    }
  });
});

// Get attachment by ID
exports.getAttachment = catchAsync(async (req, res, next) => {
  const attachment = await Attachment.findByPk(req.params.id, {
    include: [{
      model: User,
      as: 'uploader',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }]
  });

  if (!attachment) {
    return next(new AppError('Attachment not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      attachment
    }
  });
});

// Download file
exports.downloadFile = catchAsync(async (req, res, next) => {
  const attachment = await Attachment.findByPk(req.params.id);

  if (!attachment) {
    return next(new AppError('File not found', 404));
  }

  // Check if file exists
  try {
    await fs.access(attachment.path);
  } catch (error) {
    return next(new AppError('File not found on server', 404));
  }

  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
  res.setHeader('Content-Type', attachment.mimeType);

  // Send file
  res.sendFile(attachment.path);
});

// Delete attachment
exports.deleteAttachment = catchAsync(async (req, res, next) => {
  const attachment = await Attachment.findByPk(req.params.id);

  if (!attachment) {
    return next(new AppError('Attachment not found', 404));
  }

  // Check permissions (only uploader or admin can delete)
  if (attachment.uploadedBy !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to delete this file', 403));
  }

  // Delete file from filesystem
  try {
    await deleteFile(attachment.path);
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  // Delete from database
  await attachment.destroy();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Update user avatar
exports.updateAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  const user = await require('../models').User.findByPk(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Delete old avatar if exists
  if (user.profilePicture) {
    const oldAvatarPath = path.join(__dirname, '../../', user.profilePicture);
    try {
      await deleteFile(oldAvatarPath);
    } catch (error) {
      console.error('Error deleting old avatar:', error);
    }
  }

  // Update user profile picture
  user.profilePicture = getFileUrl(req.file.filename, 'avatars');
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      profilePicture: user.profilePicture
    }
  });
});

// Get files by session
exports.getSessionFiles = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: attachments } = await Attachment.findAndCountAll({
    where: { sessionId },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [{
      model: User,
      as: 'uploader',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }]
  });

  res.status(200).json({
    status: 'success',
    results: attachments.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      totalResults: count
    },
    data: {
      attachments
    }
  });
});
