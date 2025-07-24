const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { generateToken } = require('../../utils/tokenUtils');
const { Op } = require('sequelize');

// Simple in-memory store for used LinkedIn authorization codes
// In production, this should be in Redis with TTL
const usedLinkedInCodes = new Set();

// Function to check and mark code as used
const markCodeAsUsed = (code) => {
  if (usedLinkedInCodes.has(code)) {
    return false; // Code already used
  }
  usedLinkedInCodes.add(code);
  
  // Clean up old codes after 10 minutes
  setTimeout(() => {
    usedLinkedInCodes.delete(code);
  }, 10 * 60 * 1000);
  
  return true; // Code marked as used
};

/**
 * Get LinkedIn OAuth URL
 */
const getLinkedInAuthUrl = (state) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const stateParam = state || Math.random().toString(36).substring(7);
  const scope = 'openid profile email';
  
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}&scope=${encodeURIComponent(scope)}`;
};

/**
 * Exchange LinkedIn authorization code for access token
 */
const exchangeLinkedInCode = async (code) => {
  try {
    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000 // 10 second timeout
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('LinkedIn token exchange error:', error.response?.data || error.message);
    
    if (error.response?.data?.error_description) {
      const errorDesc = error.response.data.error_description;
      
      if (errorDesc.includes('authorization code not found') || 
          errorDesc.includes('authorization code expired')) {
        throw new Error('The authorization code has expired or is invalid. Please try logging in again.');
      }
      
      if (errorDesc.includes('external member binding exists')) {
        throw new Error('LinkedIn authorization already exists. If you are having trouble, try clearing your browser cookies for LinkedIn.');
      }
      
      if (errorDesc.includes('redirect uri') || errorDesc.includes('redirect_uri')) {
        throw new Error('Configuration error: Redirect URI mismatch.');
      }
    }
    
    throw new Error('Failed to exchange LinkedIn authorization code');
  }
};

/**
 * Get LinkedIn user profile
 */
const getLinkedInProfile = async (accessToken) => {
  try {
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('LinkedIn profile fetched successfully:', {
      hasData: !!profileResponse.data,
      email: profileResponse.data?.email
    });
    
    return profileResponse.data;
  } catch (error) {
    console.error('LinkedIn profile fetch error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('LinkedIn API request timed out. Please try again.');
    }
    
    if (!error.response) {
      throw new Error('LinkedIn profile request failed. This may be due to network issues or LinkedIn temporarily blocking requests.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('LinkedIn access token is invalid or expired');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Insufficient permissions to access LinkedIn profile');
    }
    
    if (error.response?.status === 429) {
      throw new Error('LinkedIn API rate limit exceeded. Please try again later');
    }
    
    throw new Error('Failed to fetch LinkedIn profile');
  }
};

/**
 * LinkedIn OAuth login/signup
 */
const linkedinAuth = async (req, res) => {
  try {
    const { code, state } = req.body;
    
    console.log('LinkedIn auth request:', { 
      hasCode: !!code, 
      codeLength: code?.length,
      hasState: !!state,
      statePreview: state ? state.substring(0, 30) + '...' : null
    });
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn authorization code is required'
      });
    }
    
    // Check if code has already been used
    if (!markCodeAsUsed(code)) {
      console.log('LinkedIn auth error: Authorization code has already been used');
      return res.status(400).json({
        success: false,
        message: 'This authorization code has already been used. Please initiate a new login.'
      });
    }
    
    // Exchange code for access token
    const accessToken = await exchangeLinkedInCode(code);
    
    // Get user profile from LinkedIn
    const linkedinProfile = await getLinkedInProfile(accessToken);
    
    const { 
      sub: linkedinId,
      email,
      email_verified,
      name,
      given_name,
      family_name,
      picture
    } = linkedinProfile;
    
    // Check if user exists
    let user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { linkedinId }
        ]
      } 
    });
    
    if (!user) {
      // Create new user
      user = await User.create({
        email,
        firstName: given_name || name?.split(' ')[0] || '',
        lastName: family_name || name?.split(' ').slice(1).join(' ') || '',
        profilePicture: picture,
        linkedinId,
        isEmailVerified: email_verified || false,
        provider: 'linkedin',
        password: null
      });
    } else {
      // Update existing user with LinkedIn info if not already linked
      if (!user.linkedinId) {
        user.linkedinId = linkedinId;
        user.profilePicture = user.profilePicture || picture;
        user.isEmailVerified = user.isEmailVerified || email_verified || false;
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
      message: 'LinkedIn authentication successful',
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
    console.error('LinkedIn auth error:', error);
    
    let statusCode = 500;
    let message = 'LinkedIn authentication failed';
    
    if (error.message.includes('already authorized')) {
      statusCode = 409;
      message = error.message;
    } else if (error.message.includes('expired') || error.message.includes('invalid')) {
      statusCode = 401;
      message = error.message;
    } else if (error.message.includes('timed out')) {
      statusCode = 504;
      message = error.message;
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
      message = error.message;
    } else if (error.message.includes('network issues') || error.message.includes('profile request failed')) {
      statusCode = 503;
      message = 'LinkedIn service is temporarily unavailable. Please try again later.';
    }
    
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get LinkedIn OAuth URL endpoint
 */
const getLinkedInUrl = (req, res) => {
  try {
    const state = req.query.state;
    
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State parameter is required'
      });
    }
    
    const authUrl = getLinkedInAuthUrl(state);
    
    return res.status(200).json({
      success: true,
      data: {
        url: authUrl
      }
    });
  } catch (error) {
    console.error('LinkedIn URL generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate LinkedIn OAuth URL'
    });
  }
};

module.exports = {
  linkedinAuth,
  getLinkedInAuthUrl,
  getLinkedInUrl,
  exchangeLinkedInCode,
  getLinkedInProfile
};
