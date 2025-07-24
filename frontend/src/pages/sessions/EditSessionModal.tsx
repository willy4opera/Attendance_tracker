import React, { useState, Fragment, useCallback, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../contexts/useAuth';
import { toast } from 'react-hot-toast';
import sessionService from '../../services/sessionService';
import fileService from '../../services/fileService';
import EditModalHeader from './EditSessionModal/ModalHeader';
import EditSessionForm from './EditSessionModal/EditSessionForm';
import type { EditSessionFormData, EditSessionModalProps } from './EditSessionModal/types';

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
}

const EditSessionModal: React.FC<EditSessionModalProps> = ({ 
  isOpen, 
  sessionId, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingSession, setFetchingSession] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [errors, setErrors] = useState<Partial<EditSessionFormData>>({});
  const [formData, setFormData] = useState<EditSessionFormData>({
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

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canManage = isAdmin || isModerator;

  useEffect(() => {
    if (isOpen && sessionId && canManage) {
      fetchSession();
      loadUsers();
    }
  }, [isOpen, sessionId, canManage]);

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

  const fetchSession = async () => {
    try {
      setFetchingSession(true);
      const session = await sessionService.getSessionById(sessionId);
      
      // Format date for input
      const formattedDate = new Date(session.sessionDate).toISOString().split('T')[0];
      
      setFormData({
        title: session.title || '',
        description: session.description || '',
        sessionDate: formattedDate,
        startTime: session.startTime || '',
        endTime: session.endTime || '',
        location: session.location || '',
        meetingType: session.meetingType || 'offline',
        meetingLink: session.meetingLink || '',
        maxAttendees: session.maxAttendees || 50,
        category: session.category || '',
        tags: session.tags || [],
        attachments: [],
        expectedAttendees: session.expectedAttendees || []
      });
    } catch (error) {
      toast.error('Failed to load session');
      onClose();
    } finally {
      setFetchingSession(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EditSessionFormData> = {};

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
    
    if (errors[name as keyof EditSessionFormData]) {
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
        const url = await fileService.uploadDocument(file);
        return {
          filename: file.name,
          originalName: file.name,
          url: url,
          path: url,
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
      // Update session with expected attendees
      await sessionService.updateSession({
        id: sessionId,
        ...formData
      });
      
      // Upload new files if any
      if (formData.attachments && formData.attachments.length > 0) {
        try {
          const uploadedFiles = await uploadFiles(formData.attachments);
          await sessionService.addFilesToSession(sessionId, uploadedFiles);
        } catch (fileError) {
          console.error('Failed to upload files:', fileError);
          toast.success('Session updated, but some files could not be uploaded');
          onSuccess();
          onClose();
          return;
        }
      }
      
      toast.success(`Session updated successfully with ${formData.expectedAttendees.length} expected attendees!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return null;
  }

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
                <EditModalHeader onClose={onClose} />
                
                {fetchingSession ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fddc9a]"></div>
                  </div>
                ) : (
                  <EditSessionForm
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
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditSessionModal;
