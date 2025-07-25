const { User } = require('../../models');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Use environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Track recently used codes to prevent reuse attacks
const usedCodes = new Map();

// Clean up old codes every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [code, timestamp] of usedCodes.entries()) {
    if (timestamp < fiveMinutesAgo) {
      usedCodes.delete(code);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate Facebook OAuth URL
 */
const getFacebookAuthUrl = (req, res) => {
  try {
    if (!FACEBOOK_APP_ID) {
      console.error('Facebook App ID not configured');
      return res.status(500).json({
        success: false,
        message: 'Facebook OAuth is not configured'
      });
    }

    // Get state parameter from query if provided by frontend
    const state = req.query.state;

    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      scope: 'email,public_profile',
      response_type: 'code',
      auth_type: 'rerequest',
      display: 'popup'
    });

    // Add state parameter if provided
    if (state) {
      params.append('state', state);
    }

    const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?${params.toString()}`;

    res.json({
      success: true,
      data: {
        url: authUrl
      }
    });
  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authentication URL'
    });
  }
};

/**
 * Facebook OAuth login/signup
 */
const facebookAuth = async (req, res) => {
  try {
    const { code, accessToken } = req.body;

    console.log('Facebook auth request:', { hasCode: !!code, hasAccessToken: !!accessToken });

    // Handle code exchange flow (server-side OAuth)
    if (code) {
      // Check if code was already used
      if (usedCodes.has(code)) {
        return res.status(400).json({
          success: false,
          message: 'This authorization code has already been used. Please try signing in again.',
          error: 'duplicate_code'
        });
      }

      // Mark code as used
      usedCodes.set(code, Date.now());

      try {
        console.log('Exchanging Facebook code for access token...');
        
        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
          params: {
            client_id: FACEBOOK_APP_ID,
            client_secret: FACEBOOK_APP_SECRET,
            redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
            code: code
          }
        });

        console.log('Facebook token response received');
        const { access_token } = tokenResponse.data;

        if (!access_token) {
          throw new Error('No access token received from Facebook');
        }

        // Now use the access token to get user data
        return handleFacebookUser(access_token, res);

      } catch (error) {
        // Remove code from used list on error
        usedCodes.delete(code);
        
        console.error('Facebook code exchange error:', error.response?.data || error.message);
        
        if (error.response?.data?.error?.message?.includes('expired')) {
          return res.status(400).json({
            success: false,
            message: 'Authorization code has expired. Please try signing in again.'
          });
        }
        
        return res.status(400).json({
          success: false,
          message: error.response?.data?.error?.message || 'Failed to authenticate with Facebook'
        });
      }
    }
    
    // Handle direct access token flow (client-side OAuth)
    else if (accessToken) {
      return handleFacebookUser(accessToken, res);
    }
    
    else {
      return res.status(400).json({
        success: false,
        message: 'Facebook authorization code or access token is required'
      });
    }

  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle Facebook user data and create/update user
 */
async function handleFacebookUser(accessToken, res) {
  try {
    console.log('Fetching Facebook user data...');
    
    // Verify Facebook token and get user data
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,email,name,first_name,last_name,picture.type(large)&access_token=${accessToken}`
    );

    const fbData = fbResponse.data;
    console.log('Facebook user data received:', { id: fbData.id, email: fbData.email });

    if (!fbData.email) {
      return res.status(400).json({
        success: false,
        message: 'Email permission is required for authentication'
      });
    }

    // First, check if a user with this Facebook ID already exists
    let user = await User.findOne({ where: { facebookId: fbData.id } });

    if (user) {
      console.log('User found by Facebook ID, updating...');
      // Update existing user
      user.email = fbData.email; // Update email in case it changed
      user.firstName = fbData.first_name || user.firstName;
      user.lastName = fbData.last_name || user.lastName;
      user.profilePicture = fbData.picture?.data?.url || user.profilePicture;
      user.lastLogin = new Date();
      user.isEmailVerified = true;
      
      await user.save();
    } else {
      // Check if user exists with this email
      user = await User.findOne({ where: { email: fbData.email } });
      
      if (user) {
        console.log('User found by email, linking Facebook account...');
        // Check if this user already has a different Facebook ID
        if (user.facebookId && user.facebookId !== fbData.id) {
          return res.status(400).json({
            success: false,
            message: 'This email is already associated with a different Facebook account'
          });
        }
        
        // Link Facebook account to existing user
        user.facebookId = fbData.id;
        user.firstName = user.firstName || fbData.first_name;
        user.lastName = user.lastName || fbData.last_name;
        user.profilePicture = user.profilePicture || fbData.picture?.data?.url;
        user.lastLogin = new Date();
        user.isEmailVerified = true;
        
        await user.save();
      } else {
        console.log('Creating new user...');
        // Create new user
        user = await User.create({
          email: fbData.email,
          firstName: fbData.first_name,
          lastName: fbData.last_name,
          profilePicture: fbData.picture?.data?.url,
          facebookId: fbData.id,
          provider: 'facebook',
          isEmailVerified: true,
          isActive: true,
          // Generate a random password for OAuth users
          password: crypto.randomBytes(32).toString('hex')
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Facebook authentication successful for user:', user.email);

    res.json({
      success: true,
      token,
      refreshToken,
      data: {
        user: {
          _id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    console.error('Facebook user handling error:', error);
    throw error;
  }
}

module.exports = {
  getFacebookAuthUrl,
  facebookAuth
};
