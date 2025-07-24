const logger = require('./logger');

// Socket emitter utility to send events through Socket.IO
exports.emitSocketEvent = (event, data) => {
  try {
    // Get the Socket.IO instance from the app
    const app = require('../app');
    const io = app.get('io');
    
    if (io) {
      // If event starts with 'user_', emit to specific user room
      if (event.startsWith('user_')) {
        const [, userId] = event.split('_');
        io.to(event).emit('notification', data);
      } else {
        // Otherwise emit to all connected clients or specific rooms
        if (data.boardId) {
          io.to(`board_${data.boardId}`).emit(event, data);
        } else if (data.projectId) {
          io.to(`project_${data.projectId}`).emit(event, data);
        } else {
          io.emit(event, data);
        }
      }
      
      logger.debug(`Socket event emitted: ${event}`);
    } else {
      logger.warn('Socket.IO instance not available');
    }
  } catch (error) {
    logger.error('Error emitting socket event:', error);
  }
};

// Emit to specific user
exports.emitToUser = (userId, event, data) => {
  exports.emitSocketEvent(`user_${userId}`, { event, data });
};

// Emit to board members
exports.emitToBoard = (boardId, event, data) => {
  exports.emitSocketEvent(event, { ...data, boardId });
};

// Emit to project members
exports.emitToProject = (projectId, event, data) => {
  exports.emitSocketEvent(event, { ...data, projectId });
};
