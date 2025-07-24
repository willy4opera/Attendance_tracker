import React from 'react';
import { UsersIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import type { User } from '../../../types';
import type { AttendanceEntry } from './types';
import type { Attendance } from '../../../types/attendance';

interface UserListProps {
  users: User[];
  attendanceData: Map<string, AttendanceEntry>;
  existingAttendance: Attendance[];
  modifiedCount: number;
  saving: boolean;
  onStatusChange: (userId: string, status: string) => void;
  onNotesChange: (userId: string, notes: string) => void;
  onSave: () => void;
  onRefresh?: () => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  attendanceData,
  existingAttendance,
  modifiedCount,
  saving,
  onStatusChange,
  onNotesChange,
  onSave,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          Users ({users.length})
          {modifiedCount > 0 && (
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
              {modifiedCount} unsaved changes
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh user list"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving || modifiedCount === 0}
            className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border"
            style={{ 
              backgroundColor: theme.colors.primary, 
              borderColor: theme.colors.primary,
              color: 'white'
            }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Save Changes ({modifiedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {users.length > 0 ? (
          users.map((user) => {
            const attendance = attendanceData.get(user.id);
            const existingRecord = existingAttendance.find(r => r.userId === user.id);
            
            return (
              <div key={user.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center border"
                          style={{ 
                            backgroundColor: theme.colors.primary, 
                            borderColor: theme.colors.primary,
                            color: 'white'
                          }}
                        >
                          <span className="font-medium text-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                          {existingRecord && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Previously marked
                            </span>
                          )}
                          {attendance?.isModified && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                              Modified
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.department?.name && (
                          <p className="text-xs text-gray-400">{user.department.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={attendance?.status || 'absent'}
                        onChange={(e) => onStatusChange(user.id, e.target.value)}
                        className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                      >
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                        <option value="holiday">Holiday</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={attendance?.notes || ''}
                        onChange={(e) => onNotesChange(user.id, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No users match your current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
