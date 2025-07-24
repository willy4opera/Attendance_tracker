import React from "react";
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
} from "chart.js";
import type { TooltipItem } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import type { SessionData } from "../../../services/dashboardService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

interface SessionChartsProps {
  data: SessionData;
  loading?: boolean;
}

const SessionCharts: React.FC<SessionChartsProps> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="session-charts loading">
        <div className="chart-skeleton">Loading session charts...</div>
      </div>
    );
  }

  // Status distribution chart
  const statusData = {
    labels: data.byStatus.map(
      (item) => item.status.charAt(0).toUpperCase() + item.status.slice(1),
    ),
    datasets: [
      {
        data: data.byStatus.map((item) => item.count),
        backgroundColor: [
          "#10B981", // active - green
          "#3B82F6", // scheduled - blue
          "#6B7280", // completed - gray
          "#F59E0B", // pending - yellow
          "#EF4444", // cancelled - red
        ],
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: "#fff",
      },
    ],
  };

  // Category distribution chart
  const categoryData = {
    labels: data.byCategory.map(
      (item) => item.category.charAt(0).toUpperCase() + item.category.slice(1),
    ),
    datasets: [
      {
        label: "Sessions by Category",
        data: data.byCategory.map((item) => item.count),
        backgroundColor: [
          "#3B82F6", // technical - blue
          "#10B981", // training - green
          "#F59E0B", // meeting - yellow
          "#8B5CF6", // workshop - purple
          "#EF4444", // other - red
          "#6B7280", // unspecified - gray
        ],
        borderRadius: 4,
      },
    ],
  };

  // Recent sessions attendance rates
  const recentSessionsData = {
    labels: data.recentSessions
      .slice(0, 8)
      .map((session) =>
        session.title.length > 15
          ? session.title.substring(0, 15) + "..."
          : session.title,
      ),
    datasets: [
      {
        label: "Attendance Rate (%)",
        data: data.recentSessions
          .slice(0, 8)
          .map((session) => session.attendance.rate),
        backgroundColor: data.recentSessions
          .slice(0, 8)
          .map((session) =>
            session.attendance.rate >= 80
              ? "#10B981"
              : session.attendance.rate >= 60
                ? "#F59E0B"
                : "#EF4444",
          ),
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          font: {
            family: "Inter, sans-serif",
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: "Inter, sans-serif",
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          font: {
            family: "Inter, sans-serif",
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const attendanceBarOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        max: 100,
        ticks: {
          ...barOptions.scales.y.ticks,
          callback: function (value: string | number) {
            return value + "%";
          },
        },
      },
    },
    plugins: {
      ...barOptions.plugins,
      tooltip: {
        ...barOptions.plugins.tooltip,
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            return `Attendance: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
  };

  return (
    <div className="session-charts">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {data.summary.totalSessions}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Total Sessions</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {data.summary.completedSessions}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Completed</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {data.summary.upcomingSessions}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Upcoming</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {data.summary.averageAttendance.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Avg Attendance</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sessions by Status
          </h3>
          <div style={{ height: "300px" }}>
            <Doughnut data={statusData} options={chartOptions} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sessions by Category
          </h3>
          <div style={{ height: "300px" }}>
            <Bar data={categoryData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Recent Sessions Attendance */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Sessions Attendance
        </h3>
        <div style={{ height: "400px" }}>
          <Bar data={recentSessionsData} options={attendanceBarOptions} />
        </div>
      </div>

      {/* Attendance Rate Info */}
      <div className="mt-6 bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance Analysis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {data.attendanceRates.average.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600 font-medium">
              Average Rate
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Based on {data.attendanceRates.sessionsAnalyzed} sessions
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {data.summary.todaySessions}
            </div>
            <div className="text-xs text-green-600 font-medium">
              Today's Sessions
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Scheduled for today
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {data.recentSessions.length}
            </div>
            <div className="text-xs text-purple-600 font-medium">
              Recent Sessions
            </div>
            <div className="text-xs text-gray-500 mt-1">In the analysis</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-600 text-center">
          {data.attendanceRates.description}
        </div>
      </div>
    </div>
  );
};

export default SessionCharts;

