import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import type { AttendanceData } from '../../../services/dashboardService';
import theme from '../../../config/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AttendanceChartsProps {
  data: AttendanceData;
  loading?: boolean;
}

const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="attendance-charts loading">
        <div className="p-4 text-center" style={{ color: theme.colors.text.secondary }}>
          Loading attendance charts...
        </div>
      </div>
    );
  }

  // Line chart data for attendance trends
  const trendData = {
    labels: data.trends.daily.map((item) =>
      new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    ),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: data.trends.daily.map((item) => item.value),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  // Doughnut chart data for status distribution
  const statusData = {
    labels: data.statusDistribution.labels,
    datasets: [
      {
        data: data.statusDistribution.values,
        backgroundColor: data.statusDistribution.colors,
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff',
      },
    ],
  };

  // Bar chart data for session attendance
  const sessionData = {
    labels: data.bySession
      .slice(0, 10)
      .map((session) =>
        session.sessionName.length > 15
          ? session.sessionName.substring(0, 15) + '...'
          : session.sessionName
      ),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: data.bySession
          .slice(0, 10)
          .map((session) => session.attendanceRate),
        backgroundColor: data.bySession.slice(0, 10).map((session) =>
          session.attendanceRate >= 80
            ? '#10B981'
            : session.attendanceRate >= 60
            ? '#F59E0B'
            : '#EF4444'
        ),
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const getResponsiveOptions = (baseOptions: any, titleText: string) => ({
    ...baseOptions,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...baseOptions.plugins,
      title: {
        ...baseOptions.plugins?.title,
        display: true,
        text: titleText,
        font: {
          family: 'Inter, sans-serif',
          size: window.innerWidth < 640 ? 14 : 16,
          weight: 'bold',
        },
      },
      legend: {
        ...baseOptions.plugins?.legend,
        labels: {
          ...baseOptions.plugins?.legend?.labels,
          font: {
            family: 'Inter, sans-serif',
            size: window.innerWidth < 640 ? 10 : 12,
          },
          padding: window.innerWidth < 640 ? 10 : 20,
        },
      },
    },
    scales: baseOptions.scales ? {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        ticks: {
          ...baseOptions.scales.y.ticks,
          font: {
            family: 'Inter, sans-serif',
            size: window.innerWidth < 640 ? 10 : 12,
          },
        },
      },
      x: {
        ...baseOptions.scales.x,
        ticks: {
          ...baseOptions.scales.x.ticks,
          font: {
            family: 'Inter, sans-serif',
            size: window.innerWidth < 640 ? 9 : 11,
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0,
        },
      },
    } : undefined,
  });

  const trendOptions = {
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            return `Attendance: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: string | number) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const statusOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          generateLabels: function (chart: ChartJS) {
            const data = chart.data;
            return (
              data.labels?.map((label: string, index: number) => ({
                text: `${label}: ${data.datasets[0].data[index]}`,
                fillStyle: data.datasets[0].backgroundColor?.[index] || '#000',
                strokeStyle: data.datasets[0].backgroundColor?.[index] || '#000',
                lineWidth: 0,
                index: index,
              })) || []
            );
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<'doughnut'>) {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  const sessionOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            return `Attendance: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value: string | number) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="attendance-charts">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Summary Cards */}
        <div className="rounded-lg border p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: theme.colors.text.primary }}>
            Attendance Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {data.summary.averageAttendanceRate.toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>Average Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {data.summary.totalSessions}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                {data.summary.todaysSessions}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>Today's Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                {data.summary.upcomingSessions}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>Upcoming Sessions</div>
            </div>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="rounded-lg border p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="h-60 sm:h-72 lg:h-80">
            <Doughnut data={statusData} options={getResponsiveOptions(statusOptions, 'Attendance Status Distribution')} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Attendance Trends */}
        <div className="rounded-lg border p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="h-64 sm:h-80 lg:h-96">
            <Line data={trendData} options={getResponsiveOptions(trendOptions, 'Daily Attendance Trends')} />
          </div>
        </div>

        {/* Session Attendance Rates */}
        <div className="rounded-lg border p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <div className="h-64 sm:h-80 lg:h-96">
            <Bar data={sessionData} options={getResponsiveOptions(sessionOptions, 'Session Attendance Rates')} />
          </div>
        </div>
      </div>

      {/* Personal Stats (if available) */}
      {data.personalStats && (
        <div className="mt-4 sm:mt-6 rounded-lg border p-4 sm:p-6" style={{ backgroundColor: theme.colors.background.paper }}>
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: theme.colors.text.primary }}>
            My Attendance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {data.personalStats.myAttendanceRate}%
              </div>
              <div className="text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>My Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {data.personalStats.sessionsAttended}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>Sessions Attended</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">
                {data.personalStats.sessionsTotal}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: theme.colors.text.secondary }}>Total Sessions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCharts;
