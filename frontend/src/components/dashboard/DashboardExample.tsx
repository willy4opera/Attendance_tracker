import React from 'react';
import ComprehensiveDashboard from './ComprehensiveDashboard';

/**
 * Example usage of the Comprehensive Dashboard
 * 
 * This component demonstrates how to integrate the dashboard
 * into your application with different configurations.
 */

// Basic usage
export const BasicDashboard: React.FC = () => {
  return <ComprehensiveDashboard />;
};

// Dashboard with auto-refresh
export const AutoRefreshDashboard: React.FC = () => {
  return (
    <ComprehensiveDashboard
      autoRefresh={true}
      refreshInterval={300000} // 5 minutes
    />
  );
};

// Dashboard with specific sections only
export const CustomSectionsDashboard: React.FC = () => {
  return (
    <ComprehensiveDashboard
      defaultSections={['overview', 'attendance', 'tasks']}
    />
  );
};

// Full featured dashboard
export const FullFeaturedDashboard: React.FC = () => {
  return (
    <ComprehensiveDashboard
      autoRefresh={true}
      refreshInterval={180000} // 3 minutes
      defaultSections={['overview', 'attendance', 'tasks', 'sessions', 'projects']}
    />
  );
};

// Usage in your main app component:
/*
import { ComprehensiveDashboard } from './components/dashboard';

function App() {
  return (
    <div className="App">
      <ComprehensiveDashboard
        autoRefresh={true}
        refreshInterval={300000}
      />
    </div>
  );
}
*/

export default ComprehensiveDashboard;
