import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import type { DashboardData, DashboardFilters } from '../services/dashboardService';

interface UseDashboardProps {
  startDate?: string;
  endDate?: string;
  interval?: 'daily' | 'weekly' | 'monthly';
  sections?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  meta: {
    generatedAt?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    userRole?: string;
    processingTime?: string;
    interval?: string;
  } | null;
}

export const useDashboard = (props: UseDashboardProps = {}): UseDashboardReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: DashboardFilters = {
        startDate: props.startDate,
        endDate: props.endDate,
        interval: props.interval || 'daily',
        sections: props.sections
      };
      
      const response = await dashboardService.getComprehensiveDashboard(filters);
      
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [props.startDate, props.endDate, props.interval, props.sections]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh functionality
  useEffect(() => {
    if (props.autoRefresh && props.refreshInterval) {
      const interval = setInterval(fetchDashboard, props.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [props.autoRefresh, props.refreshInterval, fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
    meta
  };
};

// Hook for specific dashboard sections
export const useDashboardSection = (section: string, filters: DashboardFilters = {}) => {
  const { data, loading, error, refetch } = useDashboard({
    ...filters,
    sections: [section]
  });

  return {
    data: data ? (data as any)[section] : null,
    loading,
    error,
    refetch
  };
};

// Hook for overview stats only
export const useOverviewStats = (filters: DashboardFilters = {}) => {
  return useDashboardSection('overview', filters);
};

// Hook for attendance data only
export const useAttendanceData = (filters: DashboardFilters = {}) => {
  return useDashboardSection('attendance', filters);
};

// Hook for task data only
export const useTaskData = (filters: DashboardFilters = {}) => {
  return useDashboardSection('tasks', filters);
};

// Hook for session data only
export const useSessionData = (filters: DashboardFilters = {}) => {
  return useDashboardSection('sessions', filters);
};

// Hook for project data only
export const useProjectData = (filters: DashboardFilters = {}) => {
  return useDashboardSection('projects', filters);
};
