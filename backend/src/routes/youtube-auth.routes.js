const express = require('express');
const router = express.Router();
const youtubeService = require('../services/youtubeService');

/**
 * Initiate YouTube OAuth flow - PUBLIC ROUTE
 */
router.get('/youtube', (req, res) => {
  const authUrl = youtubeService.getAuthUrl();
  res.redirect(authUrl);
});

/**
 * Handle YouTube OAuth callback - PUBLIC ROUTE
 */
router.get('/youtube/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.status(400).send(`
      <html>
        <body>
          <h2>Authentication Failed</h2>
          <p>Error: ${error}</p>
          <p><a href="/api/v1/auth/youtube">Try again</a></p>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    return res.status(400).send(`
      <html>
        <body>
          <h2>Authentication Failed</h2>
          <p>No authorization code received</p>
          <p><a href="/api/v1/auth/youtube">Try again</a></p>
        </body>
      </html>
    `);
  }
  
  try {
    const tokens = await youtubeService.getTokensFromCode(code);
    
    res.send(`
      <html>
        <body>
          <h2>YouTube Authentication Successful!</h2>
          <p>The application is now authorized to upload videos to YouTube.</p>
          <p>You can close this window and return to the application.</p>
          <script>
            // If opened in a popup, close it
            if (window.opener) {
              window.opener.postMessage({ type: 'youtube-auth-success' }, '*');
              window.close();
            }
            // Redirect after 3 seconds
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send(`
      <html>
        <body>
          <h2>Authentication Failed</h2>
          <p>Error: ${error.message}</p>
          <p><a href="/api/v1/auth/youtube">Try again</a></p>
        </body>
      </html>
    `);
  }
});

module.exports = router;
