const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { generateToken } = require('../../utils/tokenUtils');
const { Op } = require('sequelize');

/**
 * Get GitHub OAuth URL
 */
const getGitHubAuthUrl = (state) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;
  const stateParam = state || Math.random().toString(36).substring(7);
  const scope = 'user:email';
  
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${stateParam}`;
};

/**
 * GitHub OAuth login/signup
 */
const githubAuth = async (req, res) => {
  try {
    const { code, state } = req.body;
    
    console.log('GitHub auth request:', { 
      hasCode: !!code, 
      codeLength: code?.length,
      hasState: !!state,
      statePreview: state ? state.substring(0, 30) + '...' : null
    });

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'GitHub authorization code is required'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
      },
      {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error('Failed to obtain GitHub access token');
    }

    // Get user data from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: 10000 // 10 second timeout
    });

    const githubUser = userResponse.data;

    // Get user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000 // 10 second timeout
      });

      const primaryEmail = emailResponse.data.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : emailResponse.data[0]?.email;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to retrieve email from GitHub account'
      });
    }

    // Check if user exists
    let user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { githubId: githubUser.id.toString() }
        ]
      } 
    });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        firstName: githubUser.name?.split(' ')[0] || githubUser.login,
        lastName: githubUser.name?.split(' ').slice(1).join(' ') || '',
        profilePicture: githubUser.avatar_url,
        githubId: githubUser.id.toString(),
        isEmailVerified: true, // GitHub emails are verified
        provider: 'github',
        password: null
      });
    } else {
      // Update existing user with GitHub info if not already linked
      if (!user.githubId) {
        user.githubId = githubUser.id.toString();
        user.profilePicture = user.profilePicture || githubUser.avatar_url;
        await user.save();
      }
    }

    // Generate JWT token
    const token = generateToken(user);
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'GitHub authentication successful',
      token,
      refreshToken,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });

  } catch (error) {
    console.error('GitHub auth error:', error);
    
    let statusCode = 500;
    let message = 'GitHub authentication failed';
    
    if (error.response?.status === 401) {
      statusCode = 401;
      message = 'Invalid GitHub credentials or authorization code';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      statusCode = 504;
      message = 'GitHub API request timed out. Please try again.';
    } else if (error.response?.status === 403) {
      statusCode = 403;
      message = 'GitHub API rate limit exceeded or insufficient permissions';
    }
    
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get GitHub OAuth URL endpoint
 */
const getGitHubUrl = (req, res) => {
  try {
    const state = req.query.state;
    
    const authUrl = getGitHubAuthUrl(state);
    
    return res.status(200).json({
      success: true,
      data: {
        url: authUrl
      }
    });
  } catch (error) {
    console.error('GitHub URL generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate GitHub OAuth URL'
    });
  }
};

module.exports = {
  githubAuth,
  getGitHubAuthUrl,
  getGitHubUrl
};
