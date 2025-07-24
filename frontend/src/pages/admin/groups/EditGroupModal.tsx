import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PencilIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import groupService from '../../../services/groupService';
import type { GroupWithMembers, UpdateGroupDto, User } from '../../../types';
import type { User as ServiceUser } from '../../../services/userService';
import theme from '../../../config/theme';
import Swal from 'sweetalert2';
import UserSelection from '../../../components/UserSelection';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onSuccess: (group: GroupWithMembers) => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onSuccess
}) => {
  const [formData, setFormData] = useState<UpdateGroupDto>({
    name: '',
    description: '',
    color: '#3b82f6',
    settings: {
      allowSelfJoin: false,
      requireApproval: true,
      visibility: 'private'
    }
  });

  const [selectedUsers, setSelectedUsers] = useState<ServiceUser[]>([]);
  const [originalMembers, setOriginalMembers] = useState<ServiceUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupDetails();
    }
  }, [isOpen, groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const group = await groupService.getGroupWithMembers(groupId);
      
      setFormData({
        name: group.name,
        description: group.description || '',
        color: group.color || '#3b82f6',
        settings: {
          allowSelfJoin: group.settings?.allowSelfJoin || false,
          requireApproval: group.settings?.requireApproval || true,
          visibility: group.settings?.visibility || 'private'
        }
      });

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

      setSelectedUsers(members);
      setOriginalMembers(members);
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

  const handleFormChange = (field: keyof UpdateGroupDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields',
        confirmButtonColor: theme.colors.primary,
        background: theme.colors.background?.paper,
        color: theme.colors.text?.primary,
      });
      return;
    }

    // Calculate member changes
    const originalMemberIds = new Set(originalMembers.map(m => m.id));
    const selectedMemberIds = new Set(selectedUsers.map(m => m.id));
    
    const membersToAdd = selectedUsers.filter(u => !originalMemberIds.has(u.id));
    const membersToRemove = originalMembers.filter(u => !selectedMemberIds.has(u.id));

    const confirmResult = await Swal.fire({
      title: 'Update Group?',
      html: `
        <div style="text-align: left;">
          <p><strong>Name:</strong> ${formData.name}</p>
          ${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}
          <p><strong>Visibility:</strong> ${formData.settings?.visibility}</p>
          <p><strong>Total Members:</strong> ${selectedUsers.length}</p>
          ${membersToAdd.length > 0 ? `<p><strong>Members to Add:</strong> ${membersToAdd.length}</p>` : ''}
          ${membersToRemove.length > 0 ? `<p><strong>Members to Remove:</strong> ${membersToRemove.length}</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: theme.colors.secondary,
      cancelButtonColor: theme.colors.primary,
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel',
      background: theme.colors.background?.paper,
      color: theme.colors.text?.primary
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update group basic info
      const updatedGroup = await groupService.updateGroup(groupId, formData);

      // Handle member changes
      if (membersToAdd.length > 0) {
        await Promise.all(
          membersToAdd.map(user => 
            groupService.addMember(groupId, { userId: user.id, role: 'member' })
          )
        );
      }

      if (membersToRemove.length > 0) {
        await Promise.all(
          membersToRemove.map(user => 
            groupService.removeMember(groupId, user.id)
          )
        );
      }

      // Fetch updated group data
      const finalGroup = await groupService.getGroupWithMembers(groupId);

      Swal.fire({
        icon: 'success',
        title: 'Group Updated!',
        text: `Group has been updated successfully with ${selectedUsers.length} members.`,
        showConfirmButton: false,
        timer: 2000,
        background: theme.colors.background?.paper,
        color: theme.colors.text?.primary,
        iconColor: theme.colors.primary,
      });

      onSuccess(finalGroup);
      handleClose();
    } catch (error: any) {
      console.error('Error updating group:', error);
      
      let errorMessage = 'Failed to update group. Please try again.';
      let errorTitle = 'Error';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorTitle = 'Validation Error';
          errorMessage = error.response.data?.message || 'Please check your input and try again.';
        } else if (error.response.status === 401) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.response.status === 403) {
          errorTitle = 'Permission Denied';
          errorMessage = 'You do not have permission to update this group.';
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
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        settings: {
          allowSelfJoin: false,
          requireApproval: true,
          visibility: 'private'
        }
      });
      setSelectedUsers([]);
      setOriginalMembers([]);
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" onClick={handleClose} />
          
          <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
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
                    <PencilIcon className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      Edit Group
                    </h2>
                    <p className="text-sm opacity-80" style={{ color: theme.colors.primary }}>
                      Update group details and manage members
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
                <div className="flex">
                  {/* Left Panel - Basic Information */}
                  <div className="w-1/2 px-6 py-4 border-r border-gray-200">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                        
                        {/* Group Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Group Name *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 ${
                              errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            style={{ focusRingColor: theme.colors.primary }}
                            placeholder="Enter group name"
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={formData.description || ''}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                            style={{ focusRingColor: theme.colors.primary }}
                            placeholder="Describe the purpose of this group"
                          />
                        </div>

                        {/* Color Picker */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Group Color
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={formData.color || '#3b82f6'}
                              onChange={(e) => handleFormChange('color', e.target.value)}
                              className="w-12 h-10 rounded border border-gray-300"
                            />
                            <span className="text-sm text-gray-500">
                              Choose a color to identify this group
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Group Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Group Settings</h3>
                        
                        {/* Visibility */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Visibility
                          </label>
                          <select
                            value={formData.settings?.visibility || 'private'}
                            onChange={(e) => handleSettingsChange('visibility', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50"
                            style={{ focusRingColor: theme.colors.primary }}
                          >
                            <option value="private">Private</option>
                            <option value="public">Public</option>
                            <option value="invite-only">Invite Only</option>
                          </select>
                        </div>

                        {/* Settings Checkboxes */}
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.settings?.requireApproval || false}
                              onChange={(e) => handleSettingsChange('requireApproval', e.target.checked)}
                              className="rounded"
                              style={{ accentColor: theme.colors.primary }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Require approval to join</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.settings?.allowSelfJoin || false}
                              onChange={(e) => handleSettingsChange('allowSelfJoin', e.target.checked)}
                              className="rounded"
                              style={{ accentColor: theme.colors.primary }}
                            />
                            <span className="ml-2 text-sm text-gray-700">Allow members to join without invitation</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Member Management */}
                  <div className="w-1/2 bg-gray-50">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Members</h3>
                      <UserSelection 
                        selectedUsers={selectedUsers} 
                        onUsersChange={setSelectedUsers} 
                        maxUsers={100} 
                      />
                    </div>
                  </div>
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
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      color: theme.colors.primary,
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-5 w-5" />
                        Update Group ({selectedUsers.length} members)
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

export default EditGroupModal;
