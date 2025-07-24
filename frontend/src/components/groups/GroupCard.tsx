import React from 'react';
import { 
  FaUsers, 
  FaEye, 
  FaLock, 
  FaGlobe,
  FaCalendar,
} from 'react-icons/fa';
import { AiOutlineTeam } from 'react-icons/ai';
import theme from '../../config/theme';
import type { Group } from '../../types';

interface GroupCardProps {
  group: Group;
  view: 'grid' | 'list';
  onClick: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, view, onClick }) => {
  const getDepartmentName = (department: string | { id: string; name: string; code: string } | undefined): string => {
    if (!department) return 'No Department';
    if (typeof department === 'string') return department;
    return department.name;
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <FaGlobe className="w-4 h-4 text-green-500" />;
      case 'private':
        return <FaLock className="w-4 h-4 text-red-500" />;
      case 'invite-only':
        return <FaEye className="w-4 h-4 text-yellow-500" />;
      default:
        return <FaGlobe className="w-4 h-4 text-green-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (view === 'list') {
    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Group Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                {getVisibilityIcon(group.visibility || 'public')}
                {!group.isActive && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                {group.description || 'No description available'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FaUsers className="w-3 h-3" />
                  {group.membersCount || 0} members
                </span>
                <span className="flex items-center gap-1">
                  <FaCalendar className="w-3 h-3" />
                  Created {formatDate(group.createdAt)}
                </span>
                <span>{getDepartmentName(group.department)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="px-3 py-1 text-sm rounded-md transition-colors hover:opacity-90"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.primary
                }}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view - Fixed the positioning and hover issues
  return (
    <div 
      onClick={onClick}
      className="relative bg-white rounded-lg border hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {group.name}
            </h3>
            {getVisibilityIcon(group.visibility || 'public')}
          </div>
          {!group.isActive && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
              Inactive
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
          {group.description || 'No description available'}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <FaUsers className="w-3 h-3" />
            {group.membersCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <AiOutlineTeam className="w-3 h-3" />
            {group.adminsCount || 0} admin{(group.adminsCount || 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="px-6 py-3 border-t"
        style={{ backgroundColor: theme.colors.primary + '10' }}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {getDepartmentName(group.department)}
          </span>
          <span className="text-gray-500">
            {formatDate(group.createdAt)}
          </span>
        </div>
      </div>

      {/* Hover action overlay - Fixed positioning and visibility behavior */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="px-4 py-2 rounded-md transition-all duration-200 transform scale-95 group-hover:scale-100"
          style={{
            backgroundColor: theme.colors.secondary,
            color: theme.colors.primary,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default GroupCard;
