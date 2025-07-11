require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class YouTubeService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // Load stored tokens if they exist
    this.loadStoredTokens();
  }

  /**
   * Load stored refresh token from file or database
   */
  loadStoredTokens() {
    try {
      const tokenPath = path.join(__dirname, '../../config/youtube-tokens.json');
      if (fs.existsSync(tokenPath)) {
        const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        this.oauth2Client.setCredentials(tokens);
      }
    } catch (error) {
      console.log('No stored tokens found, need to authenticate');
    }
  }

  /**
   * Save tokens to file (in production, use database)
   */
  saveTokens(tokens) {
    const tokenPath = path.join(__dirname, '../../config/youtube-tokens.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get authorization URL for initial setup
   */
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ,
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ],
      prompt: 'consent' // Force to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.saveTokens(tokens);
    return tokens;
  }

  /**
   * Get information about the authenticated channel
   */
  async getChannelInfo() {
    try {
      await this.refreshTokensIfNeeded();
      
      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      const response = await youtube.channels.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        mine: true
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          thumbnail: channel.snippet.thumbnails.default.url,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting channel info:', error);
      throw error;
    }
  }

  /**
   * Upload video to YouTube
   * @param {string} videoPath - Path to the video file
   * @param {object} metadata - Video metadata
   * @param {string} metadata.privacyStatus - 'private', 'unlisted', or 'public' (default: 'unlisted')
   */
  async uploadVideo(videoPath, metadata) {
    try {
      // Ensure we have valid tokens
      await this.refreshTokensIfNeeded();

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      const fileSize = fs.statSync(videoPath).size;
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: metadata.title || 'Task Comment Video',
            description: metadata.description || 'Video uploaded via Attendance Tracker',
            tags: metadata.tags || ['attendance-tracker', 'comment'],
            categoryId: metadata.categoryId || '22' // People & Blogs
          },
          status: {
            privacyStatus: metadata.privacyStatus || 'unlisted', // Can be 'private', 'unlisted', or 'public'
            selfDeclaredMadeForKids: false,
            // Optional: Schedule for later
            publishAt: metadata.publishAt // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sZ
          }
        },
        media: {
          body: fs.createReadStream(videoPath)
        }
      }, {
        // Upload progress tracking
        onUploadProgress: evt => {
          const progress = (evt.bytesRead / fileSize) * 100;
          console.log(`Upload Progress: ${Math.round(progress)}%`);
        }
      });

      return {
        success: true,
        videoId: response.data.id,
        videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`,
        embedUrl: `https://www.youtube.com/embed/${response.data.id}`,
        thumbnail: `https://img.youtube.com/vi/${response.data.id}/mqdefault.jpg`,
        privacyStatus: response.data.status.privacyStatus,
        channelId: response.data.snippet.channelId
      };
    } catch (error) {
      console.error('YouTube upload error:', error);
      throw error;
    }
  }

  /**
   * Update video privacy status
   */
  async updateVideoPrivacy(videoId, privacyStatus) {
    try {
      await this.refreshTokensIfNeeded();

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      const response = await youtube.videos.update({
        part: ['status'],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: privacyStatus // 'private', 'unlisted', or 'public'
          }
        }
      });

      return {
        success: true,
        videoId: response.data.id,
        privacyStatus: response.data.status.privacyStatus
      };
    } catch (error) {
      console.error('Error updating video privacy:', error);
      throw error;
    }
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokensIfNeeded() {
    try {
      const tokens = this.oauth2Client.credentials;
      
      // Check if token is expired or about to expire
      if (tokens.expiry_date && tokens.expiry_date <= Date.now() + 60000) {
        console.log('Refreshing YouTube access token...');
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        this.saveTokens(credentials);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('YouTube authentication required. Please re-authenticate.');
    }
  }

  /**
   * Check if YouTube service is authenticated
   */
  isAuthenticated() {
    return !!(this.oauth2Client.credentials && this.oauth2Client.credentials.refresh_token);
  }

  /**
   * Delete a video from YouTube
   */
  async deleteVideo(videoId) {
    try {
      await this.refreshTokensIfNeeded();

      const youtube = google.youtube({
        version: 'v3',
        auth: this.oauth2Client
      });

      await youtube.videos.delete({
        id: videoId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
}

module.exports = new YouTubeService();
