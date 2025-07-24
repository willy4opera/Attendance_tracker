import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Users, 
  List, 
  Archive, 
  Star, 
  StarOff,
  Folder,
  Building2,
  Edit,
  Image as ImageIcon,
  Save,
  X,
  Upload
} from 'lucide-react';
import type { Board } from '../../types';
import theme from '../../config/theme';
import cloudinaryService from '../../services/cloudinaryService';

interface BoardCardProps {
  board: Board;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onStar?: (id: string) => void;
  onArchive?: (id: string) => void;
  onEdit?: (board: Board) => void;
  onUpdate?: (id: string, data: any) => Promise<any>;
  onImageUpdate?: (boardId: string, imageUrl: string | null) => void;
  showProject?: boolean;
}

const BoardCard: React.FC<BoardCardProps> = ({ 
  board, 
  viewMode = 'grid',
  onClick,
  onDelete, 
  onStar, 
  onArchive,
  onEdit,
  onUpdate,
  onImageUpdate,
  showProject = true
}) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(board.backgroundImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleMenuClick = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    switch (action) {
      case 'delete':
        onDelete?.(board.id.toString());
        break;
      case 'star':
        onStar?.(board.id.toString());
        break;
      case 'archive':
        onArchive?.(board.id.toString());
        break;
      case 'edit':
        onEdit?.(board);
        break;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if we're editing or if a button was clicked
    if (isEditingHeader || e.defaultPrevented) {
      return;
    }
    
    if (onClick) {
      e.preventDefault();
      onClick();
    } else {
      // Navigate to board details
      navigate(`/boards/${board.id}`);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Validate the image file
        const validation = cloudinaryService.validateImageFile(file, 5);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }
        
        setIsUploading(true);
        setUploadProgress(20);
        
        // Upload image to board header folder using Cloudinary service
        const response = await cloudinaryService.uploadBoardHeader(file);
        
        setUploadProgress(80);
        
        if (response.status === 'success' && response.data.url) {
          const newImageUrl = response.data.url;
          setHeaderImage(newImageUrl);
          setUploadProgress(100);
          
          // Notify parent component about the image update
          onImageUpdate?.(board.id.toString(), newImageUrl);
          
          // Close the edit mode
          setIsEditingHeader(false);
        }
        
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleEditHeader = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingHeader(true);
  };

  const handleImageButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (headerImage) {
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
        
        // Clear the image locally
        setHeaderImage(null);
        setIsEditingHeader(false);
        
        // Notify parent component about the image removal
        onImageUpdate?.(board.id.toString(), null);
        
      } catch (error) {
        console.error('Error removing image:', error);
        alert('Error removing image. Please try again.');
      }
    }
  };

  const handleCancelHeader = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeaderImage(board.backgroundImage || null);
    setIsEditingHeader(false);
  };

  const backgroundColor = board.backgroundColor || theme.colors.primary;
  const backgroundImage = headerImage;
  const memberCount = board.members?.length || 0;
  const listCount = board.stats?.listCount || 0;
  const taskCount = board.stats?.taskCount || 0;

  // Determine if we should use gold text (only on black/dark backgrounds without images)
  const isBlackBackground = backgroundColor.toLowerCase() === '#000000' || backgroundColor.toLowerCase() === 'black' || backgroundColor === theme.colors.secondary;
  const useGoldText = isBlackBackground && !backgroundImage;

  const CardContent = () => (
    <div 
      className="rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer" 
      style={{ backgroundColor: theme.colors.background.paper, borderColor: theme.colors.primary + '20' }}
      onClick={handleCardClick}
    >
      <div 
        className="h-32 flex items-center justify-center font-bold relative overflow-hidden group"
        style={{ 
          backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay for better text visibility on images */}
        {backgroundImage && (
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        )}
        
        {/* Edit Header Button - Only show if we have onUpdate or onImageUpdate */}
        {((onUpdate || onImageUpdate) && !isEditingHeader) && (
          <button
            onClick={handleEditHeader}
            className="absolute top-2 right-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
              e.currentTarget.style.color = theme.colors.primary;
            }}
            title="Edit board header image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        )}

        {/* Edit Header Controls */}
        {isEditingHeader && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              <button
                onClick={handleImageButtonClick}
                className="p-3 rounded transition-all duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.primary
                }}
                disabled={isUploading}
                title="Upload new image"
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload</span>
              </button>
              {headerImage && (
                <button
                  onClick={handleRemoveImage}
                  className="p-3 rounded transition-all duration-200"
                  style={{
                    backgroundColor: theme.colors.warning,
                    color: 'white'
                  }}
                  disabled={isUploading}
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleCancelHeader}
                className="p-3 rounded transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.error,
                  color: 'white'
                }}
                disabled={isUploading}
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                <div className="text-white mb-2">Uploading...</div>
                <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="relative z-10">
          {!backgroundImage && !isEditingHeader && (
            <span className="text-4xl" style={{ color: useGoldText ? theme.colors.primary : theme.colors.secondary }}>
              {board.name.charAt(0).toUpperCase()}
            </span>
          )}
          {backgroundImage && !isEditingHeader && (
            <h3 className="text-xl font-bold px-4 text-center text-white drop-shadow-lg">
              {board.name}
            </h3>
          )}
        </div>
      </div>
      
      <div className="p-4" onClick={(e) => e.stopPropagation()}>
        {!backgroundImage && (
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium truncate" style={{ color: theme.colors.text.primary }}>{board.name}</h3>
            <div className="flex items-center gap-1">
              {board.isStarred && (
                <Star className="w-4 h-4 fill-current" style={{ color: theme.colors.warning }} />
              )}
              {board.isArchived && (
                <Archive className="w-4 h-4" style={{ color: theme.colors.text.secondary }} />
              )}
            </div>
          </div>
        )}
        
        {board.description && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: theme.colors.text.secondary }}>
            {board.description}
          </p>
        )}

        {/* Project info */}
        {showProject && board.project && (
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: theme.colors.text.secondary }}>
            <Folder className="w-3 h-3" />
            <span>{board.project.name}</span>
          </div>
        )}

        {/* Department info */}
        {board.department && (
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: theme.colors.text.secondary }}>
            <Building2 className="w-3 h-3" />
            <span>{board.department.name}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm mb-3" style={{ color: theme.colors.text.secondary }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <List className="w-3 h-3" />
              {listCount}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount}
            </span>
            {taskCount > 0 && (
              <span className="text-xs">
                {taskCount} tasks
              </span>
            )}
          </div>
          <span className="px-2 py-1 rounded-full text-xs capitalize" 
                style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
            {board.visibility}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {board.members?.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: theme.colors.primary + '20', 
                  borderColor: theme.colors.background.paper,
                  color: theme.colors.primary 
                }}
                title={`${member.firstName} ${member.lastName}`}
              >
                {member.firstName?.charAt(0) || '?'}
              </div>
            ))}
            {memberCount > 3 && (
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                   style={{ 
                     backgroundColor: theme.colors.text.secondary + '20', 
                     borderColor: theme.colors.background.paper,
                     color: theme.colors.text.secondary 
                   }}>
                +{memberCount - 3}
              </div>
            )}
          </div>
          
          {(onDelete || onStar || onArchive || onEdit) && (
            <div className="relative group">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="p-1 rounded transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.colors.text.secondary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
                   style={{ 
                     backgroundColor: theme.colors.background.paper, 
                     borderColor: theme.colors.primary + '20' 
                   }}>
                {onEdit && (
                  <button
                    onClick={(e) => handleMenuClick(e, 'edit')}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-opacity-10 first:rounded-t-lg flex items-center gap-2 transition-colors"
                    style={{ color: theme.colors.text.primary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Board
                  </button>
                )}
                {onStar && (
                  <button
                    onClick={(e) => handleMenuClick(e, 'star')}
                    className="block w-full px-4 py-2 text-left text-sm transition-colors"
                    style={{ color: theme.colors.text.primary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {board.isStarred ? 'Remove from favorites' : 'Add to favorites'}
                  </button>
                )}
                {onArchive && (
                  <button
                    onClick={(e) => handleMenuClick(e, 'archive')}
                    className="block w-full px-4 py-2 text-left text-sm transition-colors"
                    style={{ color: theme.colors.text.primary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {board.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => handleMenuClick(e, 'delete')}
                    className="block w-full px-4 py-2 text-left text-sm last:rounded-b-lg transition-colors"
                    style={{ color: theme.colors.error }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.error + '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Delete Board
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return <CardContent />;
};

// Named export for easier importing
export { BoardCard };
export default BoardCard;
