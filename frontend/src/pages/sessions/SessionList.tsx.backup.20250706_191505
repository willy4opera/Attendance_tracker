import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { sessionService } from '../../services/session.service';
import type { Session, SessionFilters } from '../../services/session.service';
import { toastError } from '../../utils/toast';
import ViewToggle from '../../components/common/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  LinkIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const SessionList: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { viewMode, handleViewModeChange } = useViewMode('sessionViewMode', 'grid');
  const [filters, setFilters] = useState<SessionFilters>({
    search: '',
    status: 'all',
    page: 1,
    limit: 10
  });
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const isAdminOrModerator = user?.role === 'admin' || user?.role === 'moderator';

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionService.getAllSessions(filters);
      setSessions(response.sessions);
      setTotal(response.total);
    } catch (error) {
      if (error instanceof Error) {
        toastError(error.message);
      } else {
        toastError('Failed to fetch sessions');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleStatusChange = (status: SessionFilters['status']) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const getStatusBadge = (session: Session) => {
    const status = sessionService.getSessionStatus(session);
    const badges = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      past: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAttendanceRate = (session: Session) => {
    if (!session.enrolledCount || session.enrolledCount === 0) return 'N/A';
    const rate = ((session.attendanceCount || 0) / session.enrolledCount) * 100;
    return `${rate.toFixed(0)}%`;
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <Link
          key={session._id}
          to={`/sessions/${session._id}`}
          className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {session.name}
            </h3>
            {getStatusBadge(session)}
          </div>

          {session.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {session.description}
            </p>
          )}

          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              {sessionService.formatSessionTime(session)}
            </div>

            {session.location && (
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {session.location}
              </div>
            )}

            {session.meetingLink && (
              <div className="flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                <span className="text-[#fddc9a]">Online Session</span>
              </div>
            )}

            <div className="flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              <span>
                {session.enrolledCount || 0} enrolled
                {session.capacity && ` / ${session.capacity} capacity`}
              </span>
            </div>
          </div>

          {session.attendanceCount !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Attendance Rate</span>
                <span className="font-medium text-gray-900">
                  {getAttendanceRate(session)}
                </span>
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {sessions.map((session) => (
          <li key={session._id}>
            <Link
              to={`/sessions/${session._id}`}
              className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-gray-900 truncate">
                      {session.name}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      {getStatusBadge(session)}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {sessionService.formatSessionTime(session)}
                    </div>
                    {session.location && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {session.location}
                      </div>
                    )}
                    {session.meetingLink && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <LinkIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span className="text-[#fddc9a]">Online Session</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <UserGroupIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {session.enrolledCount || 0} enrolled
                      {session.capacity && ` / ${session.capacity} capacity`}
                    </div>
                  </div>
                  {session.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {session.description}
                    </p>
                  )}
                </div>
                <div className="ml-5 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Attendance</p>
                    <p className="text-lg font-medium text-gray-900">
                      {getAttendanceRate(session)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        {isAdminOrModerator && (
          <Link
            to="/sessions/create"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Session
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search sessions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#fddc9a] focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
          </form>
          
          {/* View Mode Toggle */}
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {(['all', 'active', 'upcoming', 'past'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.status === status
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Display */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fddc9a]"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAdminOrModerator
              ? 'Get started by creating a new session.'
              : 'No sessions are available at the moment.'}
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}

      {/* Pagination */}
      {total > filters.limit! && (
        <div className="mt-8 flex justify-center space-x-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
            disabled={filters.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {filters.page} of {Math.ceil(total / filters.limit!)}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
            disabled={filters.page! >= Math.ceil(total / filters.limit!)}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionList;
