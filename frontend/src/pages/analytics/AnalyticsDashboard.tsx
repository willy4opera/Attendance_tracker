import React from 'react';
import { FaChartLine, FaChartBar, FaChartPie } from 'react-icons/fa';
import { AiOutlineBarChart, AiOutlineRise } from 'react-icons/ai';
import ComprehensiveDashboard from '../../components/dashboard/ComprehensiveDashboard';
import theme from '../../config/theme';

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="min-h-screen px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="rounded-lg shadow p-4 sm:p-6 mb-6" style={{ backgroundColor: theme.colors.background.paper }}>
          {/* Title Section */}
          <div className="flex items-center space-x-3 mb-4">
            <div 
              className="p-2 rounded-lg flex-shrink-0"
              style={{ backgroundColor: theme.colors.primary + '20' }}
            >
              <AiOutlineBarChart 
                className="w-6 h-6 sm:w-8 sm:h-8"
                style={{ color: theme.colors.primary }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate" style={{ color: theme.colors.text.primary }}>
                Analytics Dashboard
              </h1>
              <p className="text-sm sm:text-base" style={{ color: theme.colors.text.secondary }}>
                Comprehensive insights and data visualization
              </p>
            </div>
          </div>
            
          {/* Analytics Features Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
            <div className="text-center p-3 rounded-lg border" style={{ backgroundColor: theme.colors.background.default }}>
              <FaChartLine className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Trends</span>
            </div>
            <div className="text-center p-3 rounded-lg border" style={{ backgroundColor: theme.colors.background.default }}>
              <FaChartBar className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <span className="text-xs font-medium text-green-600">Reports</span>
            </div>
            <div className="text-center p-3 rounded-lg border" style={{ backgroundColor: theme.colors.background.default }}>
              <FaChartPie className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">Distribution</span>
            </div>
            <div className="text-center p-3 rounded-lg border" style={{ backgroundColor: theme.colors.background.default }}>
              <AiOutlineRise className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <span className="text-xs font-medium text-orange-600">Growth</span>
            </div>
          </div>
        </div>

        {/* Comprehensive Analytics Dashboard */}
        <ComprehensiveDashboard 
          autoRefresh={true}
          refreshInterval={300000} // 5 minutes
          defaultSections={['overview', 'attendance', 'tasks', 'sessions', 'projects']}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
