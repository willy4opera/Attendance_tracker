import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import groupService from '../../../services/groupService';
import theme from '../../../config/theme';
import Swal from 'sweetalert2';
import { 
  FaTh, 
  FaList, 
  FaUsers, 
  FaUserCheck, 
  FaCrown, 
  FaShieldAlt, 
  FaArrowLeft,
  FaEnvelope,
  FaCalendar,
  FaHistory
} from 'react-icons/fa';
import type { GroupWithMembers, GroupMember } from '../../../types';
import GroupDetailsHeader from '../../../components/GroupDetailsHeader';
import EditGroupModal from "./EditGroupModal";
import AddMemberModal from "./AddMemberModal";

const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const getDepartmentName = (department: string | { id: string; name: string; code: string } | undefined): string | undefined => {
    if (!department) return undefined;
    if (typeof department === "string") return department;
    return department.name;
  };

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const handleEditGroup = () => {
    setShowEditModal(true);
  };

  const handleManageMembers = () => {
    setShowAddMemberModal(true);
  };

  const handleModalSuccess = (updatedGroup: GroupWithMembers) => {
    setGroup(updatedGroup);
    setShowEditModal(false);
    setShowAddMemberModal(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) return;
      
      try {
        setLoading(true);
        const data = await groupService.getGroupWithMembers(groupId);
        setGroup(data);
      } catch (err) {
        console.error('Error fetching group details:', err);
        setError('Could not load group details.');
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load group details. Please try again.',
          icon: 'error',
          confirmButtonColor: theme.colors.error
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <FaCrown className="text-yellow-500 w-3 h-3 sm:w-4 sm:h-4" />;
      case 'moderator':
        return <FaShieldAlt className="text-blue-500 w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <FaUsers className="text-gray-500 w-3 h-3 sm:w-4 sm:h-4" />;
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
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-gray-900"></div>

        {/* Modals */}
        <EditGroupModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          groupId={groupId || ""}
          onSuccess={handleModalSuccess}
        />

        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          groupId={groupId || ""}
          onSuccess={handleModalSuccess}
        />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-8 px-4 sm:py-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Group not found</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">The group you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/admin/groups')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
        >
          Back to Groups
        </button>

        {/* Modals */}
        <EditGroupModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          groupId={groupId || ""}
          onSuccess={handleModalSuccess}
        />

        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          groupId={groupId || ""}
          onSuccess={handleModalSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {/* Group Details Header */}
        <div className="mb-4 sm:mb-6">
          <GroupDetailsHeader
            group={group}
            onEditGroup={handleEditGroup}
            onManageMembers={handleManageMembers}
            onBack={handleBack}
          />
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Members ({group.members?.length || 0})
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setView('grid')}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  view === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FaTh className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Grid</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FaList className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Members Display */}
        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {group.members?.map((member) => (
              <div key={member.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div 
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg"
                      style={{ backgroundColor: group.color || theme.colors.primary }}
                    >
                      {member.user?.firstName?.charAt(0) || '?'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {getRoleIcon(member.role)}
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {member.user?.firstName} {member.user?.lastName}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{member.user?.email}</p>
                    {member.user?.department && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="hidden sm:inline">Department: </span>
                        <span className="sm:hidden">Dept: </span>
                        {getDepartmentName(member.user.department)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 sm:mt-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                    {member.role}
                  </span>
                  <div className="text-xs text-gray-500 flex items-center">
                    <FaCalendar className="inline mr-1 w-3 h-3" />
                    <span className="hidden sm:inline">{new Date(member.joinedAt).toLocaleDateString()}</span>
                    <span className="sm:hidden">{new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {group.members?.map((member) => (
                <div key={member.id} className="p-3 sm:p-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div 
                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: group.color || theme.colors.primary }}
                      >
                        {member.user?.firstName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                          {getRoleIcon(member.role)}
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                            {member.user?.firstName} {member.user?.lastName}
                          </p>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{member.user?.email}</p>
                        {member.user?.department && (
                          <div className="text-xs text-gray-500 mt-1 sm:hidden">
                            Dept: {getDepartmentName(member.user.department)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col lg:flex-row items-start sm:items-end lg:items-center justify-between sm:justify-end gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
                      {member.user?.department && (
                        <div className="hidden sm:block lg:block text-xs text-gray-500">
                          {getDepartmentName(member.user.department)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                          {member.role}
                        </span>
                        <div className="text-xs text-gray-500 flex items-center">
                          <span className="hidden sm:inline">Joined </span>
                          <FaCalendar className="inline mr-1 w-3 h-3 sm:hidden" />
                          <span className="hidden sm:inline">{new Date(member.joinedAt).toLocaleDateString()}</span>
                          <span className="sm:hidden">{new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!group.members || group.members.length === 0) && (
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-lg">
            <FaUsers className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No members</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 px-4">Get started by adding members to this group.</p>
            <div className="mt-4 sm:mt-6">
              <button
                onClick={handleManageMembers}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <FaUserCheck className="-ml-1 mr-2 h-3 w-3 sm:h-5 sm:w-5" />
                Add Members
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <EditGroupModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          groupId={groupId || ""}
          onSuccess={handleModalSuccess}
        />

        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          groupId={groupId || ""}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default GroupDetailsPage;
