const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { generateToken } = require('../../utils/tokenUtils');
const fs = require('fs');
const path = require('path');

// OAuth debug logging
const logFile = path.join(__dirname, '..', '..', '..', 'oauth-debug.log');

function oauthLog(message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
  
  // Write to file
  fs.appendFileSync(logFile, logEntry);
  
  // Also console log
  console.log(message, data || '');
}

// Initialize Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// In-memory store for processed OAuth codes to prevent reuse
const processedCodes = new Map(); // Changed to Map to store timestamps

// Clean up old codes every 30 seconds (more aggressive)
setInterval(() => {
  const now = Date.now();
  for (const [code, timestamp] of processedCodes.entries()) {
    // Remove codes older than 60 seconds
    if (now - timestamp > 60000) {
      processedCodes.delete(code);
      oauthLog('🧹 Cleaned up old OAuth code');
    }
  }
}, 30000);

/**
 * Google OAuth login/signup - handles both ID token and authorization code
 */
const googleAuth = async (req, res) => {
  oauthLog('🔐 Google OAuth Request received:', {
    hasToken: !!req.body.token,
    hasCode: !!req.body.code,
    codePrefix: req.body.code ? req.body.code.substring(0, 20) + '...' : null,
    timestamp: new Date().toISOString()
  });
  
  try {
    let { token, code } = req.body;
    
    // Decode the authorization code if it's URL encoded
    if (code) {
      const decodedCode = decodeURIComponent(code);
      oauthLog('🔍 Code comparison:', {
        original: code.substring(0, 30) + '...',
        decoded: decodedCode.substring(0, 30) + '...',
        needsDecoding: code !== decodedCode
      });
      code = decodedCode;
    }

    // Backend deduplication: Check if this code has already been processed
    if (code && processedCodes.has(code)) {
      oauthLog('⚠️ OAuth code already processed on backend, rejecting duplicate request');
      const ageMs = Date.now() - processedCodes.get(code);
      oauthLog(`   Code age: ${ageMs}ms`);
      return res.status(400).json({
        success: false,
        message: 'The authorization code has already been used. Please try signing in again.',
        error: 'duplicate_code'
      });
    }

    // Mark code as being processed with timestamp
    if (code) {
      processedCodes.set(code, Date.now());
      oauthLog('🔒 OAuth code marked as processed on backend');
      oauthLog(`   Total codes in memory: ${processedCodes.size}`);
    }

    let payload;

    if (token) {
      // Handle ID token from Google Sign-In button
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else if (code) {
      // Handle authorization code from OAuth flow
      oauthLog('🔄 Exchanging code for tokens with Google...');
      oauthLog('📊 OAuth Client Configuration:', {
        clientId: process.env.GOOGLE_CLIENT_ID,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
      });
      
      let tokens;
      try {
        const tokenResponse = await client.getToken(code);
        tokens = tokenResponse.tokens;
        oauthLog('✅ Successfully got tokens from Google');
        oauthLog('🎫 Token details:', {
          hasIdToken: !!tokens.id_token,
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expiry_date
        });
        client.setCredentials(tokens);
      } catch (tokenError) {
        oauthLog('❌ Token exchange failed: ' + tokenError.message);
        oauthLog('📝 Full error details:', tokenError.response?.data || tokenError);
        throw tokenError;
      }

      // Verify the ID token from the response
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google token or authorization code is required'
      });
    }

    const { email, name, given_name, family_name, picture, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        firstName: given_name || name.split(' ')[0],
        lastName: family_name || name.split(' ').slice(1).join(' '),
        profilePicture: picture,
        googleId,
        isEmailVerified: true,
        provider: 'google',
        password: null // No password for social login
      });
    } else {
      // Update existing user with Google info if not already linked
      if (!user.googleId) {
        await user.update({
          googleId,
          profilePicture: user.profilePicture || picture,
          isEmailVerified: true
        });
      }
    }

    // Generate JWT token
    const authToken = generateToken(user);
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    oauthLog('✅ Google OAuth successful for user: ' + user.email);
    
    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token: authToken,
      refreshToken,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          role: user.role
        }
      }
    });
  } catch (error) {
    oauthLog('❌ Google auth error: ' + error.message);
    oauthLog('📝 Full error stack:', error.stack);
    
    // Clean up the processed code on error so it can be retried
    if (req.body.code) {
      processedCodes.delete(req.body.code);
      oauthLog('🗑️ Removed failed OAuth code from processed set');
    }
    
    // Handle specific Google OAuth errors
    let errorMessage = 'Google authentication failed';
    let statusCode = 500;
    
    if (error.message && error.message.includes('invalid_grant')) {
      errorMessage = 'The authorization code has expired or was already used. Please try signing in again.';
      statusCode = 400;
    } else if (error.message && error.message.includes('invalid_client')) {
      errorMessage = 'Google OAuth configuration error. Please contact support.';
      statusCode = 500;
    } else if (error.message && error.message.includes('redirect_uri_mismatch')) {
      errorMessage = 'OAuth redirect URI mismatch. Please contact support.';
      statusCode = 500;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * Handle Google OAuth callback
 */
const handleGoogleAuth = async (code) => {
  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, given_name, family_name, picture, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        firstName: given_name || name.split(' ')[0],
        lastName: family_name || name.split(' ').slice(1).join(' '),
        profilePicture: picture,
        googleId,
        isEmailVerified: true,
        provider: 'google',
        password: null
      });
    } else {
      // Update existing user
      if (!user.googleId) {
        await user.update({
          googleId,
          profilePicture: user.profilePicture || picture,
          isEmailVerified: true
        });
      }
    }

    // Generate tokens
    const authToken = generateToken(user);
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    return {
      token: authToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        role: user.role
      }
    };
  } catch (error) {
    oauthLog('❌ Google auth callback error: ' + error.message);
    throw error;
  }
};

/**
 * Clear processed OAuth codes (for debugging)
 */
const clearProcessedCodes = (req, res) => {
  const size = processedCodes.size;
  processedCodes.clear();
  oauthLog(`🧹 Manually cleared ${size} OAuth codes from memory`);
  res.status(200).json({
    success: true,
    message: `Cleared ${size} OAuth codes from memory`
  });
};

/**
 * Get Google OAuth URL
 */
const getGoogleAuthUrl = (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  // Get state parameter from query if provided by frontend
  const state = req.query.state;

  const authUrlParams = {
    access_type: 'offline',
    prompt: 'consent', // Force fresh authorization code every time
    scope: scopes,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  };

  // Add state parameter if provided
  if (state) {
    authUrlParams.state = state;
  }

  const authUrl = client.generateAuthUrl(authUrlParams);

  res.status(200).json({
    success: true,
    data: { url: authUrl }
  });
};

module.exports = {
  googleAuth,
  getGoogleAuthUrl,
  handleGoogleAuth,
  clearProcessedCodes
};
