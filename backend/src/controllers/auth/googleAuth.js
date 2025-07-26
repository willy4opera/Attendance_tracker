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

// Function to determine the correct redirect URI based on environment
function getRedirectUri() {
  const envRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const nodeEnv = process.env.NODE_ENV;
  const frontendUrl = process.env.FRONTEND_URL;
  
  oauthLog('Determining redirect URI:', {
    nodeEnv,
    envRedirectUri,
    frontendUrl
  });
  
  // If NODE_ENV is development or the redirect URI contains localhost, use it as-is
  if (nodeEnv === 'development' || (envRedirectUri && envRedirectUri.includes('localhost'))) {
    oauthLog('Using development/localhost redirect URI:', envRedirectUri);
    return envRedirectUri;
  }
  
  // For production, respect the GOOGLE_REDIRECT_URI if set
  if (nodeEnv === 'production' && envRedirectUri) {
    oauthLog('Using production redirect URI from env:', envRedirectUri);
    return envRedirectUri;
  }
  
  // Fallback to frontend URL + /login if GOOGLE_REDIRECT_URI not set
  if (nodeEnv === 'production' && frontendUrl && !envRedirectUri) {
    const productionUri = `${frontendUrl}/login`;
    oauthLog('Using production redirect URI (fallback):', productionUri);
    return productionUri;
  }
  
  // Final fallback to env variable
  oauthLog('Using fallback redirect URI:', envRedirectUri);
  return envRedirectUri;
}

