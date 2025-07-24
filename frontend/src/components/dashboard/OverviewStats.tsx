import React from 'react';
import { 
  FaUsers, 
  FaTasks, 
  FaCheckCircle, 
  FaCalendarAlt,
  FaChartLine,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import type { OverviewStats as OverviewStatsType } from '../../services/dashboardService';
import theme from '../../config/theme';

interface OverviewStatsProps {
  data: OverviewStatsType;
  loading?: boolean;
}

const OverviewStats: React.FC<OverviewStatsProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="overview-stats loading">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="rounded-lg border p-4 animate-pulse" style={{ backgroundColor: theme.colors.background.paper }}>
              <div className="flex flex-col">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-full w-10 h-10" style={{ backgroundColor: `${theme.colors.secondary}20` }}></div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="h-3 rounded mb-2" style={{ backgroundColor: `${theme.colors.secondary}20` }}></div>
                    <div className="h-4 rounded" style={{ backgroundColor: `${theme.colors.secondary}20` }}></div>
                  </div>
                </div>
                <div className="h-3 rounded" style={{ backgroundColor: `${theme.colors.secondary}20` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: data.totalUsers,
      icon: FaUsers,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Active users in system'
    },
    {
      title: 'Active Tasks',
      value: data.activeTasks,
      icon: FaTasks,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      description: 'Tasks in progress'
    },
    {
      title: 'Completed Tasks',
      value: data.completedTasks,
      icon: FaCheckCircle,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: 'Successfully completed'
    },
    {
      title: 'Completion Rate',
      value: `${data.completionRate}%`,
      icon: FaChartLine,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      description: 'Overall completion rate'
    },
    {
      title: 'Upcoming Sessions',
      value: data.upcomingSessions,
      icon: FaCalendarAlt,
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      description: 'Scheduled sessions'
    }
  ];

  return (
    <div className="overview-stats">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 p-4 min-w-0"
            style={{ backgroundColor: theme.colors.background.paper }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-3">
                <div className={`p-2 rounded-full flex-shrink-0 ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: theme.colors.text.secondary }}>
                    {stat.title}
                  </p>
                  <p className={`text-xl font-bold ${stat.textColor} truncate`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-xs truncate" style={{ color: theme.colors.text.secondary }}>
                  {stat.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Insights */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Indicator */}
        <div className="rounded-lg border p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold truncate" style={{ color: theme.colors.text.primary }}>Performance</h3>
              <p className="text-sm truncate" style={{ color: theme.colors.text.secondary }}>System performance metrics</p>
            </div>
            <div className={`p-2 rounded-full flex-shrink-0 ml-4 ${
              data.completionRate >= 80 ? 'bg-green-100' :
              data.completionRate >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {data.completionRate >= 80 ? (
                <FaCheckCircle className="w-5 h-5 text-green-600" />
              ) : data.completionRate >= 60 ? (
                <FaClock className="w-5 h-5 text-yellow-600" />
              ) : (
                <FaExclamationTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: theme.colors.text.secondary }}>Completion Rate</span>
              <span className={`font-semibold ${
                data.completionRate >= 80 ? 'text-green-600' :
                data.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.completionRate}%
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  data.completionRate >= 80 ? 'bg-green-500' :
                  data.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(data.completionRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="rounded-lg border p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold truncate" style={{ color: theme.colors.text.primary }}>Activity</h3>
              <p className="text-sm truncate" style={{ color: theme.colors.text.secondary }}>Current activity levels</p>
            </div>
            <FaTasks className="w-8 h-8 text-blue-600 flex-shrink-0 ml-4" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="truncate mr-2" style={{ color: theme.colors.text.secondary }}>Active Tasks</span>
              <span className="font-semibold text-orange-600 flex-shrink-0">
                {data.activeTasks.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="truncate mr-2" style={{ color: theme.colors.text.secondary }}>Completed Tasks</span>
              <span className="font-semibold text-green-600 flex-shrink-0">
                {data.completedTasks.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="truncate mr-2" style={{ color: theme.colors.text.secondary }}>Total Tasks</span>
              <span className="font-semibold flex-shrink-0" style={{ color: theme.colors.text.primary }}>
                {(data.activeTasks + data.completedTasks).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-lg border p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold truncate" style={{ color: theme.colors.text.primary }}>Schedule</h3>
              <p className="text-sm truncate" style={{ color: theme.colors.text.secondary }}>Upcoming sessions</p>
            </div>
            <FaCalendarAlt className="w-8 h-8 text-indigo-600 flex-shrink-0 ml-4" />
          </div>
          <div className="mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {data.upcomingSessions}
              </div>
              <div className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
                {data.upcomingSessions === 1 ? 'session scheduled' : 'sessions scheduled'}
              </div>
            </div>
            {data.upcomingSessions > 0 && (
              <div className="mt-3 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  <FaClock className="w-3 h-3 mr-1" />
                  Don't miss them!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats;
