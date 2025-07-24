// Update the deleteImage method to handle errors better
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