// Initialize Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri()
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
    headers: req.headers,
    body: req.body
  });

  try {
    let { token, code } = req.body;
    
    if (!token && !code) {
      oauthLog('❌ Missing both token and code');
      return res.status(400).json({
        success: false,
        message: 'Either Google ID token or authorization code is required'
      });
    }

    let payload;
    
    if (token) {
      // Handle ID token from Google Sign-In
      oauthLog('🔍 Verifying Google ID token...');
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
        oauthLog('✅ ID token verified successfully');
      } catch (error) {
        oauthLog('❌ ID token verification failed: ' + error.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid Google token'
        });
      }
    } else if (code) {
      // Decode the authorization code if it's URL encoded
      const decodedCode = decodeURIComponent(code);
      
      oauthLog('🔍 Code processing:', {
        original: code,
        decoded: decodedCode,
        needsDecoding: code !== decodedCode
      });
      
      // Use the decoded code
      code = decodedCode;
      
      // Handle authorization code from OAuth flow
      oauthLog('🔄 Exchanging code for tokens with Google...');
      oauthLog('📊 OAuth Client Configuration:', {
        clientId: process.env.GOOGLE_CLIENT_ID,
        redirectUri: getRedirectUri(),
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
      });
      
      let tokens;
      try {
        // Update client redirect URI for this request
        client._redirectUri = getRedirectUri();
        
        const { tokens: googleTokens } = await client.getToken(code);
        tokens = googleTokens;
        oauthLog('✅ Successfully exchanged code for tokens');
      } catch (error) {
        oauthLog('❌ Token exchange failed: ' + error.message);
        oauthLog('📝 Full error details:', error.response?.data || error);
        
        // Log the full error stack for debugging
        oauthLog('📝 Full error stack:', error.stack);
        
        // Check if this code was already used
        if (processedCodes.has(code)) {
          oauthLog('⚠️ Duplicate code detected - already processed');
          return res.status(400).json({
            success: false,
            message: 'This authorization code has already been used',
            error: 'duplicate_code'
          });
        }
        
        // Specific error handling
        if (error.message && error.message.includes('invalid_grant')) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired authorization code'
          });
        }
        
        if (error.message && error.message.includes('redirect_uri_mismatch')) {
          oauthLog('❌ Redirect URI mismatch detected');
          return res.status(400).json({
            success: false,
            message: 'OAuth redirect URI mismatch. Please contact support.'
          });
        }
        
        return res.status(400).json({
          success: false,
          message: 'Failed to exchange authorization code'
        });
      }
      
      // Mark this code as processed
      processedCodes.set(code, Date.now());
      oauthLog('📝 Added code to processed set. Total processed codes:', processedCodes.size);
      
      // Get user info using the access token
      oauthLog('🔍 Fetching user info from Google...');
      try {
        client.setCredentials(tokens);
        const userInfoResponse = await client.request({
          url: 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        payload = userInfoResponse.data;
        oauthLog('✅ User info retrieved successfully:', {
          email: payload.email,
          name: payload.name
        });
      } catch (error) {
        oauthLog('❌ Failed to get user info: ' + error.message);
        // Remove the code from processed set since it failed
        processedCodes.delete(code);
        oauthLog('🗑️ Removed failed OAuth code from processed set');
        return res.status(400).json({
          success: false,
          message: 'Failed to get user information from Google'
        });
      }
    }

    // Extract user information
    const { email, name, given_name, family_name, picture, sub: googleId } = payload;
    
    oauthLog('👤 Processing user data:', { email, name, googleId });

    // Check if user exists
    let user = await User.findOne({ where: { email } });
    
    if (user) {
      oauthLog('✅ Existing user found');
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
        oauthLog('✅ Updated user with Google ID');
      }
    } else {
      oauthLog('🆕 Creating new user...');
      // Create new user
      user = await User.create({
        email,
        firstName: given_name || name?.split(' ')[0] || '',
        lastName: family_name || name?.split(' ').slice(1).join(' ') || '',
        profileImage: picture,
        googleId,
        isEmailVerified: true, // Google accounts are pre-verified
        role: 'user'
      });
      oauthLog('✅ New user created successfully');
    }

    // Generate tokens
    const authToken = generateToken(user);
    
    // Get the refresh token expiry from env or use default
    const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || 
                              process.env.REFRESH_TOKEN_EXPIRES_IN || 
                              '7d';
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshTokenExpiry }
    );

    oauthLog('✅ Google auth successful for user:', user.email);

    // Return success response
    res.status(200).json({
      success: true,
      token: authToken,
      refreshToken,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });

  } catch (error) {
    oauthLog('❌ Google auth error:', error);
    console.error('Google auth error:', error);
    
    // Remove the code from processed set on error
    if (req.body.code) {
      processedCodes.delete(req.body.code);
      oauthLog('🗑️ Removed failed OAuth code from processed set');
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Handle Google OAuth callback
 */
const handleGoogleAuth = async (req, res) => {
  oauthLog('🌐 Google OAuth callback received');
  
  try {
    const { code, error } = req.query;
    
    if (error) {
      oauthLog('❌ Google auth callback error: ' + error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
    }
    
    if (!code) {
      oauthLog('❌ No authorization code in callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }
    
    oauthLog('🔄 Processing callback with code...');
    
    // Exchange code for tokens
    const authResult = await googleAuth({ body: { code } }, {
      status: () => ({ json: (data) => data }),
      json: (data) => data
    });
    
    if (authResult.success) {
      oauthLog('✅ Callback processed successfully');
      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?token=${authResult.token}&refreshToken=${authResult.refreshToken}`;
      return res.redirect(redirectUrl);
    } else {
      oauthLog('❌ Callback processing failed');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
    
  } catch (error) {
    oauthLog('❌ Google auth callback error: ' + error.message);
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * Clear processed codes (admin endpoint)
 */
const clearProcessedCodes = (req, res) => {
  const oldSize = processedCodes.size;
  processedCodes.clear();
  oauthLog(`🧹 Manually cleared ${oldSize} processed OAuth codes`);
  
  res.status(200).json({
    success: true,
    message: `Cleared ${oldSize} processed codes`
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
    redirect_uri: getRedirectUri()
  };

  // Add state parameter if provided
  if (state) {
    authUrlParams.state = state;
  }

  // Update client redirect URI for URL generation
  client._redirectUri = getRedirectUri();
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
