const express = require('express');
const router = express.Router();

// Test endpoint to verify API proxy setup
router.get('/hello', (req, res) => {
  res.json({
    status: 'success',
    message: 'Hello from backend API!',
    timestamp: new Date().toISOString(),
    requestInfo: {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.get('User-Agent'),
        'host': req.get('Host'),
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-forwarded-proto': req.get('X-Forwarded-Proto')
      }
    }
  });
});

// Another test endpoint with parameters
router.get('/echo/:message', (req, res) => {
  const { message } = req.params;
  const { format } = req.query;
  
  res.json({
    status: 'success',
    echo: message,
    format: format || 'json',
    timestamp: new Date().toISOString(),
    clientInfo: {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
});

// POST endpoint test
router.post('/data', (req, res) => {
  res.json({
    status: 'success',
    message: 'Data received successfully',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
