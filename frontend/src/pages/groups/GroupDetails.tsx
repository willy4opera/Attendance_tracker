import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaArrowLeft,
  FaCalendar,
  FaCrown,
  FaShieldAlt,
  FaEnvelope,
  FaGlobe,
  FaLock,
  FaEye,
  FaSignOutAlt,
  FaSignInAlt
} from 'react-icons/fa';
import userGroupService from '../../services/userGroupService';
import groupService from '../../services/groupService';
import theme from '../../config/theme';
import notify from '../../utils/notifications';
import type { Group } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: string;
  joinedAt: string;
  addedBy: number;
  isActive: boolean;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  addedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface GroupWithMembers extends Group {
  members?: GroupMember[];
}

const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
      checkMembership();
    }
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const groupData = await groupService.getGroup(id!);
      const membersData = await userGroupService.getGroupMembers(parseInt(id!));
      
      setGroup(groupData);
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError('Failed to load group details');
      notify.toast.error('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    try {
      // This would need a specific API endpoint to check membership
      // For now, we'll assume user has access if they can view the page
      setIsMember(true);
      setUserRole('member');
    } catch (err) {
      console.error('Error checking membership:', err);
    }
  };

  const handleJoinGroup = async () => {
    if (!id) return;
    
    try {
      setActionLoading(true);
      await userGroupService.joinGroup(parseInt(id));
      notify.toast.success('Successfully joined the group!');
      setIsMember(true);
      setUserRole('member');
      // Refresh group details to get updated member count
      fetchGroupDetails();
    } catch (err) {
      console.error('Error joining group:', err);
      notify.toast.error('Failed to join group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!id) return;
    
    try {
      setActionLoading(true);
      await userGroupService.leaveGroup(parseInt(id));
      notify.toast.success('Successfully left the group');
      setIsMember(false);
      setUserRole(null);
      // Refresh group details to get updated member count
      fetchGroupDetails();
    } catch (err) {
      console.error('Error leaving group:', err);
      notify.toast.error('Failed to leave group');
    } finally {
      setActionLoading(false);
    }
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaCrown className="text-yellow-500 w-4 h-4" />;
      case 'moderator':
        return <FaShieldAlt className="text-blue-500 w-4 h-4" />;
      default:
        return <FaUsers className="text-gray-500 w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-yellow-100 text-yellow-800',
      moderator: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800'
    };
    return badges[role as keyof typeof badges] || badges.member;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Group not found</h2>
            <p className="text-gray-600 mb-8">The group you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/groups/my-groups')}
              className="px-4 py-2 rounded-lg transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary
              }}
            >
              Back to My Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                  {getVisibilityIcon(group.visibility || 'public')}
                  {!group.isActive && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">
                  {group.description || 'No description available'}
                </p>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FaUsers className="w-4 h-4" />
                    {group.membersCount || members.length || 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCalendar className="w-4 h-4" />
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isMember ? (
                  <button
                    onClick={handleLeaveGroup}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    {actionLoading ? 'Leaving...' : 'Leave Group'}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinGroup}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      color: theme.colors.primary
                    }}
                  >
                    <FaSignInAlt className="w-4 h-4" />
                    {actionLoading ? 'Joining...' : 'Join Group'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Members ({members.length})
          </h3>

          {members.length === 0 ? (
            <div className="text-center py-8">
              <FaUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
              <p className="text-gray-500">This group doesn't have any members yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {member.user.profilePicture ? (
                        <img
                          src={member.user.profilePicture}
                          alt={`${member.user.firstName} ${member.user.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          {member.user.firstName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                    <div className="text-xs text-gray-500 flex items-center">
                      <FaCalendar className="inline mr-1 w-3 h-3" />
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
