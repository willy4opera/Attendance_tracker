import React, { useState, Fragment, useCallback, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../contexts/useAuth';
import Swal from 'sweetalert2';
import theme from '../../config/theme';
import sessionService from '../../services/sessionService';
import fileService from '../../services/fileService';
import ModalHeader from './CreateSessionModal/ModalHeader';
import SessionForm from './CreateSessionModal/SessionForm';
import type { SessionFormData, CreateSessionModalProps } from './CreateSessionModal/types';
import type { UserOption } from '../../types/session';

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [errors, setErrors] = useState<Partial<SessionFormData>>({});
  const [formData, setFormData] = useState<SessionFormData>({
    title: '',
    description: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingType: 'offline',
    meetingLink: '',
    maxAttendees: 50,
    category: '',
    tags: [],
    attachments: [],
    expectedAttendees: []
  });
  const [tagInput, setTagInput] = useState('');

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async (search?: string) => {
    try {
      setLoadingUsers(true);
      const users = await sessionService.getUsersForSelection(search);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SessionFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    }

    if (!formData.sessionDate) {
      newErrors.sessionDate = 'Session date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if ((formData.meetingType === 'online' || formData.meetingType === 'hybrid') && !formData.meetingLink) {
      newErrors.meetingLink = 'Meeting link is required for online sessions';
    }

    if ((formData.meetingType === 'offline' || formData.meetingType === 'hybrid') && !formData.location) {
      newErrors.location = 'Location is required for in-person sessions';
    }

    if (formData.maxAttendees < 1) {
      newErrors.maxAttendees = 'Maximum attendees must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
    
    if (errors[name as keyof SessionFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleExpectedAttendeesChange = (userIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      expectedAttendees: userIds
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const handleFileChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const handleRemoveFile = useCallback((index: number) => {
    setFormData(prev => {
      const newAttachments = [...(prev.attachments || [])];
      newAttachments.splice(index, 1);
      return { ...prev, attachments: newAttachments };
    });
  }, []);

  const uploadFiles = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      try {
        // Upload file and get URL
        const url = await fileService.uploadDocument(file);
        
        // Return file metadata
        return {
          filename: file.name,
          originalName: file.name,
          url: url,
          path: url, // Using URL as path for now
          size: file.size,
          mimeType: file.type
        };
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create session data with expected attendees
      const sessionData = {
        title: formData.title,
        description: formData.description,
        sessionDate: formData.sessionDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        meetingType: formData.meetingType,
        meetingLink: formData.meetingLink,
        maxAttendees: formData.maxAttendees,
        category: formData.category,
        tags: formData.tags,
        facilitatorId: user?.id,
        expectedAttendees: formData.expectedAttendees
      };

      // Create the session
      const createdSession = await sessionService.createSession(sessionData);
      
      // Upload files if any
      if (formData.attachments && formData.attachments.length > 0) {
        try {
          // First upload files to file service
          const uploadedFiles = await uploadFiles(formData.attachments);
          
          // Then attach metadata to session
          await sessionService.addFilesToSession(createdSession.id, uploadedFiles);
        } catch (fileError) {
          console.error('Failed to upload files:', fileError);
          // Session was created successfully, just warn about files
          Swal.fire({
            icon: 'warning',
            title: 'Session Created',
            text: 'Session was created successfully, but some files could not be uploaded.',
            confirmButtonColor: theme.colors.primary,
            confirmButtonText: 'OK'
          });
          onSuccess();
          onClose();
          resetForm();
          return;
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Session created successfully with ${formData.expectedAttendees.length} expected attendees!`,
        confirmButtonColor: theme.colors.primary,
        confirmButtonText: 'Great!'
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message || 'Failed to create session',
        confirmButtonColor: theme.colors.primary
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      sessionDate: '',
      startTime: '',
      endTime: '',
      location: '',
      meetingType: 'offline',
      meetingLink: '',
      maxAttendees: 50,
      category: '',
      tags: [],
      attachments: [],
      expectedAttendees: []
    });
    setTagInput('');
    setErrors({});
    setAvailableUsers([]);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <ModalHeader onClose={onClose} />
                <SessionForm
                  formData={formData}
                  errors={errors}
                  loading={loading}
                  onSubmit={handleSubmit}
                  onChange={handleChange}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  tagInput={tagInput}
                  onTagInputChange={setTagInput}
                  onFileChange={handleFileChange}
                  onRemoveFile={handleRemoveFile}
                  onClose={onClose}
                  onExpectedAttendeesChange={handleExpectedAttendeesChange}
                  availableUsers={availableUsers}
                  loadingUsers={loadingUsers}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateSessionModal;
