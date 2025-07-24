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
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import type { TaskData } from '../../../services/dashboardService';

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

interface TaskChartsProps {
  data: TaskData;
  loading?: boolean;
}

const TaskCharts: React.FC<TaskChartsProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="task-charts loading">
        <div className="chart-skeleton">Loading task charts...</div>
      </div>
    );
  }

  // Status distribution chart
  const statusData = {
    labels: data.statusDistribution.map(item => 
      item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')
    ),
    datasets: [
      {
        data: data.statusDistribution.map(item => item.count),
        backgroundColor: [
          '#10B981', // completed - green
          '#3B82F6', // in-progress - blue
          '#F59E0B', // todo - yellow
          '#8B5CF6', // on-hold - purple
          '#EF4444', // cancelled - red
        ],
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff',
      },
    ],
  };

  // Priority distribution chart
  const priorityData = {
    labels: data.byPriority.map(item => 
      item.priority.charAt(0).toUpperCase() + item.priority.slice(1)
    ),
    datasets: [
      {
        label: 'Tasks by Priority',
        data: data.byPriority.map(item => item.count),
        backgroundColor: [
          '#EF4444', // urgent - red
          '#F59E0B', // high - orange
          '#3B82F6', // medium - blue
          '#10B981', // low - green
          '#6B7280', // none - gray
        ],
        borderRadius: 4,
      },
    ],
  };

  // Assignee distribution (top 10)
  const assigneeData = {
    labels: data.byAssignee.slice(0, 10).map(item => 
      item.assignee.name.length > 15 
        ? item.assignee.name.substring(0, 15) + '...' 
        : item.assignee.name
    ),
    datasets: [
      {
        label: 'Tasks Assigned',
        data: data.byAssignee.slice(0, 10).map(item => item.count),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
    ],
  };

  // Completion trends
  const trendsData = {
    labels: data.completionTrends.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Tasks Completed',
        data: data.completionTrends.map(item => item.completed),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Responsive chart options
  const getResponsiveChartOptions = (isMobile: boolean = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: isMobile ? 15 : 20,
          font: {
            family: 'Inter, sans-serif',
            size: isMobile ? 10 : 12,
          },
          boxWidth: isMobile ? 12 : 15,
          boxHeight: isMobile ? 12 : 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        titleFont: {
          size: isMobile ? 11 : 13,
        },
        bodyFont: {
          size: isMobile ? 10 : 12,
        },
        padding: isMobile ? 8 : 12,
      }
    },
  });

  const getBarOptions = (isMobile: boolean = false) => ({
    ...getResponsiveChartOptions(isMobile),
    plugins: {
      ...getResponsiveChartOptions(isMobile).plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: isMobile ? 9 : 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          maxRotation: isMobile ? 60 : 45,
          font: {
            family: 'Inter, sans-serif',
            size: isMobile ? 8 : 10,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  });

  const getLineOptions = (isMobile: boolean = false) => ({
    ...getResponsiveChartOptions(isMobile),
    plugins: {
      ...getResponsiveChartOptions(isMobile).plugins,
      title: {
        display: true,
        text: 'Task Completion Trends',
        font: {
          family: 'Inter, sans-serif',
          size: isMobile ? 14 : 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: isMobile ? 9 : 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: isMobile ? 9 : 11,
          },
          maxRotation: isMobile ? 45 : 0,
        },
        grid: {
          display: false,
        },
      },
    },
  });

  return (
    <div className="task-charts">
      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-lg border p-3 md:p-4">
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              {data.summary.totalTasks}
            </div>
            <div className="text-xs md:text-sm text-gray-500">Total Tasks</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-3 md:p-4">
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-green-600">
              {data.summary.completedTasks}
            </div>
            <div className="text-xs md:text-sm text-gray-500">Completed</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-3 md:p-4">
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-orange-600">
              {data.summary.overdueTasks}
            </div>
            <div className="text-xs md:text-sm text-gray-500">Overdue</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-3 md:p-4">
          <div className="text-center">
            <div className="text-lg md:text-2xl font-bold text-purple-600">
              {data.summary.completionRate.toFixed(1)}%
            </div>
            <div className="text-xs md:text-sm text-gray-500">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Main Charts - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Task Status Distribution
          </h3>
          <div className="h-64 md:h-80">
            <Doughnut 
              data={statusData} 
              options={getResponsiveChartOptions(window.innerWidth < 768)} 
            />
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg border p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Tasks by Priority
          </h3>
          <div className="h-64 md:h-80">
            <Bar 
              data={priorityData} 
              options={getBarOptions(window.innerWidth < 768)} 
            />
          </div>
        </div>
      </div>

      {/* Secondary Charts - Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Top Assignees */}
        <div className="bg-white rounded-lg border p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Top Assignees
          </h3>
          <div className="h-72 md:h-96">
            <Bar 
              data={assigneeData} 
              options={getBarOptions(window.innerWidth < 768)} 
            />
          </div>
        </div>

        {/* Completion Trends */}
        <div className="bg-white rounded-lg border p-4 md:p-6">
          <div className="h-72 md:h-96">
            {data.completionTrends.length > 0 ? (
              <Line 
                data={trendsData} 
                options={getLineOptions(window.innerWidth < 768)} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-sm md:text-lg font-medium">No completion data available</div>
                  <div className="text-xs md:text-sm">Complete some tasks to see trends</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Stats - Responsive Grid */}
      <div className="mt-4 md:mt-6 bg-white rounded-lg border p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
          Detailed Statistics
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-blue-600">
              {data.summary.inProgressTasks}
            </div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-yellow-600">
              {data.summary.todoTasks}
            </div>
            <div className="text-xs text-gray-500">To Do</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-purple-600">
              {data.summary.onHoldTasks}
            </div>
            <div className="text-xs text-gray-500">On Hold</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-red-600">
              {data.summary.cancelledTasks}
            </div>
            <div className="text-xs text-gray-500">Cancelled</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-orange-600">
              {data.summary.dueSoonTasks}
            </div>
            <div className="text-xs text-gray-500">Due Soon</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-gray-600">
              {data.byAssignee.length}
            </div>
            <div className="text-xs text-gray-500">Assignees</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCharts;
