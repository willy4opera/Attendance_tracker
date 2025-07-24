// Fix the deleteImage method to return proper status codes
exports.deleteImage = catchAsync(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new AppError('Please provide a public ID', 400));
  }

  try {
    const result = await deleteImage(publicId);

    // Cloudinary returns {result: 'not found'} when image doesn't exist
    if (result.result === 'not found') {
      // Return 404 instead of 400 for not found
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
    
    // Better error handling
    let errorMessage = 'Failed to delete image from Cloudinary';
    let statusCode = 500;
    
    // Extract error message from various error formats
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Check if it's a "not found" error and set proper status
    if (error.http_code === 404 || 
        errorMessage.toLowerCase().includes('not found') ||
        errorMessage.toLowerCase().includes('resource not found')) {
      statusCode = 404;
      errorMessage = 'Image not found';
    }
    
    return next(new AppError(errorMessage, statusCode));
  }
});
