import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  LinkIcon,
  UserGroupIcon,
  TagIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import sessionService from '../../services/sessionService';
import { useAuth } from '../../contexts/useAuth';
import type { Session } from '../../types/session';
import { Toaster, toast } from 'react-hot-toast';
import theme from '../../config/theme';

interface SessionFormData {
  title: string;
  description: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingType: 'online' | 'offline' | 'hybrid';
  meetingLink: string;
  maxAttendees: number;
  category: string;
  tags: string[];
}

const EditSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingSession, setFetchingSession] = useState(true);
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
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canManage = isAdmin || isModerator;

  useEffect(() => {
    if (!canManage) {
      toast.error('You do not have permission to edit sessions');
      navigate('/sessions');
      return;
    }

    if (id) {
      fetchSession();
    }
  }, [id, canManage]);

  const fetchSession = async () => {
    try {
      setFetchingSession(true);
      const session = await sessionService.getSessionById(id!);
      
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
        tags: session.tags || []
      });
    } catch (error) {
      toast.error('Failed to load session');
      navigate('/sessions');
    } finally {
      setFetchingSession(false);
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
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else if (type === 'radio' && name === 'meetingType') {
      setFormData(prev => ({
        ...prev,
        meetingType: value as 'online' | 'offline' | 'hybrid'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name as keyof SessionFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
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

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await sessionService.updateSession({
        id: id!,
        ...formData
      });
      
      toast.success('Session updated successfully!');
      navigate(`/sessions/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fddc9a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(`/sessions/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to session
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header with gradient */}
          <div 
            className="relative p-6 pb-4"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.secondary}dd 100%)`
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <CalendarIcon className="w-full h-full" style={{ color: theme.colors.primary }} />
            </div>
            
            <div className="relative">
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                Edit Session
              </h2>
              <p className="text-sm opacity-80" style={{ color: theme.colors.primary }}>
                Update session information
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Session Title */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="inline h-5 w-5 mr-1" />
                  Session Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                />
              </div>

              {/* Date and Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline h-5 w-5 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  name="sessionDate"
                  value={formData.sessionDate}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2 border ${errors.sessionDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                />
                {errors.sessionDate && <p className="mt-1 text-sm text-red-600">{errors.sessionDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="inline h-5 w-5 mr-1" />
                  Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.startTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.endTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                  />
                </div>
                {(errors.startTime || errors.endTime) && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime || errors.endTime}</p>
                )}
              </div>

              {/* Meeting Type */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="relative flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      value="offline"
                      checked={formData.meetingType === 'offline'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`flex items-center space-x-2 ${formData.meetingType === 'offline' ? 'text-[#fddc9a]' : 'text-gray-700'}`}>
                      <BuildingOfficeIcon className="h-5 w-5" />
                      <span>Offline</span>
                    </div>
                    <div className={`absolute inset-0 border-2 rounded-md ${formData.meetingType === 'offline' ? 'border-black bg-black bg-opacity-5' : 'border-gray-300'}`}></div>
                  </label>
                  
                  <label className="relative flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      value="online"
                      checked={formData.meetingType === 'online'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`flex items-center space-x-2 ${formData.meetingType === 'online' ? 'text-[#fddc9a]' : 'text-gray-700'}`}>
                      <VideoCameraIcon className="h-5 w-5" />
                      <span>Online</span>
                    </div>
                    <div className={`absolute inset-0 border-2 rounded-md ${formData.meetingType === 'online' ? 'border-black bg-black bg-opacity-5' : 'border-gray-300'}`}></div>
                  </label>
                  
                  <label className="relative flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer">
                    <input
                      type="radio"
                      name="meetingType"
                      value="hybrid"
                      checked={formData.meetingType === 'hybrid'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`flex items-center space-x-2 ${formData.meetingType === 'hybrid' ? 'text-[#fddc9a]' : 'text-gray-700'}`}>
                      <UserGroupIcon className="h-5 w-5" />
                      <span>Hybrid</span>
                    </div>
                    <div className={`absolute inset-0 border-2 rounded-md ${formData.meetingType === 'hybrid' ? 'border-black bg-black bg-opacity-5' : 'border-gray-300'}`}></div>
                  </label>
                </div>
              </div>

              {/* Location */}
              {(formData.meetingType === 'offline' || formData.meetingType === 'hybrid') && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="inline h-5 w-5 mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                  />
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>
              )}

              {/* Meeting Link */}
              {(formData.meetingType === 'online' || formData.meetingType === 'hybrid') && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <LinkIcon className="inline h-5 w-5 mr-1" />
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border ${errors.meetingLink ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                  />
                  {errors.meetingLink && <p className="mt-1 text-sm text-red-600">{errors.meetingLink}</p>}
                </div>
              )}

              {/* Max Attendees and Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserGroupIcon className="inline h-5 w-5 mr-1" />
                  Max Attendees
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  min="1"
                  className={`block w-full px-3 py-2 border ${errors.maxAttendees ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
                />
                {errors.maxAttendees && <p className="mt-1 text-sm text-red-600">{errors.maxAttendees}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                >
                  <option value="">Select a category</option>
                  <option value="meeting">Meeting</option>
                  <option value="workshop">Workshop</option>
                  <option value="training">Training</option>
                  <option value="conference">Conference</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Tags */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="inline h-5 w-5 mr-1" />
                  Tags
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type a tag and press Enter"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#fddc9a] text-black"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-black hover:text-gray-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#fddc9a] bg-black hover:text-black hover:bg-[#fddc9a] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Session'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/sessions/${id}`)}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSession;
