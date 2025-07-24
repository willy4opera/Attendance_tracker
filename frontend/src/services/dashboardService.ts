import api from './api';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  interval?: 'daily' | 'weekly' | 'monthly';
  sections?: string[];
}

export interface OverviewStats {
  totalUsers: number;
  activeTasks: number;
  completedTasks: number;
  completionRate: number;
  upcomingSessions: number;
}

export interface AttendanceData {
  summary: {
    totalSessions: number;
    totalAttendance: number;
    averageAttendanceRate: number;
    todaysSessions: number;
    upcomingSessions: number;
  };
  trends: {
    daily: Array<{ date: string; value: number }>;
    weekly: Array<{ date: string; value: number }>;
    monthly: Array<{ date: string; value: number }>;
  };
  statusDistribution: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  bySession: Array<{
    sessionName: string;
    date: string;
    attendanceRate: number;
    totalAttendees: number;
  }>;
  personalStats?: {
    myAttendanceRate: number;
    sessionsAttended: number;
    sessionsTotal: number;
    recentAttendance: Array<{
      sessionId: string;
      sessionName: string;
      date: string;
      status: string;
    }>;
  };
}

export interface TaskData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    onHoldTasks: number;
    cancelledTasks: number;
    overdueTasks: number;
    dueSoonTasks: number;
    completionRate: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  byAssignee: Array<{
    assignee: {
      id: number | null;
      name: string;
      email: string | null;
    };
    count: number;
  }>;
  completionTrends: Array<{
    date: string;
    completed: number;
  }>;
}

export interface SessionData {
  summary: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    todaySessions: number;
    averageAttendance: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  attendanceRates: {
    average: number;
    sessionsAnalyzed: number;
    description: string;
  };
  recentSessions: Array<{
    id: string;
    title: string;
    date: string;
    status: string;
    attendance: {
      expected: number;
      actual: number;
      present: number;
      late: number;
      absent: number;
      rate: number;
    };
  }>;
}

export interface ProjectData {
  summary: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;
    cancelledProjects: number;
    completionRate: number;
  };
  progress: Array<{
    id: number;
    name: string;
    progress: number;
    status: string;
  }>;
  taskDistribution: Array<{
    projectId: number;
    projectName: string;
    taskCount: number;
  }>;
}

export interface UserData {
  summary: {
    totalUsers: number;
    activeUsers24h: number;
    activeUsers7d: number;
    activeUsers30d: number;
    newUsersThisMonth: number;
    engagementRate: number;
  };
  registrationTrends: Array<{
    date: string;
    count: number;
  }>;
  topContributors: Array<{
    id: number;
    name: string;
    email: string;
    taskCount: number;
  }>;
}

export interface ActivityData {
  recentActivities: Array<{
    id: number;
    action: string;
    description: string;
    user: {
      id: number;
      name: string;
    } | null;
    createdAt: string;
  }>;
  byType: Array<{
    type: string;
    count: number;
  }>;
}

export interface TrendData {
  taskProgress: Array<{
    date: string;
    completed: number;
  }>;
  userEngagement: Array<{
    date: string;
    activeUsers: number;
  }>;
}

export interface DashboardData {
  overview: OverviewStats;
  attendance: AttendanceData | null;
  tasks: TaskData | null;
  taskCompletionRates: any[] | null;
  tasksByProject: any[] | null;
  projects: ProjectData | null;
  sessions: SessionData | null;
  users: UserData | null;
  activities: ActivityData | null;
  trends: TrendData | null;
}

export interface DashboardResponse {
  status: string;
  data: DashboardData;
  meta: {
    generatedAt: string;
    dateRange: {
      start: string;
      end: string;
    };
    userRole: string;
    processingTime: string;
    interval: string;
  };
}

class DashboardService {
  async getComprehensiveDashboard(filters: DashboardFilters = {}): Promise<DashboardResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.interval) params.append('interval', filters.interval);
      if (filters.sections && filters.sections.length > 0) {
        params.append('sections', filters.sections.join(','));
      }

      const response = await api.get(`/dashboard-charts/comprehensive?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  async getOverviewStats(): Promise<OverviewStats> {
    try {
      const response = await this.getComprehensiveDashboard({ sections: ['overview'] });
      return response.data.overview;
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      throw new Error('Failed to fetch overview statistics');
    }
  }

  async getAttendanceData(filters: DashboardFilters = {}): Promise<AttendanceData> {
    try {
      const response = await this.getComprehensiveDashboard({ 
        ...filters, 
        sections: ['attendance'] 
      });
      return response.data.attendance!;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      throw new Error('Failed to fetch attendance data');
    }
  }

  async getTaskData(filters: DashboardFilters = {}): Promise<TaskData> {
    try {
      const response = await this.getComprehensiveDashboard({ 
        ...filters, 
        sections: ['tasks'] 
      });
      return response.data.tasks!;
    } catch (error) {
      console.error('Error fetching task data:', error);
      throw new Error('Failed to fetch task data');
    }
  }

  async getSessionData(filters: DashboardFilters = {}): Promise<SessionData> {
    try {
      const response = await this.getComprehensiveDashboard({ 
        ...filters, 
        sections: ['sessions'] 
      });
      return response.data.sessions!;
    } catch (error) {
      console.error('Error fetching session data:', error);
      throw new Error('Failed to fetch session data');
    }
  }

  async getProjectData(filters: DashboardFilters = {}): Promise<ProjectData> {
    try {
      const response = await this.getComprehensiveDashboard({ 
        ...filters, 
        sections: ['projects'] 
      });
      return response.data.projects!;
    } catch (error) {
      console.error('Error fetching project data:', error);
      throw new Error('Failed to fetch project data');
    }
  }
}

export default new DashboardService();
