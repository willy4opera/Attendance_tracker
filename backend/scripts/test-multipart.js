#!/usr/bin/env node

/**
 * Test multipart form data parsing
 */

const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/test/' });

app.post('/test-upload', upload.single('image'), (req, res) => {
  console.log('Body:', req.body);
  console.log('File:', req.file);
  res.json({ body: req.body, file: req.file });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Test upload
  setTimeout(async () => {
    const FormData = require('form-data');
    const axios = require('axios');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('taskId', '1');
    form.append('content', 'Test content');
    form.append('image', Buffer.from('test'), 'test.png');
    
    try {
      const response = await axios.post(`http://localhost:${PORT}/test-upload`, form, {
        headers: form.getHeaders()
      });
      console.log('Response:', response.data);
      process.exit(0);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }, 1000);
});
