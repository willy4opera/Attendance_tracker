import React, { useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  UserPlusIcon,
  CheckIcon,
  ArrowPathIcon,
  UsersIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import theme from '../../config/theme';

// Import modular components and utilities
import { 
  useAttendanceData,
  AttendanceStatsComponent,
  UserListComponent,
  getFilteredUsers,
  getAttendanceStats,
  getDepartments,
  exportAttendanceCSV
} from './MarkAttendance';

const MarkAttendance: React.FC = () => {
  const {
    state,
    updateState,
    fetchData,
    fetchExistingAttendance,
    generateAttendanceLink,
    copyAttendanceLink,
    handleStatusChange,
    handleNotesChange,
    saveAttendance,
    applyBulkStatus
  } = useAttendanceData();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (state.selectedSession) {
      fetchExistingAttendance();
      updateState({ attendanceLink: '' }); // Clear previous link
    }
  }, [state.selectedSession]);

  // Auto-save functionality
  useEffect(() => {
    if (state.autoSave && state.attendanceData.size > 0) {
      const timeoutId = setTimeout(() => {
        saveAttendance(true); // Silent save
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.attendanceData, state.autoSave]);

  const filteredUsers = getFilteredUsers(
    state.users,
    state.searchTerm,
    state.statusFilter,
    state.departmentFilter,
    state.attendanceData
  );
  const stats = getAttendanceStats(state.users, state.attendanceData);
  const selectedSessionData = state.sessions.find(s => s.id === state.selectedSession);
  const departments = getDepartments(state.users);

  const handleExportCSV = () => {
    if (state.attendanceData.size === 0) {
      toast.error('No attendance data to export');
      return;
    }
    exportAttendanceCSV(
      state.attendanceData,
      state.users,
      state.existingAttendance,
      selectedSessionData?.title
    );
    toast.success('Attendance data exported successfully!');
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
            <p className="text-sm text-gray-600">Manually mark attendance for users in a session</p>
            {selectedSessionData && (
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>Session: <strong>{selectedSessionData.title}</strong></span>
                <span>Date: {new Date(selectedSessionData.sessionDate).toLocaleDateString()}</span>
                <span>Time: {selectedSessionData.startTime} - {selectedSessionData.endTime}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateState({ autoSave: !state.autoSave })}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                state.autoSave 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>Auto-save {state.autoSave ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => updateState({ showFilters: !state.showFilters })}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                state.showFilters 
                  ? 'text-white border-current' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
              style={{ 
                backgroundColor: state.showFilters ? theme.colors.primary : undefined,
                borderColor: state.showFilters ? theme.colors.primary : undefined
              }}
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => updateState({ showPreview: !state.showPreview })}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Session Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Session</label>
          <select
            value={state.selectedSession}
            onChange={(e) => updateState({ selectedSession: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
          >
            <option value="">Select a session...</option>
            {state.sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} - {new Date(session.sessionDate).toLocaleDateString()} 
                ({session.startTime} - {session.endTime})
              </option>
            ))}
          </select>
        </div>

        {/* Attendance Link Generation */}
        {state.selectedSession && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Link</label>
            <div className="flex gap-2">
              {!state.attendanceLink ? (
                <button
                  onClick={generateAttendanceLink}
                  disabled={state.generatingLink}
                  className="flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: theme.colors.info }}
                >
                  {state.generatingLink ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      <span>Generate Link</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={state.attendanceLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyAttendanceLink}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                    style={{ backgroundColor: theme.colors.success }}
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {state.selectedSession && (
        <>
          {/* Filters */}
          {state.showFilters && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                  <select
                    value={state.statusFilter}
                    onChange={(e) => updateState({ statusFilter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                  >
                    <option value="all">All Users</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                    <option value="holiday">Holiday</option>
                    <option value="not_marked">Not Marked</option>
                    <option value="modified">Modified (Unsaved)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={state.departmentFilter}
                    onChange={(e) => updateState({ departmentFilter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={state.searchTerm}
                      onChange={(e) => updateState({ searchTerm: e.target.value })}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 w-full"
                      style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <AttendanceStatsComponent stats={stats} />

          {/* Bulk Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Actions</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={state.bulkStatus}
                  onChange={(e) => updateState({ bulkStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                >
                  <option value="">Select status for bulk update...</option>
                  <option value="present">Mark All as Present</option>
                  <option value="late">Mark All as Late</option>
                  <option value="absent">Mark All as Absent</option>
                  <option value="excused">Mark All as Excused</option>
                  <option value="holiday">Mark All as Holiday</option>
                </select>
              </div>
              <button
                onClick={applyBulkStatus}
                disabled={!state.bulkStatus}
                className="flex items-center space-x-1 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: theme.colors.info }}
              >
                <UsersIcon className="w-4 h-4" />
                <span>Apply to Filtered Users ({filteredUsers.length})</span>
              </button>
              <button
                onClick={handleExportCSV}
                disabled={state.attendanceData.size === 0}
                className="flex items-center space-x-1 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: theme.colors.secondary }}
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* User List */}
          <UserListComponent
            users={filteredUsers}
            attendanceData={state.attendanceData}
            existingAttendance={state.existingAttendance}
            modifiedCount={stats.modifiedUsers}
            saving={state.saving}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onSave={() => saveAttendance()}
          />
        </>
      )}
    </div>
  );
};

export default MarkAttendance;
