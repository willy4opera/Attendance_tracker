import React, { useEffect, useState } from 'react';
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
import type { TooltipItem, ChartData } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { ProjectData } from '../../../services/dashboardService';

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

interface ProjectChartsProps {
  data: ProjectData;
  loading?: boolean;
}

const ProjectCharts: React.FC<ProjectChartsProps> = ({ data, loading = false }) => {
  const [chartDimensions, setChartDimensions] = useState({
    width: 400,
    height: 300,
    isMobile: false,
    isTablet: false,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      
      setChartDimensions({
        width: isMobile ? width - 40 : isTablet ? width / 2 - 40 : 400,
        height: isMobile ? 220 : isTablet ? 250 : 300,
        isMobile,
        isTablet,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (loading) {
    return (
      <div className="project-charts loading">
        <div className="chart-skeleton animate-pulse bg-gray-200 rounded-lg h-32 flex items-center justify-center">
          <span className="text-gray-500 text-sm sm:text-base">Loading project charts...</span>
        </div>
      </div>
    );
  }

  // Project status distribution
  const statusData: ChartData<'doughnut'> = {
    labels: ['Active', 'Completed', 'On Hold', 'Cancelled'],
    datasets: [
      {
        data: [
          data.summary.activeProjects,
          data.summary.completedProjects,
          data.summary.onHoldProjects,
          data.summary.cancelledProjects,
        ],
        backgroundColor: [
          '#10B981', // active - green
          '#3B82F6', // completed - blue
          '#F59E0B', // on hold - yellow
          '#EF4444', // cancelled - red
        ],
        borderWidth: 0,
        hoverBorderWidth: chartDimensions.isMobile ? 1 : 2,
        hoverBorderColor: '#fff',
      },
    ],
  };

  // Project progress chart
  const progressData: ChartData<'bar'> = {
    labels: data.progress.map(project => {
      const maxLength = chartDimensions.isMobile ? 12 : chartDimensions.isTablet ? 15 : 20;
      return project.name.length > maxLength 
        ? project.name.substring(0, maxLength) + '...' 
        : project.name;
    }),
    datasets: [
      {
        label: 'Progress (%)',
        data: data.progress.map(project => project.progress),
        backgroundColor: data.progress.map(project => 
          project.progress >= 80 ? '#10B981' :
          project.progress >= 50 ? '#3B82F6' :
          project.progress >= 25 ? '#F59E0B' : '#EF4444'
        ),
        borderRadius: chartDimensions.isMobile ? 2 : 4,
      },
    ],
  };

  // Task distribution by project
  const taskDistributionData: ChartData<'bar'> = {
    labels: data.taskDistribution.map(project => {
      const maxLength = chartDimensions.isMobile ? 10 : chartDimensions.isTablet ? 12 : 15;
      return project.projectName.length > maxLength 
        ? project.projectName.substring(0, maxLength) + '...' 
        : project.projectName;
    }),
    datasets: [
      {
        label: 'Number of Tasks',
        data: data.taskDistribution.map(project => project.taskCount),
        backgroundColor: '#8B5CF6',
        borderRadius: chartDimensions.isMobile ? 2 : 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: chartDimensions.isMobile ? 10 : 20,
          font: {
            family: 'Inter, sans-serif',
            size: chartDimensions.isMobile ? 10 : chartDimensions.isTablet ? 11 : 12,
          },
          boxWidth: chartDimensions.isMobile ? 10 : 12,
          usePointStyle: chartDimensions.isMobile,
          generateLabels: function(chart: ChartJS) {
            const chartData = chart.data;
            if (chartData.datasets[0].data) {
              return chartData.labels?.map((label: string, index: number) => ({
                text: chartDimensions.isMobile 
                  ? `${label}: ${(chartData.datasets[0].data as number[])[index]}`
                  : `${label}: ${(chartData.datasets[0].data as number[])[index]}`,
                fillStyle: (chartData.datasets[0].backgroundColor as string[])[index],
                strokeStyle: (chartData.datasets[0].backgroundColor as string[])[index],
                lineWidth: 0,
                index: index
              })) || [];
            }
            return [];
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          size: chartDimensions.isMobile ? 11 : 12,
        },
        bodyFont: {
          size: chartDimensions.isMobile ? 10 : 11,
        },
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        titleFont: {
          size: chartDimensions.isMobile ? 11 : 12,
        },
        bodyFont: {
          size: chartDimensions.isMobile ? 10 : 11,
        },
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: chartDimensions.isMobile ? 10 : 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          maxRotation: chartDimensions.isMobile ? 90 : 45,
          font: {
            family: 'Inter, sans-serif',
            size: chartDimensions.isMobile ? 9 : 10,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const progressBarOptions = {
    ...barOptions,
    scales: {
      ...barOptions.scales,
      y: {
        ...barOptions.scales.y,
        max: 100,
        ticks: {
          ...barOptions.scales.y.ticks,
          callback: function(value: string | number) {
            return value + '%';
          }
        }
      }
    },
    plugins: {
      ...barOptions.plugins,
      tooltip: {
        ...barOptions.plugins.tooltip,
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            return `Progress: ${context.parsed.y}%`;
          }
        }
      }
    }
  };

  return (
    <div className="project-charts space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg border p-2 sm:p-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
              {data.summary.totalProjects}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Total Projects</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-2 sm:p-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              {data.summary.activeProjects}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Active</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-2 sm:p-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
              {data.summary.completedProjects}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Completed</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-2 sm:p-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
              {data.summary.completionRate.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Completion Rate</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border p-3 sm:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
            Project Status Distribution
          </h3>
          <div style={{ height: `${chartDimensions.height}px` }}>
            {data.summary.totalProjects > 0 ? (
              <Doughnut data={statusData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">No projects available</div>
                  <div className="text-xs sm:text-sm">Create some projects to see the distribution</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-lg border p-3 sm:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
            Project Progress
          </h3>
          <div style={{ height: `${chartDimensions.height}px` }}>
            {data.progress.length > 0 ? (
              <Bar data={progressData} options={progressBarOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">No progress data</div>
                  <div className="text-xs sm:text-sm">Update project progress to see charts</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Distribution by Project */}
      <div className="bg-white rounded-lg border p-3 sm:p-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
          Tasks per Project
        </h3>
        <div style={{ height: `${chartDimensions.isMobile ? 280 : chartDimensions.isTablet ? 320 : 400}px` }}>
          {data.taskDistribution.length > 0 ? (
            <Bar data={taskDistributionData} options={barOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-sm sm:text-base lg:text-lg font-medium">No task distribution data</div>
                <div className="text-xs sm:text-sm">Assign tasks to projects to see the distribution</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Details Table */}
      {data.progress.length > 0 && (
        <div className="bg-white rounded-lg border p-3 sm:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">
            Project Details
          </h3>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.progress.map((project) => {
                  const taskInfo = data.taskDistribution.find(t => t.projectId === project.id);
                  return (
                    <tr key={project.id}>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                        <div className="truncate max-w-[120px] sm:max-w-none">
                          {project.name}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2 mr-1 sm:mr-2">
                            <div 
                              className="bg-blue-600 h-1.5 sm:h-2 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">
                        {taskInfo ? taskInfo.taskCount : 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCharts;
