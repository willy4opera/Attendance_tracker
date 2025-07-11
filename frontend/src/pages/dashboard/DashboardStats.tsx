import React from 'react';
import {
  AiOutlineUser,
  AiOutlineTeam,
  AiOutlineClockCircle,
  AiOutlineBarChart
} from 'react-icons/ai';

interface Stats {
  presentToday: number;
  totalEmployees: number;
  onTimeRate: number;
  attendanceRate: number;
}

interface DashboardStatsProps {
  stats: Stats | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Present Today',
      value: stats?.presentToday || 0,
      icon: <AiOutlineUser className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: <AiOutlineTeam className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'On-Time Rate',
      value: `${stats?.onTimeRate || 0}%`,
      icon: <AiOutlineClockCircle className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      trend: { value: 2.3, isPositive: true }
    },
    {
      title: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: <AiOutlineBarChart className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: { value: 1.5, isPositive: false }
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
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
  );
};

export default DashboardStats;
