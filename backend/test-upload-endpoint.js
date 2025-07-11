const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());

// Simple multer setup
const upload = multer({ 
  dest: 'uploads/test/',
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Test endpoint
app.post('/test', upload.single('image'), (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file);
  res.json({
    message: 'Received',
    body: req.body,
    file: req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    } : null
  });
});

const PORT = 5555;
app.listen(PORT, () => {
  console.log(`Test server on port ${PORT}`);
});
