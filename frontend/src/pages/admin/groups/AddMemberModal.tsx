import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  UserPlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import groupService from '../../../services/groupService';
import type { GroupWithMembers, AddGroupMemberDto } from '../../../types';
import type { User as ServiceUser } from '../../../services/userService';
import theme from '../../../config/theme';
import Swal from 'sweetalert2';
import UserSelection from '../../../components/UserSelection';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onSuccess: (group: GroupWithMembers) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onSuccess
}) => {
  const [selectedUsers, setSelectedUsers] = useState<ServiceUser[]>([]);
  const [currentMembers, setCurrentMembers] = useState<ServiceUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupWithMembers | null>(null);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupDetails();
    }
  }, [isOpen, groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const group = await groupService.getGroupWithMembers(groupId);
      setGroupInfo(group);

      // Convert group members to ServiceUser format
      const members: ServiceUser[] = group.members?.map(member => ({
        id: member.user?.id || member.id,
        email: member.user?.email || '',
        firstName: member.user?.firstName || '',
        lastName: member.user?.lastName || '',
        phoneNumber: member.user?.phoneNumber,
        role: member.user?.role || 'user',
        department: member.user?.department,
        status: member.user?.isActive ? 'active' : 'inactive',
        emailVerified: member.user?.isEmailVerified || false,
        lastLogin: member.user?.lastLogin,
        createdAt: member.user?.createdAt || '',
        updatedAt: member.user?.updatedAt || ''
      })) || [];

      setCurrentMembers(members);
      setSelectedUsers([]); // Start with no new selections
    } catch (error) {
      console.error('Error fetching group details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load group details. Please try again.',
        confirmButtonColor: theme.colors.primary
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Members Selected',
        text: 'Please select at least one member to add to the group.',
        confirmButtonColor: theme.colors.primary,
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Add Members?',
      html: `
        <div style="text-align: left;">
          <p><strong>Group:</strong> ${groupInfo?.name}</p>
          <p><strong>Members to Add:</strong> ${selectedUsers.length}</p>
          <div style="margin-top: 12px;">
            <strong>New Members:</strong>
            <ul style="margin-top: 8px; padding-left: 20px;">
              ${selectedUsers.map(user => `<li>${user.firstName} ${user.lastName} (${user.email})</li>`).join('')}
            </ul>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: theme.colors.secondary,
      cancelButtonColor: theme.colors.primary,
      confirmButtonText: 'Yes, add them!',
      cancelButtonText: 'Cancel',
      background: theme.colors.background?.paper,
      color: theme.colors.text?.primary
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add all selected members
      await Promise.all(
        selectedUsers.map(user => 
          groupService.addMember(groupId, { 
            userId: user.id, 
            role: 'member' 
          } as AddGroupMemberDto)
        )
      );

      // Fetch updated group data
      const updatedGroup = await groupService.getGroupWithMembers(groupId);

      Swal.fire({
        icon: 'success',
        title: 'Members Added!',
        text: `Successfully added ${selectedUsers.length} member(s) to the group.`,
        showConfirmButton: false,
        timer: 2000,
        background: theme.colors.background?.paper,
        color: theme.colors.text?.primary,
        iconColor: theme.colors.primary,
      });

      onSuccess(updatedGroup);
      handleClose();
    } catch (error: any) {
      console.error('Error adding members:', error);
      
      let errorMessage = 'Failed to add members. Please try again.';
      let errorTitle = 'Error';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorTitle = 'Validation Error';
          errorMessage = error.response.data?.message || 'Some members could not be added.';
        } else if (error.response.status === 401) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.response.status === 403) {
          errorTitle = 'Permission Denied';
          errorMessage = 'You do not have permission to add members to this group.';
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: theme.colors.primary,
        background: theme.colors.background?.paper,
        color: theme.colors.text?.primary,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUsers([]);
      setCurrentMembers([]);
      setGroupInfo(null);
      onClose();
    }
  };

  // Filter out current members from selection
  const filterCurrentMembers = (users: ServiceUser[]) => {
    const currentMemberIds = new Set(currentMembers.map(m => m.id));
    return users.filter(user => !currentMemberIds.has(user.id));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" onClick={handleClose} />
          
          <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
            {/* Header */}
            <div 
              className="relative p-6 pb-4 flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)`
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <UserGroupIcon className="w-full h-full" style={{ color: theme.colors.primary }} />
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: theme.colors.primary + '20' }}
                  >
                    <UserPlusIcon className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      Add Members
                    </h2>
                    <p className="text-sm opacity-80" style={{ color: theme.colors.primary }}>
                      {groupInfo ? `Add new members to "${groupInfo.name}"` : 'Add new members to the group'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full transition-all duration-200 hover:scale-110"
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
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                <span className="ml-3 text-gray-600">Loading group details...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white">
                {/* Current Members Info */}
                {groupInfo && (
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Current Members: {currentMembers.length}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Select new users to add to the group (existing members are excluded)
                        </p>
                      </div>
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: groupInfo.color || theme.colors.primary }}
                      >
                        {groupInfo.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}

                {/* User Selection */}
                <div className="p-6">
                  <UserSelection 
                    selectedUsers={filterCurrentMembers(selectedUsers)}
                    onUsersChange={(users) => setSelectedUsers(filterCurrentMembers(users))}
                    maxUsers={50}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: theme.colors.primary + '20' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl font-medium transition-all duration-200"
                    style={{
                      backgroundColor: theme.colors.primary + '10',
                      color: theme.colors.secondary
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedUsers.length === 0}
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      color: theme.colors.primary,
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-5 w-5" />
                        Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddMemberModal;
