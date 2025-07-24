import React from 'react';
import { VideoCameraIcon, BuildingOfficeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { MeetingTypeSelectProps } from './types';

const MeetingTypeSelect: React.FC<MeetingTypeSelectProps> = ({ meetingType, onChange }) => {
  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Meeting Type
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="relative flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer focus:outline-none">
          <input
            type="radio"
            name="meetingType"
            value="offline"
            checked={meetingType === 'offline'}
            onChange={onChange}
            className="sr-only"
          />
          <div className={`flex items-center space-x-2 ${meetingType === 'offline' ? 'text-[#fddc9a]' : 'text-gray-700'}`}>
            <BuildingOfficeIcon className="h-5 w-5" />
            <span>Offline</span>
          </div>
          <div className={`absolute inset-0 border-2 rounded-md ${meetingType === 'offline' ? 'border-black bg-black bg-opacity-5' : 'border-gray-300'}`}></div>
        </label>

        <label className="relative flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer focus:outline-none">
          <input
            type="radio"
            name="meetingType"
            value="online"
            checked={meetingType === 'online'}
            onChange={onChange}
            className="sr-only"
          />
          <div className={`flex items-center space-x-2 ${meetingType === 'online' ? 'text-[#fddc9a]' : 'text-gray-700'}`}>
            <VideoCameraIcon className="h-5 w-5" />
            <span>Online</span>
          </div>
          <div className={`absolute inset-0 border-2 rounded-md ${meetingType === 'online' ? 'border-black bg-black bg-opacity-5' : 'border-gray-300'}`}></div>
        </label>

        <label className="relative flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer focus:outline-none">
          <input
            type="radio"
            name="meetingType"
            value="hybrid"
            checked={meetingType === 'hybrid'}
            onChange={onChange}
            className="sr-only"
          />
          <div className={`flex items-center space-x-2 ${meetingType === 'hybrid' ? 'text-[#fddc9a]' : 'text-gray-700'}`}>
            <UserGroupIcon className="h-5 w-5" />
            <span>Hybrid</span>
          </div>
          <div className={`absolute inset-0 border-2 rounded-md ${meetingType === 'hybrid' ? 'border-black bg-black bg-opacity-5' : 'border-gray-300'}`}></div>
        </label>
      </div>
    </div>
  );
};

export default MeetingTypeSelect;
