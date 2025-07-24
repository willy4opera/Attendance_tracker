// Main Dashboard Components
export { default as ComprehensiveDashboard } from './ComprehensiveDashboard';
export { default as OverviewStats } from './OverviewStats';

// Chart Components
export { default as AttendanceCharts } from './charts/AttendanceCharts';
export { default as TaskCharts } from './charts/TaskCharts';
export { default as SessionCharts } from './charts/SessionCharts';
export { default as ProjectCharts } from './charts/ProjectCharts';

// Hooks
export { 
  useDashboard, 
  useDashboardSection,
  useOverviewStats,
  useAttendanceData,
  useTaskData,
  useSessionData,
  useProjectData
} from '../../hooks/useDashboard';

// Services
export { default as dashboardService } from '../../services/dashboardService';
export type * from '../../services/dashboardService';
