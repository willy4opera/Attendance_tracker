import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import attendanceService from '../../services/attendanceService';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/useAuth';
import type { 
  Attendance,
  AttendanceFilters,
  AttendanceResponse 
} from '../../types/attendance';

const AttendanceHistory: React.FC = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState<AttendanceFilters>({
    page: 1,
    limit: 20,
    status: 'all'
  });
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [filters]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchSummaryData();
    }
  }, [dateRange]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAllAttendance({
        ...filters,
        userId: user?.role === 'admin' ? filters.userId : user?.id
      });
      setAttendanceData(response);
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    try {
      const summary = await attendanceService.getAttendanceSummary(
        dateRange.startDate,
        dateRange.endDate
      );
      setSummaryData(summary);
    } catch (error) {
      console.error('Failed to fetch summary data:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      page: 1
    }));
    fetchAttendanceHistory();
  };

  const handleFilterChange = (newFilters: Partial<AttendanceFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }));
  };

  const handleDateRangeChange = (field: string, value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));

    // Update filters with date range
    if (field === 'startDate') {
      handleFilterChange({ startDate: value });
    } else if (field === 'endDate') {
      handleFilterChange({ endDate: value });
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const exportToCSV = () => {
    if (!attendanceData?.data) {
      toast.error('No data to export');
      return;
    }

    const attendances = Array.isArray(attendanceData.data)
      ? attendanceData.data
      : attendanceData.data.attendances || [];

    if (attendances.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const csvData = [
      ['Date', 'Session', 'User', 'Email', 'Status', 'Check-in Time', 'Duration', 'Method', 'Late Minutes', 'Notes'],
      ...attendances.map((record: Attendance) => [
        record.session?.sessionDate ? new Date(record.session.sessionDate).toLocaleDateString() : 'N/A',
        record.session?.title || 'Unknown Session',
        `${record.user?.firstName || ''} ${record.user?.lastName || ''}`.trim(),
        record.user?.email || '',
        record.status,
        record.checkInTime ? new Date(record.checkInTime).toLocaleString() : 'N/A',
        record.duration ? `${record.duration} minutes` : 'N/A',
        attendanceService.formatMarkedVia(record.markedVia),
        record.isLate ? record.lateMinutes || 0 : 0,
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance history exported successfully!');
  };

  const getFilteredAttendances = () => {
    if (!attendanceData?.data) return [];

    const attendances = Array.isArray(attendanceData.data)
      ? attendanceData.data
      : attendanceData.data.attendances || [];

    return attendances.filter((record: Attendance) =>
      searchTerm === '' ||
      record.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.session?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredAttendances = getFilteredAttendances();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Attendance History</h2>
            <p className="text-sm text-gray-600">View and analyze attendance records over time</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                showFilters ? 'bg-[#be8533] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredAttendances.length === 0}
              className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchAttendanceHistory}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters & Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange({ status: e.target.value as any })}
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
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Records per page</label>
              <select
                value={filters.limit || 20}
                onChange={(e) => handleFilterChange({ limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, session, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#be8533] w-full"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-[#be8533] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#a06b1f] transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {summaryData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-[#be8533]" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{summaryData.totalSessions}</p>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{summaryData.attendedSessions}</p>
                <p className="text-sm font-medium text-gray-600">Attended</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{summaryData.lateAttendances}</p>
                <p className="text-sm font-medium text-gray-600">Late</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-[#be8533] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">%</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{summaryData.attendancePercentage}%</p>
                <p className="text-sm font-medium text-gray-600">Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-medium text-gray-900">
              Attendance Records 
              {attendanceData?.pagination && (
                <span className="text-sm font-normal text-gray-500">
                  ({attendanceData.pagination.totalResults} total)
                </span>
              )}
            </h3>
            {filteredAttendances.length !== (attendanceData?.results || 0) && (
              <p className="text-sm text-gray-600">
                Showing {filteredAttendances.length} filtered results
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#be8533]"></div>
            </div>
          ) : filteredAttendances.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time & Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendances.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.session?.title || 'Unknown Session'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.session?.sessionDate 
                                ? new Date(record.session.sessionDate).toLocaleDateString()
                                : new Date(record.createdAt).toLocaleDateString()
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.user?.firstName} {record.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{record.user?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attendanceService.getStatusColorClass(record.status)
                          }`}>
                            {attendanceService.formatStatus(record.status).text}
                            {record.isLate && ` (+${record.lateMinutes || 0}m)`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>
                            <div>
                              {record.checkInTime 
                                ? new Date(record.checkInTime).toLocaleTimeString()
                                : new Date(record.createdAt).toLocaleTimeString()
                              }
                            </div>
                            {record.duration && (
                              <div className="text-xs text-gray-400">
                                Duration: {record.duration}m
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {attendanceService.formatMarkedVia(record.markedVia)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredAttendances.map((record) => (
                  <div key={record.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {record.session?.title || 'Unknown Session'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {record.session?.sessionDate 
                            ? new Date(record.session.sessionDate).toLocaleDateString()
                            : new Date(record.createdAt).toLocaleDateString()
                          }
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        attendanceService.getStatusColorClass(record.status)
                      }`}>
                        {attendanceService.formatStatus(record.status).text}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{record.user?.firstName} {record.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{record.user?.email}</p>
                      <div className="flex justify-between mt-2 text-xs">
                        <span>
                          {record.checkInTime 
                            ? new Date(record.checkInTime).toLocaleTimeString()
                            : new Date(record.createdAt).toLocaleTimeString()
                          }
                        </span>
                        <span>{attendanceService.formatMarkedVia(record.markedVia)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filters.status !== 'all' || filters.startDate || filters.endDate
                  ? 'No records match your current filters.'
                  : 'No attendance records found.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {attendanceData?.pagination && attendanceData.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page! <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page! >= attendanceData.pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{filters.page}</span> of{' '}
                    <span className="font-medium">{attendanceData.pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page! <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, attendanceData.pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(attendanceData.pagination.totalPages - 4, filters.page! - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === filters.page
                              ? 'z-10 bg-[#be8533] border-[#be8533] text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page! >= attendanceData.pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
