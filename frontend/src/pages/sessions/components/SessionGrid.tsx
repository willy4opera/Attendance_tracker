import type { FC } from 'react';
import { CalendarIcon, UsersIcon, LocationMarkerIcon, PencilIcon, EyeIcon } from '@heroicons/react/solid';
import type { Session } from '../../../types/session';
import sessionService from '../../../services/sessionService';

interface SessionGridProps {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onView: (session: Session) => void;
  isAdmin: boolean;
}

const SessionGrid: FC<SessionGridProps> = ({ sessions, onEdit, onView, isAdmin }) => {
  const getStatusBadge = (session: Session) => {
    const status = sessionService.getSessionStatus(session);
    const statusClasses = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      ongoing: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{session.title}</h3>
              {getStatusBadge(session)}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                {sessionService.formatSessionTime(session)}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">{session.totalAttendance}</span>
                {session.maxAttendees && (
                  <span className="ml-1">/ {session.maxAttendees} attendees</span>
                )}
              </div>

              {(session.location || session.meetingType) && (
                <div className="flex items-center text-sm text-gray-600">
                  <LocationMarkerIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {session.meetingType === 'online' ? 'Online Meeting' : session.location || session.meetingType}
                </div>
              )}
            </div>

            {session.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{session.description}</p>
            )}

            {session.facilitator && (
              <div className="text-sm text-gray-500 mb-4">
                Facilitator: {session.facilitator.firstName} {session.facilitator.lastName}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                {session.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onView(session)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onEdit(session)}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Session"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionGrid;
