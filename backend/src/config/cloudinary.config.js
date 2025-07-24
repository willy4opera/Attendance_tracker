const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with timeout settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60 seconds timeout
  secure: true
});

// Test function to verify configuration
const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test:', result);
    return true;
  } catch (error) {
    console.error('Cloudinary connection error:', error.message);
    return false;
  }
};

// Create storage for images with error handling
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    try {
      return {
        folder: 'attendance-tracker/comments',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' }
        ],
        format: 'jpg', // Convert all to jpg for consistency
        public_id: `comment_${Date.now()}_${Math.round(Math.random() * 1E9)}`
      };
    } catch (error) {
      console.error('Storage params error:', error);
      throw error;
    }
  }
});

// Create multer upload middleware for images
const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Alternative upload function using direct API
const uploadDirect = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'attendance-tracker/comments',
      resource_type: 'image',
      timeout: 60000
    });
    return result;
  } catch (error) {
    console.error('Direct upload error:', error);
    throw error;
  }
};

// Alternative upload function with customizable folder
const uploadToFolder = async (filePath, folder = 'attendance-tracker/general') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      timeout: 60000
    });
    return result;
  } catch (error) {
    console.error(`Upload error to folder ${folder}:`, error);
    throw error;
  }
};

// Specific upload function for board headers
const uploadBoardHeader = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'attendance-tracker/boardHeader',
      resource_type: 'image',
      timeout: 60000,
      transformation: [
        { width: 1920, height: 400, crop: 'limit' },
        { quality: 'auto:best' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Board header upload error:', error);
    throw error;
  }
};

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      timeout: 30000
    });
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Function to upload image buffer directly
const uploadImageBuffer = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'attendance-tracker/comments',
      resource_type: 'image',
      timeout: 60000,
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Upload stream error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// Buffer upload with custom folder
const uploadImageBufferToFolder = async (buffer, folder = 'attendance-tracker/general', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      timeout: 60000,
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error(`Upload stream error to folder ${folder}:`, error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// Function to get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
    ...options
  };
  
  return cloudinary.url(publicId, defaultOptions);
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  uploadImageBuffer,
  getOptimizedImageUrl,
  testConnection,
  uploadDirect,
  uploadToFolder,
  uploadBoardHeader,
  uploadImageBufferToFolder
};
