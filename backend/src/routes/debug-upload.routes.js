const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/debug/' });

router.use(protect);

router.post('/debug', upload.any(), (req, res) => {
  console.log('\n=== DEBUG UPLOAD ===');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  console.log('File (single):', req.file);
  console.log('Headers:', req.headers);
  console.log('==================\n');
  
  res.json({
    body: req.body,
    files: req.files,
    file: req.file
  });
});

module.exports = router;
