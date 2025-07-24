const express = require('express');
const router = express.Router();
const taskCompletionLogController = require('../controllers/taskCompletionLog.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Log task completion (changes to under-review for regular users, done for admins)
router.post('/tasks/:taskId/complete', 
  taskCompletionLogController.logCompletion
);

// Approve task completion (admin only)
router.post('/tasks/:taskId/approve-completion', 
  taskCompletionLogController.approveCompletion
);

// Reject task completion (admin only)
router.post('/tasks/:taskId/reject-completion', 
  taskCompletionLogController.rejectCompletion
);

// Log task uncompletion (admin only)
router.post('/tasks/:taskId/uncomplete', 
  taskCompletionLogController.logUncompletion
);

// Get task completion history
router.get('/tasks/:taskId/completion-history', 
  taskCompletionLogController.getTaskCompletionHistory
);

// Get user completion statistics
router.get('/users/:userId/completion-stats', 
  taskCompletionLogController.getUserCompletionStats
);

// Get current user's completion statistics
router.get('/my-completion-stats', 
  taskCompletionLogController.getUserCompletionStats
);

module.exports = router;
