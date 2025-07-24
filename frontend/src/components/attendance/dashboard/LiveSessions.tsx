import React from 'react';
import { PlayIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import type { LiveAttendanceSession } from '../../../types/attendance';

interface LiveSessionsProps {
  sessions: LiveAttendanceSession[];
  activeSession: string | null;
  onStartMonitoring: (sessionId: string) => void;
}

const LiveSessions: React.FC<LiveSessionsProps> = ({ sessions, activeSession, onStartMonitoring }) => {
  return (
    <div
      className="rounded-lg shadow-sm border"
      style={{
        backgroundColor: theme.colors.background.paper,
        borderColor: `${theme.colors.text.secondary}30`,
      }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{ borderBottomColor: `${theme.colors.text.secondary}30` }}
      >
        <h3
          className="text-lg font-medium"
          style={{ color: theme.colors.text.primary }}
        >
          Live Sessions Today
        </h3>
      </div>
      <div className="p-6">
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border-2 transition-all"
                style={{
                  borderColor: session.isActive ? theme.colors.success : theme.colors.warning,
                  backgroundColor: session.isActive
                    ? `${theme.colors.success}10`
                    : `${theme.colors.warning}10`,
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4
                      className="font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {session.title}
                    </h4>
                    <p
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {new Date(`2000-01-01T${session.startTime}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -
                      {new Date(`2000-01-01T${session.endTime}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      color: session.isActive ? theme.colors.success : theme.colors.warning,
                    }}
                  >
                    {session.isActive && (
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1 animate-pulse"
                        style={{ backgroundColor: theme.colors.success }}
                      ></span>
                    )}
                    {session.isActive ? 'Live Now' : 'Scheduled'}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div
                    className="flex items-center space-x-1 text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{session.totalAttendance} present</span>
                  </div>

                  {session.isActive && activeSession !== session.id && (
                    <button
                      onClick={() => onStartMonitoring(session.id)}
                      className="text-white px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                      style={{ backgroundColor: theme.colors.primary }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                      onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>Monitor</span>
                    </button>
                  )}

                  {activeSession === session.id && (
                    <span
                      className="text-white px-3 py-1 rounded-md text-sm font-medium"
                      style={{ backgroundColor: theme.colors.success }}
                    >
                      Monitoring
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p
              className="mt-1 text-sm"
              style={{ color: theme.colors.text.secondary }}
            >
              Check back later or create a new session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessions;
