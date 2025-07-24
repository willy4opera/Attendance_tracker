  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (headerImage && onUpdate) {
      try {
        // Try to delete from Cloudinary if it's a Cloudinary URL
        if (headerImage.includes('cloudinary.com')) {
          const publicId = cloudinaryService.extractPublicId(headerImage);
          if (publicId) {
            try {
              await cloudinaryService.deleteImage(publicId);
            } catch (deleteError: any) {
              // If image not found or already deleted, that's okay
              if (deleteError.response?.status !== 404 && 
                  deleteError.response?.data?.message !== 'Image not found') {
                console.error('Error deleting from Cloudinary:', deleteError);
              }
            }
          }
        }
        
        // Update board to remove image regardless of Cloudinary deletion result
        await onUpdate(board.id.toString(), {
          backgroundImage: null
        });
        
        setHeaderImage(null);
        setIsEditingHeader(false);
      } catch (error) {
        console.error('Error removing image:', error);
        alert('Error removing image. Please try again.');
      }
    }
  };
