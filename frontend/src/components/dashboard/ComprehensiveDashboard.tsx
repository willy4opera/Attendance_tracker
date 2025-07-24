import React, { useState } from 'react';
import {
  FaChartBar,
  FaUsers,
  FaTasks,
  FaCalendarAlt,
  FaProjectDiagram,
  FaSyncAlt,
  FaDownload,
  FaFilter,
} from 'react-icons/fa';
import { useDashboard } from '../../hooks/useDashboard';
import OverviewStats from './OverviewStats';
import AttendanceCharts from './charts/AttendanceCharts';
import TaskCharts from './charts/TaskCharts';
import SessionCharts from './charts/SessionCharts';
import ProjectCharts from './charts/ProjectCharts';
import theme from '../../config/theme';

interface ComprehensiveDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultSections?: string[];
}

const ComprehensiveDashboard: React.FC<ComprehensiveDashboardProps> = ({
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
  defaultSections = ['overview', 'attendance', 'tasks', 'sessions', 'projects'],
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [activeSections, setActiveSections] = useState<string[]>(defaultSections);
  const [showFilters, setShowFilters] = useState(false);

  const {
    data,
    loading,
    error,
    refetch,
    meta,
  } = useDashboard({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    interval,
    sections: activeSections,
    autoRefresh,
    refreshInterval,
  });

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleSection = (section: string) => {
    setActiveSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleExportData = () => {
    if (data) {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const availableSections = [
    { key: 'overview', label: 'Overview', icon: FaChartBar },
    { key: 'attendance', label: 'Attendance', icon: FaUsers },
    { key: 'tasks', label: 'Tasks', icon: FaTasks },
    { key: 'sessions', label: 'Sessions', icon: FaCalendarAlt },
    { key: 'projects', label: 'Projects', icon: FaProjectDiagram },
  ];

  if (loading && !data) {
    return (
      <div className="comprehensive-dashboard loading">
        <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: theme.colors.background.default }}>
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 rounded w-3/4 sm:w-1/4 mb-4 sm:mb-6" style={{ backgroundColor: theme.colors.secondary }}></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 sm:h-28 md:h-32 rounded-lg" style={{ backgroundColor: `${theme.colors.secondary}40` }}></div>
                ))}
              </div>
              <div className="space-y-4 sm:space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 sm:h-80 md:h-96 rounded-lg" style={{ backgroundColor: `${theme.colors.secondary}40` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comprehensive-dashboard error">
        <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: theme.colors.background.default }}>
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border p-4 sm:p-6 md:p-8 text-center" style={{ backgroundColor: theme.colors.background.paper }}>
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">⚠️</div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4" style={{ color: theme.colors.text.primary }}>
                Dashboard Error
              </h2>
              <p className="mb-4 sm:mb-6 text-sm sm:text-base" style={{ color: theme.colors.text.secondary }}>{error}</p>
              <button
                onClick={refetch}
                className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base"
                style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
              >
                <FaSyncAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comprehensive-dashboard">
      <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: theme.colors.background.default }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: theme.colors.text.primary }}>
                    Comprehensive Dashboard
                  </h1>
                  <div className="mt-1 text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>
                    <div className="block sm:inline">Real-time analytics and insights</div>
                    {meta && (
                      <div className="block sm:inline sm:ml-2 text-xs opacity-75 mt-1 sm:mt-0">
                        • Generated in {meta.processingTime}
                        • Updated {new Date(meta.generatedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center justify-center px-3 py-2 border rounded-lg text-xs sm:text-sm font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      borderColor: `${theme.colors.primary}40`,
                      color: theme.colors.text.primary,
                    }}
                  >
                    <FaFilter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Filters
                  </button>

                  <button
                    onClick={handleExportData}
                    className="inline-flex items-center justify-center px-3 py-2 border rounded-lg text-xs sm:text-sm font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      borderColor: `${theme.colors.primary}40`,
                      color: theme.colors.text.primary,
                    }}
                  >
                    <FaDownload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Export
                  </button>

                  <button
                    onClick={refetch}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg hover:scale-105 transition-all duration-200 font-medium text-xs sm:text-sm"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.secondary,
                    }}
                  >
                    <FaSyncAlt className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="rounded-lg border p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.paper }}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                        Date Range
                      </label>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                          style={{
                            color: theme.colors.text.primary,
                            backgroundColor: theme.colors.background.default,
                          }}
                          placeholder="Start Date"
                        />
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                          style={{
                            color: theme.colors.text.primary,
                            backgroundColor: theme.colors.background.default,
                          }}
                          placeholder="End Date"
                        />
                      </div>
                    </div>

                    {/* Interval */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                        Data Interval
                      </label>
                      <select
                        value={interval}
                        onChange={(e) => setInterval(e.target.value as 'daily' | 'weekly' | 'monthly')}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        style={{
                          color: theme.colors.text.primary,
                          backgroundColor: theme.colors.background.default,
                        }}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Sections */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                        Sections
                      </label>
                      <div className="space-y-2 max-h-32 sm:max-h-none overflow-y-auto sm:overflow-visible">
                        {availableSections.map((section) => (
                          <label key={section.key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={activeSections.includes(section.key)}
                              onChange={() => toggleSection(section.key)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <section.icon
                              className="w-3 h-3 sm:w-4 sm:h-4 ml-2 mr-2"
                              style={{ color: theme.colors.primary }}
                            />
                            <span className="text-xs sm:text-sm" style={{ color: theme.colors.text.primary }}>
                              {section.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Overview Stats */}
            {activeSections.includes('overview') && data?.overview && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                  <FaChartBar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.colors.primary }} />
                  Overview
                </h2>
                <OverviewStats data={data.overview} loading={loading} />
              </section>
            )}

            {/* Attendance Analytics */}
            {activeSections.includes('attendance') && data?.attendance && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                  <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.colors.success }} />
                  Attendance Analytics
                </h2>
                <AttendanceCharts data={data.attendance} loading={loading} />
              </section>
            )}

            {/* Task Management */}
            {activeSections.includes('tasks') && data?.tasks && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                  <FaTasks className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.colors.warning }} />
                  Task Analytics
                </h2>
                <TaskCharts data={data.tasks} loading={loading} />
              </section>
            )}

            {/* Session Analytics */}
            {activeSections.includes('sessions') && data?.sessions && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                  <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.colors.info }} />
                  Session Analytics
                </h2>
                <SessionCharts data={data.sessions} loading={loading} />
              </section>
            )}

            {/* Project Analytics */}
            {activeSections.includes('projects') && data?.projects && (
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center" style={{ color: theme.colors.text.primary }}>
                  <FaProjectDiagram className="w-4 h-4 sm:w-5 sm:h-5 mr-2" style={{ color: theme.colors.error }} />
                  Project Analytics
                </h2>
                <ProjectCharts data={data.projects} loading={loading} />
              </section>
            )}
          </div>

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <div
              className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-lg"
              style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
            >
              <div
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse mr-1 sm:mr-2"
                style={{ backgroundColor: theme.colors.success }}
              ></div>
              <span className="hidden sm:inline">Auto-refreshing every {Math.floor(refreshInterval / 60000)} minutes</span>
              <span className="sm:hidden">Auto-refresh</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;
