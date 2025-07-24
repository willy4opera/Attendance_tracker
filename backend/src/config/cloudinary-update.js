// Add this function to cloudinary.config.js

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

// Export these new functions
module.exports = {
  // ... existing exports
  uploadToFolder,
  uploadBoardHeader,
  uploadImageBufferToFolder
};
