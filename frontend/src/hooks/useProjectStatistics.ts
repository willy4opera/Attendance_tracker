import { useState, useEffect } from 'react';
import { statisticsAPI } from '../services/api';

// Types matching the new API response
interface OverallStatistics {
  total_projects: string;
  total_boards: string;
  total_tasks: string;
  completed_tasks: string;
  in_progress_tasks: string;
  todo_tasks: string;
  review_tasks: string;
  archived_tasks: string;
  total_unique_members: string;
  overall_completion_percentage: string;
}

interface ProjectStatistics {
  project_id: number;
  project_name: string;
  project_status: string;
  project_description: string;
  start_date: string | null;
  end_date: string | null;
  department_name: string | null;
  board_count: string;
  task_count: string;
  completed_tasks: string;
  in_progress_tasks: string;
  todo_tasks: string;
  review_tasks: string;
  archived_tasks: string;
  member_count: string;
  completion_percentage: string;
}

interface BoardStatistics {
  board_id: number;
  board_name: string;
  board_description: string | null;
  project_id: number | null;
  project_name: string | null;
  task_count: string;
  completed_tasks: string;
  in_progress_tasks: string;
  todo_tasks: string;
  review_tasks: string;
  archived_tasks: string;
  member_count: string;
  completion_percentage: string;
}

interface MemberProductivity {
  member_id: number;
  member_name: string;
  member_email: string;
  department_name: string | null;
  role_name: string;
  total_assigned_tasks: string;
  completed_tasks: string;
  in_progress_tasks: string;
  todo_tasks: string;
  review_tasks: string;
  projects_involved: string;
  boards_involved: string;
  completion_rate: string;
}

interface PriorityDistribution {
  priority: string;
  total: string;
  completed: string;
  in_progress: string;
  todo: string;
  under_review: string;
  completion_percentage: string;
}

interface RecentCompletion {
  id: number;
  title: string;
  completed_at: string;
  board_name: string;
  project_name: string | null;
  creator_name: string;
  assigned_members: string | null;
}

interface WeeklyTrend {
  week: string;
  tasks_created: string;
  tasks_completed: string;
  boards_active: string;
  projects_active: string;
  completion_rate: string;
}

interface StatisticsReport {
  overallStats: OverallStatistics;
  projectLevelStats: ProjectStatistics[];
  boardLevelStats: BoardStatistics[];
  memberProductivityStats: MemberProductivity[];
  priorityDistribution: PriorityDistribution[];
  recentCompletions: RecentCompletion[];
  weeklyTrends: WeeklyTrend[];
}

export const useProjectStatistics = () => {
  const [statistics, setStatistics] = useState<StatisticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await statisticsAPI.getReport();
      
      const data = response.data;
      
      // Use the data directly as it matches our types
      setStatistics({
        overallStats: data.overallStats,
        projectLevelStats: data.projectLevelStats,
        boardLevelStats: data.boardLevelStats,
        memberProductivityStats: data.memberProductivityStats,
        priorityDistribution: data.priorityDistribution,
        recentCompletions: data.recentCompletions,
        weeklyTrends: data.weeklyTrends
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
};
