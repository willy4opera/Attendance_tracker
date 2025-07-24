import React from 'react';
import { 
  PencilIcon, 
  UserPlusIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import theme from '../config/theme';
import type { GroupWithMembers } from '../types';

interface GroupDetailsHeaderProps {
  group: GroupWithMembers;
  onEditGroup: () => void;
  onManageMembers: () => void;
  onBack: () => void;
}

const GroupDetailsHeader: React.FC<GroupDetailsHeaderProps> = ({
  group,
  onEditGroup,
  onManageMembers,
  onBack
}) => {
  const buttonBaseClass = "px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 transform hover:scale-105 text-xs sm:text-sm";
  
  const primaryButtonStyle = {
    backgroundColor: theme.colors.secondary,
    color: theme.colors.primary,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, isEntering: boolean) => {
    if (isEntering) {
      e.currentTarget.style.backgroundColor = theme.colors.primary;
      e.currentTarget.style.color = theme.colors.secondary;
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
    } else {
      e.currentTarget.style.backgroundColor = theme.colors.secondary;
      e.currentTarget.style.color = theme.colors.primary;
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
      {/* Header with gradient background */}
      <div 
        className="relative p-4 sm:p-6 pb-3 sm:pb-4 rounded-2xl mb-4 sm:mb-6"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)`
        }}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-32 sm:h-32 opacity-10">
          <div 
            className="w-full h-full rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
        </div>
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          {/* Left Section - Group Info */}
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={onBack}
              className="p-2 sm:p-3 rounded-xl transition-all duration-200 hover:scale-110 flex-shrink-0"
              style={{
                backgroundColor: theme.colors.primary + '20',
                color: theme.colors.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
                e.currentTarget.style.color = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary + '20';
                e.currentTarget.style.color = theme.colors.primary;
              }}
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Group Color Indicator */}
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0"
                style={{ backgroundColor: group.color || theme.colors.primary }}
              >
                {group.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold truncate" style={{ color: theme.colors.primary }}>
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-sm sm:text-lg opacity-80 mt-1 line-clamp-2 sm:line-clamp-1" style={{ color: theme.colors.primary }}>
                    {group.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <span 
                    className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                    style={{
                      backgroundColor: theme.colors.primary + '20',
                      color: theme.colors.primary
                    }}
                  >
                    {group.members?.length || 0} members
                  </span>
                  <span 
                    className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium capitalize"
                    style={{
                      backgroundColor: theme.colors.primary + '20',
                      color: theme.colors.primary
                    }}
                  >
                    {group.settings?.visibility || 'private'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onEditGroup}
              className={`${buttonBaseClass} flex-1 sm:flex-none justify-center sm:justify-start`}
              style={primaryButtonStyle}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Edit Group</span>
              <span className="xs:hidden">Edit</span>
            </button>
            
            <button
              onClick={onManageMembers}
              className={`${buttonBaseClass} flex-1 sm:flex-none justify-center sm:justify-start`}
              style={primaryButtonStyle}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              <UserPlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Add Member</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="text-center p-3 sm:p-4 rounded-xl" style={{ backgroundColor: theme.colors.primary + '05' }}>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: theme.colors.primary }}>
            {group.members?.length || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Total Members</div>
        </div>
        
        <div className="text-center p-3 sm:p-4 rounded-xl" style={{ backgroundColor: theme.colors.primary + '05' }}>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: theme.colors.primary }}>
            {group.members?.filter(m => m.role === 'admin').length || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Admins</div>
        </div>
        
        <div className="text-center p-3 sm:p-4 rounded-xl" style={{ backgroundColor: theme.colors.primary + '05' }}>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: theme.colors.primary }}>
            {group.members?.filter(m => m.role === 'moderator').length || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Moderators</div>
        </div>
        
        <div className="text-center p-3 sm:p-4 rounded-xl col-span-2 sm:col-span-1" style={{ backgroundColor: theme.colors.primary + '05' }}>
          <div className="text-lg sm:text-2xl font-bold" style={{ color: theme.colors.primary }}>
            {new Date(group.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: window.innerWidth < 640 ? undefined : 'numeric'
            })}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Created</div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsHeader;
