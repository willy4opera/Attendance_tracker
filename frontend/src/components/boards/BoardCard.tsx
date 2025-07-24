import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Calendar, 
  Users, 
  List, CheckSquare, 
  Archive, 
  Star, 
  StarOff,
  Folder,
  Building2,
  Edit,
  Image as ImageIcon,
  Save,
  X,
  Upload,
  Trash2
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
  const [showMenu, setShowMenu] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(board.backgroundImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleMenuClick = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    
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
      onClick();
    } else {
      navigate(`/boards/${board.id}`);
    }
  };

  const handleEditHeader = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingHeader(true);
  };

  const handleCancelHeader = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditingHeader(false);
    setHeaderImage(board.backgroundImage || null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const uploadedUrl = await cloudinaryService.uploadBoardImage(file, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });

      setHeaderImage(uploadedUrl);
      
      // If we have onUpdate, update the board
      if (onUpdate) {
        await onUpdate(board.id.toString(), { backgroundImage: uploadedUrl });
      }
      
      // If we have onImageUpdate, call it
      if (onImageUpdate) {
        onImageUpdate(board.id.toString(), uploadedUrl);
      }

      setIsEditingHeader(false);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setHeaderImage(null);
      
      // If we have onUpdate, update the board
      if (onUpdate) {
        await onUpdate(board.id.toString(), { backgroundImage: null });
      }
      
      // If we have onImageUpdate, call it
      if (onImageUpdate) {
        onImageUpdate(board.id.toString(), null);
      }

      setIsEditingHeader(false);
    } catch (error) {
      console.error('Failed to remove image:', error);
      alert('Failed to remove image. Please try again.');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const memberCount = board.members?.length || 0;
  const listCount = board.lists?.length || 0;
  const taskCount = board.stats?.taskCount || 0;
  const backgroundImage = headerImage || board.backgroundImage;

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
        style={{ borderColor: theme.colors.primary + '20' }}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              board.isArchived ? 'opacity-50' : ''
            }`}
            style={{ 
              backgroundColor: backgroundImage ? 'transparent' : (board.backgroundColor || theme.colors.primary + '20'),
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              {!backgroundImage && <Folder className="w-6 h-6" style={{ color: theme.colors.primary }} />}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium" style={{ color: theme.colors.text.primary }}>
                {board.name}
                {board.isStarred && <Star className="inline-block w-4 h-4 ml-2" style={{ color: theme.colors.warning }} />}
              </h3>
              {board.description && (
                <p className="text-sm mt-1 line-clamp-1" style={{ color: theme.colors.text.secondary }}>
                  {board.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 text-sm" style={{ color: theme.colors.text.secondary }}>
              <span className="flex items-center">
                <CheckSquare className="w-4 h-4 mr-1" />
                {taskCount} tasks
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {memberCount} members
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(board.updatedAt)}
              </span>
            </div>

            {(onDelete || onStar || onArchive || onEdit) && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(!showMenu);
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
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-50"
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
                        className="block w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2"
                        style={{ color: theme.colors.text.primary }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {board.isStarred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                        {board.isStarred ? 'Remove from favorites' : 'Add to favorites'}
                      </button>
                    )}
                    {onArchive && (
                      <button
                        onClick={(e) => handleMenuClick(e, 'archive')}
                        className="block w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2"
                        style={{ color: theme.colors.text.primary }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Archive className="w-4 h-4" />
                        {board.isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => handleMenuClick(e, 'delete')}
                        className="block w-full px-4 py-2 text-left text-sm last:rounded-b-lg transition-colors flex items-center gap-2"
                        style={{ color: theme.colors.error }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.error + '10';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Board
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className={`rounded-lg shadow-sm border transition-all duration-200 hover:shadow-lg cursor-pointer group ${
        board.isArchived ? 'opacity-75' : ''
      }`}
      style={{ 
        borderColor: theme.colors.primary + '20',
        backgroundColor: theme.colors.background.paper
      }}
      onClick={handleCardClick}
    >
      {/* Header with background image */}
      <div 
        className="h-32 rounded-t-lg relative overflow-hidden"
        style={{ 
          backgroundColor: backgroundImage ? 'transparent' : (board.backgroundColor || theme.colors.primary + '20'),
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
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-30">
            <div className="flex flex-col items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.secondary
                  }}
                >
                  <Upload className="h-3 w-3" />
                  {isUploading ? `${uploadProgress}%` : 'Upload'}
                </button>
                
                {headerImage && (
                  <button
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: theme.colors.error,
                      color: 'white'
                    }}
                  >
                    Remove
                  </button>
                )}
                
                <button
                  onClick={handleCancelHeader}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: theme.colors.text.secondary,
                    color: 'white'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Starred indicator */}
        {board.isStarred && (
          <div className="absolute top-2 left-2 z-10">
            <Star className="w-5 h-5" style={{ color: theme.colors.warning }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" style={{ color: theme.colors.text.primary }}>
              {board.name}
            </h3>
            {board.description && (
              <p className="text-sm line-clamp-2" style={{ color: theme.colors.text.secondary }}>
                {board.description}
              </p>
            )}
          </div>
          
          {board.isArchived && (
            <Archive className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: theme.colors.text.secondary }} />
          )}
        </div>

        {/* Project info */}
        {showProject && board.project && (
          <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: theme.colors.text.secondary }}>
            <Building2 className="w-4 h-4" />
            <span>{board.project.name}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm" style={{ color: theme.colors.text.secondary }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center">
              <CheckSquare className="w-4 h-4 mr-1" />
              {taskCount}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(board.updatedAt)}
            </span>
          </div>

          {/* Members avatars */}
          <div className="flex -space-x-2">
            {board.members?.slice(0, 3).map((member, index) => (
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
            <div className="relative ml-2" ref={menuRef}>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
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
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border z-50"
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
                      className="block w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {board.isStarred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                      {board.isStarred ? 'Remove from favorites' : 'Add to favorites'}
                    </button>
                  )}
                  {onArchive && (
                    <button
                      onClick={(e) => handleMenuClick(e, 'archive')}
                      className="block w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Archive className="w-4 h-4" />
                      {board.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => handleMenuClick(e, 'delete')}
                      className="block w-full px-4 py-2 text-left text-sm last:rounded-b-lg transition-colors flex items-center gap-2"
                      style={{ color: theme.colors.error }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.error + '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Board
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Named export for easier importing
export { BoardCard };
export default BoardCard;
