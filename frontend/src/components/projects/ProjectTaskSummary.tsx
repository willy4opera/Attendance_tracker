import React from 'react';
import type { Project } from '../../types';
import { useBoards } from '../../hooks/useBoards';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

interface ProjectTaskSummaryProps {
  project: Project;
  compact?: boolean;
}

const ProjectTaskSummary: React.FC<ProjectTaskSummaryProps> = ({ project, compact = false }) => {
  // Fetch boards for this project
  const { boards } = useBoards({ projectId: project.id.toString(), limit: 10 });

  // Calculate aggregated task statistics
  const taskStats = boards.reduce((acc, board) => {
    return {
      total: acc.total + (board.stats?.taskCount || 0),
      completed: acc.completed + (board.stats?.completedTaskCount || 0),
      active: acc.active + (board.stats?.activeTaskCount || 0),
      overdue: acc.overdue + (board.stats?.overdueTaskCount || 0)
    };
  }, { total: 0, completed: 0, active: 0, overdue: 0 });

  const completionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className="text-gray-600">{taskStats.completed}</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600">{taskStats.active}</span>
        </div>
        {taskStats.overdue > 0 && (
          <div className="flex items-center gap-1">
            <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
            <span className="text-red-600">{taskStats.overdue}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Task Progress</span>
          <span className="font-medium text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{taskStats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">{taskStats.completed}</div>
          <div className="text-xs text-gray-500">Done</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-blue-600">{taskStats.active}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
      </div>

      {/* Overdue Warning */}
      {taskStats.overdue > 0 && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm">
          <ExclamationCircleIcon className="h-4 w-4 text-red-600" />
          <span className="text-red-700">{taskStats.overdue} overdue tasks</span>
        </div>
      )}
    </div>
  );
};

export default ProjectTaskSummary;

// Add named export
export { ProjectTaskSummary }
