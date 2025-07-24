import React, { useState } from 'react';
import { 
  XMarkIcon, 
  PlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import groupService from '../../../services/groupService';
import type { CreateGroupDto } from '../../../types';
import type { User } from '../../../services/userService';
import theme from '../../../config/theme';
import Swal from 'sweetalert2';
import UserSelection from '../../../components/UserSelection';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (group: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateGroupDto>({
    name: '',
    description: '',
    color: '#3b82f6',
    settings: {
      allowSelfJoin: false,
      requireApproval: true,
      visibility: 'private'
    },
    metadata: {
      tags: []
    }
  });

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormChange = (field: keyof CreateGroupDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      });
      return;
    }

    // Show confirmation dialog
    const confirmResult = await Swal.fire({
      title: 'Create Group?',
      html: `
        <div style="text-align: left;">
          <p><strong>Name:</strong> ${formData.name}</p>
          ${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}
          <p><strong>Visibility:</strong> ${formData.settings?.visibility}</p>
          <p><strong>Require Approval:</strong> ${formData.settings?.requireApproval ? 'Yes' : 'No'}</p>
          <p><strong>Members:</strong> ${selectedUsers.length} selected</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: theme.colors.secondary,
      cancelButtonColor: theme.colors.primary,
      confirmButtonText: 'Yes, create it!',
      cancelButtonText: 'Cancel',
      background: theme.colors.background.paper,
      color: theme.colors.text.primary
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add selected users to the form data
      const groupData = {
        ...formData,
        members: selectedUsers.map(user => user.id)
      };

      const result = await groupService.createGroup(groupData);

      Swal.fire({
        icon: 'success',
        title: 'Group Created!',
        text: `Your group has been created successfully with ${selectedUsers.length} members.`,
        showConfirmButton: false,
        timer: 2000,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        iconColor: theme.colors.primary,
        customClass: {
          popup: 'rounded-2xl'
        }
      });

      onSuccess(result);
      handleClose();
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      let errorMessage = 'Failed to create group. Please try again.';
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
          errorMessage = 'You do not have permission to create groups.';
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: theme.colors.primary,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
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
        },
        metadata: {
          tags: []
        }
      });
      setSelectedUsers([]);
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
            {/* Header with gradient */}
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
                    <PlusIcon className="w-6 h-6" style={{ color: theme.colors.primary }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      Create New Group
                    </h2>
                    <p className="text-sm opacity-80" style={{ color: theme.colors.primary }}>
                      Create a group to organize team members
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

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="bg-white">
              <div className="flex">
                {/* Left Panel - Basic Information */}
                <div className="w-1/2 px-6 py-4 border-r border-gray-200">
                  <div className="space-y-6">
                    {/* Basic Information */}
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

                {/* Right Panel - User Selection */}
                <div className="w-1/2 bg-gray-50">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Members</h3>
                    <UserSelection 
                      selectedUsers={selectedUsers} 
                      onUsersChange={setSelectedUsers} 
                      maxUsers={50} 
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary + '20'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.primary + '10'
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
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = theme.colors.primary
                      e.currentTarget.style.color = theme.colors.secondary
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = theme.colors.secondary
                      e.currentTarget.style.color = theme.colors.primary
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserGroupIcon className="h-5 w-5" />
                      Create Group ({selectedUsers.length} members)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateGroupModal;
