// Add this at the top of comment.controller.js
const originalController = require('./comment.controller');

// Wrap createComment to add debugging
const wrappedController = {
  ...originalController,
  createComment: async (req, res) => {
    console.log('\n=== DEBUG: createComment ===');
    console.log('Headers:', Object.keys(req.headers));
    console.log('Body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'none');
    console.log('Content-Type:', req.get('content-type'));
    console.log('========================\n');
    
    return originalController.createComment(req, res);
  }
};

module.exports = wrappedController;
