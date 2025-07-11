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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/attendance/stats/today');
        setStats(response.data.data);
      } catch (error) {
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
      icon: <AiOutlineUser className="w-6 h-6" />,
      color: 'text-green-600',
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <AiOutlineTeam className="w-6 h-6" />,
      color: 'text-blue-600'
    },
    {
      title: 'On-Time Rate',
      value: `${stats?.onTimeRate || 0}%`,
      icon: <AiOutlineClockCircle className="w-6 h-6" />,
      color: 'text-yellow-600',
      trend: { value: 2.3, isPositive: true }
    },
    {
      title: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: <AiOutlineBarChart className="w-6 h-6" />,
      color: 'text-purple-600',
      trend: { value: 1.5, isPositive: false }
    }
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Quick check-in/out',
      icon: <AiOutlineCheckCircle className="w-8 h-8" />,
      link: '/attendance/mark',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'View Reports',
      description: 'Attendance analytics',
      icon: <FaChartLine className="w-8 h-8" />,
      link: '/reports',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Manage Employees',
      description: 'Employee directory',
      icon: <AiOutlineTeam className="w-8 h-8" />,
      link: '/employees',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'QR Scanner',
      description: 'Scan QR codes',
      icon: <AiOutlineQrcode className="w-8 h-8" />,
      link: '/attendance/qr-scanner',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 lg:px-8 py-4 lg:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {user?.firstName || user?.email}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your attendance system today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color.replace('text-', 'bg-').replace('600', '100')} ${stat.color}`}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <div className={`flex items-center text-sm ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    <span>{stat.trend.isPositive ? '+' : '-'}{stat.trend.value}%</span>
                  </div>
                )}
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-all hover:scale-105 block"
              >
                <div className={`mb-4 ${action.iconColor}`}>
                  {action.icon}
                </div>
                <h4 className="font-semibold mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Activity</h2>
            <Link to="/attendance/history" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="text-center text-gray-500 py-8">
            <AiOutlineCalendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
