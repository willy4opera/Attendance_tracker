import React from 'react';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  LinkIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import type { SessionFormProps } from './types';
import FileUpload from './FileUpload';
import TagInput from './TagInput';
import MeetingTypeSelect from './MeetingTypeSelect';
import ExpectedAttendeesSelect from './ExpectedAttendeesSelect';

const SessionForm: React.FC<SessionFormProps> = ({
  formData,
  errors,
  loading,
  onSubmit,
  onChange,
  onAddTag,
  onRemoveTag,
  tagInput,
  onTagInputChange,
  onFileChange,
  onRemoveFile,
  onClose,
  onExpectedAttendeesChange,
  availableUsers,
  loadingUsers,
}) => {
  return (
    <form onSubmit={onSubmit} className="p-6">
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
            onChange={onChange}
            className={`block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
            placeholder="Enter session title"
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
            onChange={onChange}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
            placeholder="Describe the session..."
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="inline h-5 w-5 mr-1" />
            Date
          </label>
          <input
            type="date"
            name="sessionDate"
            value={formData.sessionDate}
            onChange={onChange}
            className={`block w-full px-3 py-2 border ${errors.sessionDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
          />
          {errors.sessionDate && <p className="mt-1 text-sm text-red-600">{errors.sessionDate}</p>}
        </div>

        {/* Time */}
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
              onChange={onChange}
              className={`block w-full px-3 py-2 border ${errors.startTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
            />
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={onChange}
              className={`block w-full px-3 py-2 border ${errors.endTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
            />
          </div>
          {(errors.startTime || errors.endTime) && (
            <p className="mt-1 text-sm text-red-600">{errors.startTime || errors.endTime}</p>
          )}
        </div>

        {/* Meeting Type */}
        <MeetingTypeSelect meetingType={formData.meetingType} onChange={onChange} />

        {/* Location (for offline/hybrid) */}
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
              onChange={onChange}
              className={`block w-full px-3 py-2 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
              placeholder="Enter location"
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>
        )}

        {/* Meeting Link (for online/hybrid) */}
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
              onChange={onChange}
              className={`block w-full px-3 py-2 border ${errors.meetingLink ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
              placeholder="https://meet.example.com/..."
            />
            {errors.meetingLink && <p className="mt-1 text-sm text-red-600">{errors.meetingLink}</p>}
          </div>
        )}

        {/* Max Attendees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UserGroupIcon className="inline h-5 w-5 mr-1" />
            Max Attendees
          </label>
          <input
            type="number"
            name="maxAttendees"
            value={formData.maxAttendees}
            onChange={onChange}
            min="1"
            className={`block w-full px-3 py-2 border ${errors.maxAttendees ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-black focus:border-black`}
          />
          {errors.maxAttendees && <p className="mt-1 text-sm text-red-600">{errors.maxAttendees}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={onChange}
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

        {/* Expected Attendees */}
        <div className="sm:col-span-2">
          <ExpectedAttendeesSelect
            selectedUserIds={formData.expectedAttendees}
            availableUsers={availableUsers}
            loading={loadingUsers}
            onChange={onExpectedAttendeesChange}
            error={errors.expectedAttendees as string}
          />
        </div>

        {/* Tags */}
        <TagInput
          tags={formData.tags}
          tagInput={tagInput}
          onTagInputChange={onTagInputChange}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />

        {/* File Upload */}
        <FileUpload
          files={formData.attachments || []}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#fddc9a] bg-black hover:text-black hover:bg-[#fddc9a] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Session'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default SessionForm;
