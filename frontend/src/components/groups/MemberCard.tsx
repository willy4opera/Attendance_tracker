import React, { useState } from 'react';
import { 
  FaCrown, 
  FaUser, 
  FaEnvelope, 
  FaCalendar,
  FaEllipsisV,
  FaTrash,
  FaUserShield
} from 'react-icons/fa';
import theme from '../../config/theme';
import type { GroupMember } from '../../types';

interface MemberCardProps {
  member: GroupMember;
  onClick?: () => void;
  showActions?: boolean;
  onRemove?: () => void;
  onUpdateRole?: (role: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onClick,
  showActions = false,
  onRemove,
  onUpdateRole
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getDepartmentName = (department: string | { id: string; name: string; code: string } | undefined): string => {
    if (!department) return 'No Department';
    if (typeof department === 'string') return department;
    return department.name;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaCrown className="w-3 h-3 text-yellow-500" />;
      case 'moderator':
        return <FaUserShield className="w-3 h-3 text-blue-500" />;
      default:
        return <FaUser className="w-3 h-3 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg border p-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      {/* Header with actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          <div className="relative">
            {member.user?.profilePicture ? (
              <img
                src={member.user.profilePicture}
                alt={`${member.user.firstName} ${member.user.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
              </div>
            )}
            
            {/* Online status indicator */}
            {member.isActive && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
        </div>

        {/* Actions dropdown */}
        {showActions && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <FaEllipsisV className="w-3 h-3" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {member.role !== 'admin' && onUpdateRole && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateRole('admin');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaCrown className="w-3 h-3" />
                      Make Admin
                    </button>
                  )}
                  
                  {member.role === 'admin' && onUpdateRole && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateRole('member');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaUser className="w-3 h-3" />
                      Make Member
                    </button>
                  )}

                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <FaTrash className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Info */}
      <div className="space-y-2">
        <div>
          <h4 className="font-medium text-gray-900">
            {member.user?.firstName} {member.user?.lastName}
          </h4>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <FaEnvelope className="w-3 h-3" />
            {member.user?.email}
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
            {getRoleIcon(member.role)}
            {member.role}
          </span>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-center gap-1">
            <FaCalendar className="w-3 h-3" />
            Joined {formatDate(member.joinedAt)}
          </p>
          {member.user?.department && (
            <p>{getDepartmentName(member.user.department)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
