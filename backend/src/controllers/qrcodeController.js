const { Session, Attendance, User } = require('../models');
const qrCodeService = require('../services/qrcode.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Generate QR code for a session
exports.generateSessionQR = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  
  // Get session details
  const session = await Session.findByPk(sessionId);
  
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  // Check if user has permission (admin, moderator, or session facilitator)
  if (req.user.role !== 'admin' && 
      req.user.role !== 'moderator' && 
      session.facilitatorId !== req.user.id) {
    return next(new AppError('You do not have permission to generate QR code for this session', 403));
  }

  // Generate QR code
  const qrCode = await qrCodeService.generateSessionQR(session);

  // Store QR code info in session metadata
  await session.update({
    metadata: {
      ...session.metadata,
      qrCode: {
        filename: qrCode.filename,
        url: qrCode.url,
        generatedAt: new Date(),
        generatedBy: req.user.id,
        expiresAt: qrCode.expiresAt
      }
    }
  });

  res.status(200).json({
    status: 'success',
    data: {
      qrCode: {
        url: qrCode.url,
        dataURL: qrCode.dataURL,
        expiresAt: qrCode.expiresAt
      }
    }
  });
});

// Generate personal attendance QR for a user
exports.generateAttendanceQR = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  
  // Verify session exists and is active
  const session = await Session.findByPk(sessionId);
  
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  if (session.status !== 'scheduled' && session.status !== 'active') {
    return next(new AppError('Cannot generate QR code for completed or cancelled sessions', 400));
  }

  // Generate personal QR code
  const qrCode = await qrCodeService.generateAttendanceQR(sessionId, req.user.id);

  // Store temporary token for validation
  req.app.locals.attendanceTokens = req.app.locals.attendanceTokens || new Map();
  req.app.locals.attendanceTokens.set(qrCode.token, {
    sessionId,
    userId: req.user.id,
    expiresAt: qrCode.expiresAt
  });

  res.status(200).json({
    status: 'success',
    data: {
      qrCode: {
        dataURL: qrCode.dataURL,
        expiresAt: qrCode.expiresAt
      }
    }
  });
});

// Scan QR code to mark attendance
exports.scanQRCode = catchAsync(async (req, res, next) => {
  const { qrData } = req.body;

  if (!qrData) {
    return next(new AppError('QR code data is required', 400));
  }

  // Validate QR code
  const validation = qrCodeService.validateQRData(qrData);
  
  if (!validation.valid) {
    return next(new AppError(validation.error, 400));
  }

  const { sessionId } = validation.data;

  // Get session
  const session = await Session.findByPk(sessionId);
  
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  // Check if session is active
  if (session.status !== 'active') {
    return next(new AppError('Session is not active for attendance', 400));
  }

  // Check attendance window
  const now = new Date();
  const sessionStart = new Date(`${session.sessionDate.toISOString().split('T')[0]}T${session.startTime}`);
  const windowStart = new Date(sessionStart.getTime() - (session.attendanceWindow || 15) * 60000);
  const sessionEnd = new Date(`${session.sessionDate.toISOString().split('T')[0]}T${session.endTime}`);

  if (now < windowStart) {
    return next(new AppError('Attendance window has not opened yet', 400));
  }

  if (now > sessionEnd) {
    return next(new AppError('Session has ended', 400));
  }

  // Check if already marked attendance
  const existingAttendance = await Attendance.findOne({
    where: {
      sessionId: session.id,
      userId: req.user.id
    }
  });

  if (existingAttendance) {
    return res.status(200).json({
      status: 'success',
      message: 'Attendance already marked',
      data: {
        attendance: existingAttendance
      }
    });
  }

  // Mark attendance
  const attendance = await Attendance.create({
    sessionId: session.id,
    userId: req.user.id,
    status: 'present',
    checkInTime: now,
    markedVia: 'qr_code',
    metadata: {
      qrScanned: true,
      scanTime: now,
      qrData: validation.data
    }
  });

  res.status(201).json({
    status: 'success',
    message: 'Attendance marked successfully via QR code',
    data: {
      attendance,
      session: {
        id: session.id,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime
      }
    }
  });
});

// Validate attendance token from QR URL
exports.validateAttendanceToken = catchAsync(async (req, res, next) => {
  const { token, sessionId } = req.body;

  if (!token || !sessionId) {
    return next(new AppError('Token and session ID are required', 400));
  }

  // Check token validity
  const attendanceTokens = req.app.locals.attendanceTokens;
  
  if (!attendanceTokens || !attendanceTokens.has(token)) {
    return next(new AppError('Invalid or expired token', 400));
  }

  const tokenData = attendanceTokens.get(token);
  
  // Verify token hasn't expired
  if (new Date() > new Date(tokenData.expiresAt)) {
    attendanceTokens.delete(token);
    return next(new AppError('Token has expired', 400));
  }

  // Verify session matches
  if (tokenData.sessionId !== sessionId) {
    return next(new AppError('Token does not match session', 400));
  }

  // Mark attendance
  const session = await Session.findByPk(sessionId);
  
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  // Create attendance record
  const attendance = await Attendance.create({
    sessionId: session.id,
    userId: tokenData.userId,
    status: 'present',
    checkInTime: new Date(),
    markedVia: 'qr_code',
    metadata: {
      tokenUsed: true,
      validatedAt: new Date()
    }
  });

  // Delete used token
  attendanceTokens.delete(token);

  res.status(201).json({
    status: 'success',
    message: 'Attendance marked successfully',
    data: {
      attendance
    }
  });
});

// Get QR code for a session
exports.getSessionQR = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  
  const session = await Session.findByPk(sessionId);
  
  if (!session) {
    return next(new AppError('Session not found', 404));
  }

  if (!session.metadata?.qrCode) {
    return next(new AppError('No QR code generated for this session', 404));
  }

  // Check if QR code has expired
  if (new Date() > new Date(session.metadata.qrCode.expiresAt)) {
    return next(new AppError('QR code has expired. Please generate a new one.', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      qrCode: {
        url: session.metadata.qrCode.url,
        generatedAt: session.metadata.qrCode.generatedAt,
        expiresAt: session.metadata.qrCode.expiresAt
      }
    }
  });
});

// Cleanup old QR codes (scheduled task)
exports.cleanupQRCodes = catchAsync(async (req, res, next) => {
  // Only allow admin to run cleanup
  if (req.user.role !== 'admin') {
    return next(new AppError('Only administrators can run cleanup', 403));
  }

  await qrCodeService.cleanupOldQRCodes();

  res.status(200).json({
    status: 'success',
    message: 'QR code cleanup completed'
  });
});
