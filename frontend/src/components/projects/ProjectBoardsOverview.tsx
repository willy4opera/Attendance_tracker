import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Board, Task } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { useProjectStatistics } from '../../hooks/useProjectStatistics';
import { 
  ViewColumnsIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface ProjectBoardsOverviewProps {
  boards: Board[];
  projectId: string;
}

interface BoardWithTasks extends Board {
  tasks?: Task[];
  taskStats?: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  memberCount?: number;
}

const ProjectBoardsOverview: React.FC<ProjectBoardsOverviewProps> = ({ boards, projectId }) => {
  const navigate = useNavigate();
  const [expandedBoards, setExpandedBoards] = useState<Set<number>>(new Set());
  const { statistics } = useProjectStatistics();

  // Fetch tasks for each board and add member counts from statistics
  const boardsWithTasks: BoardWithTasks[] = boards.map(board => {
    const { tasks = [] } = useTasks(board.id);
    
    // Get member count from statistics
    const boardStats = statistics?.boardLevelStats?.find(
      stat => stat.board_id === board.id
    );
    const memberCount = boardStats ? parseInt(boardStats.member_count) : 0;
    
    // Calculate unique members from tasks if statistics not available
    const uniqueMembersFromTasks = new Set<number>();
    tasks.forEach(task => {
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo.forEach(userId => uniqueMembersFromTasks.add(userId));
      }
    });
    
    // Calculate task statistics
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress' || t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'done';
      }).length
    };

    return {
      ...board,
      tasks,
      taskStats,
      memberCount: memberCount || uniqueMembersFromTasks.size
    };
  });

  const toggleBoardExpansion = (boardId: number) => {
    const newExpanded = new Set(expandedBoards);
    if (newExpanded.has(boardId)) {
      newExpanded.delete(boardId);
    } else {
      newExpanded.add(boardId);
    }
    setExpandedBoards(newExpanded);
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'in-progress':
      default: return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  // Calculate total unique members across all boards
  const totalUniqueMembers = statistics?.projectLevelStats?.find(
    stat => stat.project_id === parseInt(projectId)
  )?.member_count || 0;

  return (
    <div className="space-y-6">
      {/* Project-wide member count */}
      {totalUniqueMembers > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Total Team Members: {totalUniqueMembers}
            </span>
          </div>
        </div>
      )}

      {boardsWithTasks.map((board) => {
        const isExpanded = expandedBoards.has(board.id);
        const progress = board.taskStats && board.taskStats.total > 0
          ? Math.round((board.taskStats.done / board.taskStats.total) * 100)
          : 0;

        return (
          <div key={board.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Board Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: board.backgroundColor || '#0079BF' }}
                    >
                      {board.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{board.name}</h3>
                      {board.description && (
                        <p className="text-sm text-gray-600 mt-1">{board.description}</p>
                      )}
                      {/* Board member count */}
                      {board.memberCount > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <UserGroupIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {board.memberCount} {board.memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Open Board
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Board Stats */}
              {board.taskStats && board.taskStats.total > 0 && (
                <div className="mt-6">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{board.taskStats.total}</div>
                      <div className="text-xs text-gray-600">Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{board.taskStats.todo}</div>
                      <div className="text-xs text-gray-600">To Do</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{board.taskStats.inProgress}</div>
                      <div className="text-xs text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{board.taskStats.done}</div>
                      <div className="text-xs text-gray-600">Done</div>
                    </div>
                    {board.taskStats.overdue > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{board.taskStats.overdue}</div>
                        <div className="text-xs text-gray-600">Overdue</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{board.memberCount || 0}</div>
                      <div className="text-xs text-gray-600">Members</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle Task List */}
              {board.tasks && board.tasks.length > 0 && (
                <button
                  onClick={() => toggleBoardExpansion(board.id)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isExpanded ? 'Hide' : 'Show'} Tasks ({board.tasks.length})
                </button>
              )}
            </div>

            {/* Expanded Task List */}
            {isExpanded && board.tasks && board.tasks.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {board.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {getTaskStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${getTaskPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.assignedTo && task.assignedTo.length > 0 && (
                              <div className="flex items-center gap-1">
                                <UserGroupIcon className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {task.assignedTo.length} assigned
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {task.commentCount > 0 && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {task.commentCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {boards.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ViewColumnsIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No boards yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first board to start organizing tasks.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectBoardsOverview;

// Add named export
export { ProjectBoardsOverview }
