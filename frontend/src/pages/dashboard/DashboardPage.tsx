import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineUser,
  AiOutlineBarChart,
  AiOutlineTeam,
  AiOutlineQrcode,
  AiOutlineCalendar
} from 'react-icons/ai';
import { FaChartLine } from 'react-icons/fa';
import ComprehensiveDashboard from '../../components/dashboard/ComprehensiveDashboard';
import theme from '../../config/theme';

interface DashboardStats {
  presentToday: number;
  totalEmployees: number;
  onTimeRate: number;
  attendanceRate: number;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComprehensive, setShowComprehensive] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/attendance/stats/today');
        setStats(response.data.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards: StatCard[] = [
    {
      title: 'Present Today',
      value: stats?.presentToday || 0,
      icon: <AiOutlineUser className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />,
      color: 'text-green-600',
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <AiOutlineTeam className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />,
      color: 'text-blue-600'
    },
    {
      title: 'On-Time Rate',
      value: `${stats?.onTimeRate || 0}%`,
      icon: <AiOutlineClockCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />,
      color: 'text-yellow-600',
      trend: { value: 2.3, isPositive: true }
    },
    {
      title: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: <AiOutlineBarChart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />,
      color: 'text-purple-600',
      trend: { value: 1.5, isPositive: false }
    }
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Quick check-in/out',
      icon: <AiOutlineCheckCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      link: '/attendance/mark',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'View Reports',
      description: 'Attendance analytics',
      icon: <FaChartLine className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      link: '/reports',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Manage Employees',
      description: 'Employee directory',
      icon: <AiOutlineTeam className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      link: '/employees',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'QR Scanner',
      description: 'Scan QR codes',
      icon: <AiOutlineQrcode className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      link: '/attendance/qr-scanner',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div 
          className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2"
          style={{ borderColor: theme.colors.primary }}
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="rounded-lg shadow p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-2 truncate" style={{ color: theme.colors.text.primary }}>
                Welcome back, {user?.firstName || user?.email}!
              </h1>
              <p className="text-sm sm:text-base" style={{ color: theme.colors.text.secondary }}>
                Here's what's happening with your attendance system today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto lg:flex-shrink-0">
              <button
                onClick={() => setShowComprehensive(false)}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                  !showComprehensive 
                    ? 'shadow-md transform scale-105' 
                    : 'hover:shadow-md hover:transform hover:scale-105'
                }`}
                style={{
                  backgroundColor: !showComprehensive ? theme.colors.primary : theme.colors.secondary,
                  color: !showComprehensive ? theme.colors.secondary : theme.colors.primary,
                }}
              >
                Overview
              </button>
              <button
                onClick={() => setShowComprehensive(true)}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center justify-center text-sm sm:text-base ${
                  showComprehensive 
                    ? 'shadow-md transform scale-105' 
                    : 'hover:shadow-md hover:transform hover:scale-105'
                }`}
                style={{
                  backgroundColor: showComprehensive ? theme.colors.primary : theme.colors.secondary,
                  color: showComprehensive ? theme.colors.secondary : theme.colors.primary,
                }}
              >
                <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {showComprehensive ? (
          /* Comprehensive Dashboard with Charts */
          <ComprehensiveDashboard 
            autoRefresh={true}
            refreshInterval={300000} // 5 minutes
            defaultSections={['overview', 'attendance', 'tasks', 'sessions', 'projects']}
          />
        ) : (
          /* Traditional Dashboard View */
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {statCards.map((stat, index) => (
                <div 
                  key={index} 
                  className="rounded-lg shadow p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow border min-w-0"
                  style={{ 
                    backgroundColor: theme.colors.background.paper,
                    borderColor: `${theme.colors.primary}20`
                  }}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${stat.color.replace('text-', 'bg-').replace('600', '100')} ${stat.color}`}>
                      {stat.icon}
                    </div>
                    {stat.trend && (
                      <div className={`flex items-center text-xs sm:text-sm flex-shrink-0 ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{stat.trend.isPositive ? '+' : '-'}{stat.trend.value}%</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm mb-1 truncate" style={{ color: theme.colors.text.secondary }}>{stat.title}</h3>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate" style={{ color: theme.colors.text.primary }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4" style={{ color: theme.colors.text.primary }}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="rounded-lg shadow p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all hover:scale-105 block border group min-w-0"
                    style={{ 
                      backgroundColor: theme.colors.background.paper,
                      borderColor: `${theme.colors.primary}20`
                    }}
                  >
                    <div className={`mb-3 sm:mb-4 ${action.iconColor} group-hover:scale-110 transition-transform flex-shrink-0`}>
                      {action.icon}
                    </div>
                    <h4 className="font-semibold mb-1 text-sm sm:text-base truncate" style={{ color: theme.colors.text.primary }}>
                      {action.title}
                    </h4>
                    <p className="text-xs sm:text-sm truncate" style={{ color: theme.colors.text.secondary }}>
                      {action.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div 
              className="rounded-lg shadow p-3 sm:p-4 lg:p-6 border"
              style={{ 
                backgroundColor: theme.colors.background.paper,
                borderColor: `${theme.colors.primary}20`
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                  Recent Activity
                </h2>
                <Link 
                  to="/attendance/history" 
                  className="text-xs sm:text-sm hover:underline transition-colors self-start sm:self-auto"
                  style={{ color: theme.colors.primary }}
                >
                  View All
                </Link>
              </div>
              <div className="text-center py-6 sm:py-8" style={{ color: theme.colors.text.secondary }}>
                <AiOutlineCalendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No recent activity to display</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
