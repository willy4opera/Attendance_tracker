import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MoreHorizontal, 
  Users, 
  List, 
  Archive, 
  Star, 
  StarOff,
  Folder,
  Building2
} from 'lucide-react';
import type { Board } from '../../types';

interface BoardCardProps {
  board: Board;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onStar?: (id: string) => void;
  onArchive?: (id: string) => void;
  showProject?: boolean;
}

const BoardCard: React.FC<BoardCardProps> = ({ 
  board, 
  viewMode = 'grid',
  onClick,
  onDelete, 
  onStar, 
  onArchive,
  showProject = true
}) => {
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
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const backgroundColor = board.backgroundColor || '#0079BF';
  const memberCount = board.members?.length || 0;
  const listCount = board.stats?.listCount || 0;
  const taskCount = board.stats?.taskCount || 0;

  const CardContent = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="h-24 flex items-center justify-center text-white font-bold text-2xl"
        style={{ backgroundColor }}
      >
        {board.name.charAt(0).toUpperCase()}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 truncate">{board.name}</h3>
          <div className="flex items-center gap-1">
            {board.isStarred && (
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            )}
            {board.isArchived && (
              <Archive className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        
        {board.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{board.description}</p>
        )}

        {/* Project info */}
        {showProject && board.project && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Folder className="w-3 h-3" />
            <span>{board.project.name}</span>
          </div>
        )}

        {/* Department info */}
        {board.department && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Building2 className="w-3 h-3" />
            <span>{board.department.name}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
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
          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">
            {board.visibility}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {board.members?.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium"
                title={`${member.firstName} ${member.lastName}`}
              >
                {member.firstName?.charAt(0) || '?'}
              </div>
            ))}
            {memberCount > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                +{memberCount - 3}
              </div>
            )}
          </div>
          
          {(onDelete || onStar || onArchive) && (
            <div className="relative group">
              <button 
                onClick={(e) => e.preventDefault()}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {onStar && (
                  <button
                    onClick={(e) => handleMenuClick(e, 'star')}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                  >
                    {board.isStarred ? 'Remove from favorites' : 'Add to favorites'}
                  </button>
                )}
                {onArchive && (
                  <button
                    onClick={(e) => handleMenuClick(e, 'archive')}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {board.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => handleMenuClick(e, 'delete')}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
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

  if (onClick) {
    return (
      <div onClick={handleCardClick} className="cursor-pointer">
        <CardContent />
      </div>
    );
  }

  return (
    <Link to={`/boards/${board.id}`} className="block">
      <CardContent />
    </Link>
  );
};

// Named export for easier importing
export { BoardCard };
export default BoardCard;
