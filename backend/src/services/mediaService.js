const { uploadImageBuffer, deleteImage } = require('../config/cloudinary.config');
const youtubeService = require('./youtubeService');
const fs = require('fs').promises;
const path = require('path');

class MediaService {
  /**
   * Process and upload image to Cloudinary
   * @param {Object} file - Multer file object
   * @returns {Object} Image attachment data
   */
  async uploadImage(file) {
    try {
      // If using multer-cloudinary, the file is already uploaded
      if (file.path && file.path.includes('cloudinary')) {
        return {
          type: 'image',
          url: file.path,
          publicId: file.filename,
          name: file.originalname,
          size: file.size,
          format: file.format || file.mimetype.split('/')[1],
          width: file.width,
          height: file.height
        };
      }

      // For local file uploads, upload to Cloudinary
      const buffer = await fs.readFile(file.path);
      const result = await uploadImageBuffer(buffer, {
        public_id: `comment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        folder: 'attendance-tracker/comments'
      });

      // Delete local file after upload
      await fs.unlink(file.path).catch(() => {});

      return {
        type: 'image',
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
        size: file.size,
        format: result.format,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Process and upload video to YouTube
   * @param {Object} file - Multer file object
   * @param {Object} metadata - Video metadata
   * @returns {Object} Video attachment data
   */
  async uploadVideo(file, metadata = {}) {
    try {
      if (!youtubeService.isAuthenticated()) {
        throw new Error('YouTube service not authenticated');
      }

      const videoMetadata = {
        title: metadata.title || `Comment Video - ${new Date().toLocaleString()}`,
        description: metadata.description || 'Video uploaded via Attendance Tracker',
        tags: metadata.tags || ['attendance-tracker', 'comment'],
        privacyStatus: metadata.privacyStatus || process.env.VIDEO_PRIVACY_DEFAULT || 'unlisted'
      };

      const result = await youtubeService.uploadVideo(file.path, videoMetadata);

      // Delete local file after upload
      await fs.unlink(file.path).catch(() => {});

      return {
        type: 'youtube',
        videoId: result.videoId,
        url: result.embedUrl,
        videoUrl: result.videoUrl,
        thumbnail: result.thumbnail,
        privacyStatus: result.privacyStatus,
        name: file.originalname,
        size: file.size,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      
      // Clean up file on error
      await fs.unlink(file.path).catch(() => {});
      
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   */
  async deleteImage(publicId) {
    try {
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Delete video from YouTube
   * @param {string} videoId - YouTube video ID
   */
  async deleteVideo(videoId) {
    try {
      if (!youtubeService.isAuthenticated()) {
        throw new Error('YouTube service not authenticated');
      }
      
      await youtubeService.deleteVideo(videoId);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  /**
   * Delete all attachments
   * @param {Array} attachments - Array of attachment objects
   */
  async deleteAttachments(attachments = []) {
    const deletePromises = attachments.map(async (attachment) => {
      try {
        if (attachment.type === 'image' && attachment.publicId) {
          await this.deleteImage(attachment.publicId);
        } else if (attachment.type === 'youtube' && attachment.videoId) {
          await this.deleteVideo(attachment.videoId);
        }
      } catch (error) {
        console.error(`Error deleting ${attachment.type}:`, error);
      }
    });

    await Promise.allSettled(deletePromises);
  }

  /**
   * Validate file type and size
   * @param {Object} file - File object
   * @param {string} type - 'image' or 'video'
   */
  validateFile(file, type) {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 128 * 1024 * 1024; // 128MB

    if (type === 'image') {
      if (!imageTypes.includes(file.mimetype)) {
        throw new Error('Invalid image format. Supported: JPEG, PNG, GIF, WebP');
      }
      if (file.size > maxImageSize) {
        throw new Error('Image size must be less than 5MB');
      }
    } else if (type === 'video') {
      if (!videoTypes.includes(file.mimetype)) {
        throw new Error('Invalid video format. Supported: MP4, WebM, OGG, MOV');
      }
      if (file.size > maxVideoSize) {
        throw new Error('Video size must be less than 128MB');
      }
    }

    return true;
  }
}

module.exports = new MediaService();
