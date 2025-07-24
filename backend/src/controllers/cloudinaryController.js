const { 
  cloudinary, 
  uploadDirect, 
  uploadImageBuffer, 
  deleteImage, 
  getOptimizedImageUrl,
  testConnection 
} = require('../config/cloudinary.config');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const fs = require('fs').promises;
const path = require('path');

// Test Cloudinary connection
exports.testConnection = catchAsync(async (req, res, next) => {
  const isConnected = await testConnection();
  
  if (!isConnected) {
    return next(new AppError('Failed to connect to Cloudinary', 500));
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Cloudinary connection successful'
  });
});

// Upload single image using direct upload
exports.uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  let uploadResult = null;
  
  try {
    // Upload to Cloudinary using direct upload
    uploadResult = await uploadDirect(req.file.path);
    
    // Delete the temporary file after successful upload
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }

    res.status(200).json({
      status: 'success',
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        size: uploadResult.bytes,
        originalName: req.file.originalname,
        resourceType: uploadResult.resource_type,
        createdAt: uploadResult.created_at
      }
    });
  } catch (error) {
    // Clean up temporary file on error
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }
    
    console.error('Upload error:', error);
    
    // Handle specific Cloudinary errors
    if (error.http_code === 401) {
      return next(new AppError('Cloudinary authentication failed. Please check API credentials.', 401));
    } else if (error.http_code === 400) {
      return next(new AppError('Invalid upload request: ' + error.message, 400));
    } else if (error.http_code === 499 || error.name === 'TimeoutError') {
      return next(new AppError('Upload timeout. Please try with a smaller file.', 408));
    }
    
    return next(new AppError('Failed to upload image: ' + error.message, 500));
  }
});

// Upload multiple images using direct upload
exports.uploadMultipleImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one image', 400));
  }

  const uploadedImages = [];
  const errors = [];

  // Upload all files
  for (const file of req.files) {
    try {
      const result = await uploadDirect(file.path);
      
      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        originalName: file.originalname,
        resourceType: result.resource_type
      });
    } catch (error) {
      console.error(`Error uploading ${file.originalname}:`, error);
      errors.push({
        filename: file.originalname,
        error: error.message
      });
    } finally {
      // Always clean up temporary file
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  }

  if (uploadedImages.length === 0 && errors.length > 0) {
    return next(new AppError('Failed to upload any images. ' + errors[0].error, 500));
  }

  res.status(200).json({
    status: 'success',
    results: uploadedImages.length,
    data: uploadedImages,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Upload image from buffer (for base64 or stream uploads)
exports.uploadImageBuffer = catchAsync(async (req, res, next) => {
  const { image, filename, folder } = req.body;
  
  if (!image) {
    return next(new AppError('Please provide image data', 400));
  }

  try {
    // Convert base64 to buffer if needed
    let buffer;
    if (typeof image === 'string' && image.includes('base64')) {
      // Extract base64 data
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(image)) {
      buffer = image;
    } else {
      return next(new AppError('Invalid image data format', 400));
    }

    // Upload buffer to Cloudinary
    const options = {
      folder: folder || 'attendance-tracker/uploads',
      public_id: filename ? `${filename}_${Date.now()}` : undefined
    };
    
    const result = await uploadImageBuffer(buffer, options);

    res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        resourceType: result.resource_type,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    console.error('Buffer upload error:', error);
    
    if (error.http_code === 499 || error.name === 'TimeoutError') {
      return next(new AppError('Upload timeout. Please try with a smaller image.', 408));
    }
    
    return next(new AppError('Failed to upload image buffer: ' + error.message, 500));
  }
});

// Delete image from Cloudinary
exports.deleteImage = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new AppError('Please provide a public ID', 400));
  }

  try {
    const result = await deleteImage(publicId);

    if (result.result === 'not found') {
      return next(new AppError('Image not found', 404));
    }

    if (result.result !== 'ok') {
      return next(new AppError('Failed to delete image', 400));
    }

    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully',
      data: {
        publicId: publicId,
        result: result.result
      }
    });
  } catch (error) {
    console.error('Delete error:', error);
    
    // Handle different error types
    let errorMessage = 'Failed to delete image from Cloudinary';
    
    if (error.message) {
      errorMessage += ': ' + error.message;
    } else if (error.error && error.error.message) {
      errorMessage += ': ' + error.error.message;
    } else if (typeof error === 'string') {
      errorMessage += ': ' + error;
    } else {
      errorMessage += ': Unknown error';
    }
    
    // Check if it's a "not found" error from Cloudinary
    if (error.http_code === 404 || 
        (error.error && error.error.http_code === 404) ||
        errorMessage.includes('not found')) {
      return next(new AppError('Image not found in Cloudinary', 404));
    }
    
    return next(new AppError(errorMessage, 500));
  }
});

