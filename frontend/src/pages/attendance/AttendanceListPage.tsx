import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  EyeIcon, 
  FunnelIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

import attendanceService from '../../services/attendanceService';
import { useAuth } from '../../contexts/useAuth';
import toast from 'react-hot-toast';
import type { Attendance, AttendanceFilters } from '../../types/attendance';

const AttendanceListPage: FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || 'all';
  const sessionId = searchParams.get('sessionId') || '';
  const userId = searchParams.get('userId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const fetchAttendances = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: AttendanceFilters = { 
        page, 
        limit: 20,
        status: status as any,
        sessionId: sessionId || undefined,
        userId: userId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      
      const response = await attendanceService.getAllAttendance(filters);
      
      if (Array.isArray(response.data)) {
        setAttendances(response.data);
      } else if (response.data && 'attendances' in response.data) {
        setAttendances(response.data.attendances);
      }
      
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalResults(response.pagination.totalResults);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance records';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [page, status, sessionId, userId, startDate, endDate]);

  // Real-time updates
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      fetchAttendances();
    };

    attendanceService.subscribe('attendance-updated', handleAttendanceUpdate);
    
    return () => {
      attendanceService.unsubscribe('attendance-updated', handleAttendanceUpdate);
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    const params: any = { page: newPage.toString() };
    if (status !== 'all') params.status = status;
    if (sessionId) params.sessionId = sessionId;
    if (userId) params.userId = userId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    setSearchParams(params);
  };

  const handleFiltersChange = (filters: {
    status?: string;
    sessionId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params: any = { page: '1' };
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.sessionId) params.sessionId = filters.sessionId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    setSearchParams(params);
  };

  const handleViewDetails = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setShowDetailModal(true);
  };

  const formatStatus = (status: string) => {
    return attendanceService.formatStatus(status);
  };

  const formatMarkedVia = (method: string) => {
    return attendanceService.formatMarkedVia(method);
  };

  const AttendanceCard: FC<{ attendance: Attendance }> = ({ attendance }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">
            {attendance.session?.title || 'Unknown Session'}
          </h3>
          <p className="text-sm text-gray-600">
            {attendance.user?.firstName} {attendance.user?.lastName}
            <span className="ml-2 text-gray-400">({attendance.user?.email})</span>
          </p>
        </div>
        <button
          onClick={() => handleViewDetails(attendance)}
          className="p-2 text-gray-400 hover:text-[#be8533] transition-colors"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          formatStatus(attendance.status).className
        }`}>
          {formatStatus(attendance.status).text}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {formatMarkedVia(attendance.markedVia)}
        </span>
        {attendance.isLate && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Late ({attendance.lateMinutes || 0}m)
          </span>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span className="flex items-center">
          <CalendarDaysIcon className="w-4 h-4 mr-1" />
          {new Date(attendance.session?.sessionDate || attendance.createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center">
          <ClockIcon className="w-4 h-4 mr-1" />
          {new Date(attendance.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );

  const AttendanceRow: FC<{ attendance: Attendance }> = ({ attendance }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {attendance.user?.firstName} {attendance.user?.lastName}
            </div>
            <div className="text-sm text-gray-500">{attendance.user?.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{attendance.session?.title || 'Unknown'}</div>
        <div className="text-sm text-gray-500">
          {attendance.session?.sessionDate && new Date(attendance.session.sessionDate).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          formatStatus(attendance.status).className
        }`}>
          {formatStatus(attendance.status).text}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatMarkedVia(attendance.markedVia)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(attendance.createdAt).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => handleViewDetails(attendance)}
          className="text-[#be8533] hover:text-[#a06b1f] transition-colors"
        >
          <EyeIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );

  const FilterPanel: FC = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => handleFiltersChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533]"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
            <option value="holiday">Holiday</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleFiltersChange({ startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleFiltersChange({ endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533]"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => handleFiltersChange({})}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );

  const DetailModal: FC = () => {
    if (!selectedAttendance || !showDetailModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">
                    {selectedAttendance.user?.firstName} {selectedAttendance.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedAttendance.user?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Session</label>
                  <p className="text-sm text-gray-900">{selectedAttendance.session?.title}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAttendance.session?.sessionDate && 
                      new Date(selectedAttendance.session.sessionDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formatStatus(selectedAttendance.status).className
                  }`}>
                    {formatStatus(selectedAttendance.status).text}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Marked Via</label>
                  <p className="text-sm text-gray-900">{formatMarkedVia(selectedAttendance.markedVia)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
                  <p className="text-sm text-gray-900">
                    {selectedAttendance.checkInTime 
                      ? new Date(selectedAttendance.checkInTime).toLocaleString()
                      : 'Not recorded'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
                  <p className="text-sm text-gray-900">
                    {selectedAttendance.checkOutTime 
                      ? new Date(selectedAttendance.checkOutTime).toLocaleString()
                      : 'Not recorded'
                    }
                  </p>
                </div>

                {selectedAttendance.isLate && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Late Minutes</label>
                      <p className="text-sm text-gray-900">{selectedAttendance.lateMinutes || 0} minutes</p>
                    </div>
                  </>
                )}

                {selectedAttendance.duration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="text-sm text-gray-900">{selectedAttendance.duration} minutes</p>
                  </div>
                )}
              </div>

              {selectedAttendance.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900">{selectedAttendance.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          {totalResults > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {attendances.length} of {totalResults} records
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-[#be8533] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
          
          <button
            onClick={fetchAttendances}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="flex items-center rounded-lg bg-gray-200 p-1">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white shadow text-[#be8533]' : 'text-gray-600'
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white shadow text-[#be8533]' : 'text-gray-600'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && <FilterPanel />}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#be8533]"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchAttendances}
            className="bg-[#be8533] text-white px-4 py-2 rounded-md hover:bg-[#a06b1f] transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : attendances.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
          <p className="mt-1 text-sm text-gray-500">
            No attendance records found matching your criteria.
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {attendances.map((attendance) => (
                <AttendanceCard key={attendance.id} attendance={attendance} />
              ))}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances.map((attendance) => (
                    <AttendanceRow key={attendance.id} attendance={attendance} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === page
                              ? 'z-10 bg-[#be8533] border-[#be8533] text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <DetailModal />
    </div>
  );
};

export default AttendanceListPage;