// Get image details from Cloudinary
exports.getImageDetails = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new AppError('Please provide a public ID', 400));
  }

  try {
    const result = await cloudinary.api.resource(publicId, {
      colors: true,
      faces: true,
      image_metadata: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        createdAt: result.created_at,
        colors: result.colors,
        predominantColor: result.predominant ? result.predominant.google : null,
        faces: result.faces,
        metadata: result.image_metadata
      }
    });
  } catch (error) {
    console.error('Get details error:', error);
    
    if (error.http_code === 404) {
      return next(new AppError('Image not found', 404));
    }
    
    return next(new AppError('Failed to get image details: ' + error.message, 500));
  }
});

// Get optimized image URL
exports.getOptimizedUrl = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;
  const { width, height, quality, format } = req.query;

  if (!publicId) {
    return next(new AppError('Please provide a public ID', 400));
  }

  const options = {};
  
  if (width) options.width = parseInt(width);
  if (height) options.height = parseInt(height);
  if (quality) options.quality = quality;
  if (format) options.format = format;

  const optimizedUrl = getOptimizedImageUrl(publicId, options);

  res.status(200).json({
    status: 'success',
    data: {
      url: optimizedUrl,
      publicId,
      options
    }
  });
});

// Transform image (resize, crop, etc.)
exports.transformImage = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;
  const { width, height, crop, quality, format, effect, angle, radius } = req.query;

  if (!publicId) {
    return next(new AppError('Please provide a public ID', 400));
  }

  const transformations = [];
  
  // Size transformations
  if (width || height) {
    transformations.push({
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      crop: crop || 'fill'
    });
  }

  // Quality
  if (quality) {
    transformations.push({ quality });
  }

  // Effects
  if (effect) {
    transformations.push({ effect });
  }

  // Rotation
  if (angle) {
    transformations.push({ angle: parseInt(angle) });
  }

  // Rounded corners
  if (radius) {
    transformations.push({ radius: radius === 'max' ? 'max' : parseInt(radius) });
  }

  const transformedUrl = cloudinary.url(publicId, {
    transformation: transformations,
    format: format || 'auto',
    secure: true,
    fetch_format: 'auto'
  });

  res.status(200).json({
    status: 'success',
    data: {
      url: transformedUrl,
      publicId,
      transformations,
      format: format || 'auto'
    }
  });
});

// Generate upload signature for client-side uploads
exports.generateUploadSignature = catchAsync(async (req, res, next) => {
  const { folder, tags } = req.body;
  
  const timestamp = Math.round((new Date()).getTime() / 1000);
  
  const params = {
    timestamp: timestamp,
    folder: folder || 'attendance-tracker/client-uploads',
    tags: tags || 'client-upload'
  };
  
  const signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret);
  
  res.status(200).json({
    status: 'success',
    data: {
      timestamp,
      signature,
      api_key: cloudinary.config().api_key,
      cloud_name: cloudinary.config().cloud_name,
      params
    }
  });
});

// Upload image to specific folder
exports.uploadToFolder = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  const { folder } = req.body;
  if (!folder) {
    return next(new AppError('Please specify a folder', 400));
  }

  try {
    // Import the new function
    const { uploadToFolder } = require('../config/cloudinary.config');
    
    // Upload to specified folder
    const result = await uploadToFolder(req.file.path, folder);
    
    // Delete the temporary file
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }

    res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        originalName: req.file.originalname,
        folder: folder,
        resourceType: result.resource_type,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    // Clean up temporary file on error
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }
    
    console.error('Folder upload error:', error);
    return next(new AppError('Failed to upload image to folder: ' + error.message, 500));
  }
});

// Upload board header image
exports.uploadBoardHeader = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a board header image', 400));
  }

  try {
    // Import the new function
    const { uploadBoardHeader } = require('../config/cloudinary.config');
    
    // Upload board header
    const result = await uploadBoardHeader(req.file.path);
    
    // Delete the temporary file
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }

    res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        originalName: req.file.originalname,
        folder: 'attendance-tracker/boardHeader',
        resourceType: result.resource_type,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    // Clean up temporary file on error
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }
    
    console.error('Board header upload error:', error);
    return next(new AppError('Failed to upload board header: ' + error.message, 500));
  }
});

// Upload buffer to specific folder
exports.uploadBufferToFolder = catchAsync(async (req, res, next) => {
  const { image, filename, folder } = req.body;
  
  if (!image) {
    return next(new AppError('Please provide image data', 400));
  }

  if (!folder) {
    return next(new AppError('Please specify a folder', 400));
  }

  try {
    // Import the new function
    const { uploadImageBufferToFolder } = require('../config/cloudinary.config');
    
    // Convert base64 to buffer if needed
    let buffer;
    if (typeof image === 'string' && image.includes('base64')) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(image)) {
      buffer = image;
    } else {
      return next(new AppError('Invalid image data format', 400));
    }

    // Upload buffer to specified folder
    const options = {
      public_id: filename ? `${filename}_${Date.now()}` : undefined
    };
    
    const result = await uploadImageBufferToFolder(buffer, folder, options);

    res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        folder: folder,
        resourceType: result.resource_type,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    console.error('Buffer to folder upload error:', error);
    return next(new AppError('Failed to upload buffer to folder: ' + error.message, 500));
  }
});
