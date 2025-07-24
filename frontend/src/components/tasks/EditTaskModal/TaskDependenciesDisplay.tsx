import React, { useState, useEffect } from 'react';
import { 
  LinkIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import theme from '../../../config/theme';
import DependencySelectorModal from '../CreateTaskModal/DependencySelectorModal';
import type { Task } from '../../../types';
import Swal from 'sweetalert2';

interface DependencyDetail {
  id: number;
  predecessorTaskId: number;
  successorTaskId: number;
  dependencyType: string;
  lagTime: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  predecessorTask?: {
    id: number;
    title: string;
    status: string;
    completedAt?: string | null;
  };
  successorTask?: {
    id: number;
    title: string;
    status: string;
    completedAt?: string | null;
  };
}

interface TaskDependenciesDisplayProps {
  taskId: number;
  onAddDependency?: () => void;
  onRemoveDependency?: (taskId: number, type: 'predecessor' | 'successor') => void;
  isEditMode?: boolean;
  availableTasks?: Task[];
  projectMembers?: any[];
}

const TaskDependenciesDisplay: React.FC<TaskDependenciesDisplayProps> = ({
  taskId,
  onAddDependency,
  onRemoveDependency,
  isEditMode = false,
  availableTasks = [],
  projectMembers = []
}) => {
  const [dependencies, setDependencies] = useState<DependencyDetail[]>([]);
  const [showEditControls, setShowEditControls] = useState(isEditMode);
  const [showDependencySelector, setShowDependencySelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dependencies from API
  const fetchDependencies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/dependencies/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dependencies');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setDependencies(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      setError('Failed to load dependencies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchDependencies();
    }
  }, [taskId]);

  const getStatusIcon = (status: string, completedAt?: string | null) => {
    if (status === 'done' || completedAt) {
      return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    }
    return <ClockIcon className="h-4 w-4 text-yellow-600" />;
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case 'FS': return 'Finish-to-Start';
      case 'FF': return 'Finish-to-Finish';
      case 'SF': return 'Start-to-Finish';
      case 'SS': return 'Start-to-Start';
      default: return type;
    }
  };

  const handleAddDependency = async (dependencyTaskId: number) => {
    try {
      const response = await fetch('/api/v1/dependencies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          predecessorTaskId: dependencyTaskId,
          successorTaskId: taskId,
          dependencyType: 'FS',
          lagTime: 0,
          notifyUsers: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add dependency');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Dependency Added',
        text: 'The task dependency has been added successfully.',
        showConfirmButton: false,
        timer: 2000,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        iconColor: theme.colors.primary
      });

      // Refresh dependencies
      await fetchDependencies();
      
      // Call parent callback if provided
      if (onAddDependency) {
        onAddDependency();
      }
    } catch (error: any) {
      console.error('Error adding dependency:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to add dependency. Please try again.',
        confirmButtonColor: theme.colors.primary,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary
      });
    } finally {
      setShowDependencySelector(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: number, type: 'predecessor' | 'successor') => {
    const confirmResult = await Swal.fire({
      title: 'Remove Dependency?',
      text: 'Are you sure you want to remove this task dependency?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme.colors.primary,
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!',
      background: theme.colors.background.paper,
      color: theme.colors.text.primary
    });

    if (!confirmResult.isConfirmed) return;

    try {
      // Find the actual dependency record ID
      const dependency = dependencies.find(dep => {
        if (type === 'predecessor') {
          return dep.predecessorTask?.id === dependencyId && dep.successorTaskId === taskId;
        } else {
          return dep.successorTask?.id === dependencyId && dep.predecessorTaskId === taskId;
        }
      });

      if (!dependency) {
        throw new Error('Dependency not found');
      }

      const response = await fetch(`/api/v1/dependencies/${dependency.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove dependency');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Dependency Removed',
        text: 'The task dependency has been removed successfully.',
        showConfirmButton: false,
        timer: 2000,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary,
        iconColor: theme.colors.primary
      });

      // Refresh dependencies
      await fetchDependencies();
      
      // Call parent callback if provided
      if (onRemoveDependency) {
        onRemoveDependency(dependencyId, type);
      }
    } catch (error: any) {
      console.error('Error removing dependency:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to remove dependency. Please try again.',
        confirmButtonColor: theme.colors.primary,
        background: theme.colors.background.paper,
        color: theme.colors.text.primary
      });
    }
  };

  // Separate predecessors and successors
  const predecessors = dependencies.filter(dep => dep.successorTaskId === taskId && dep.predecessorTask);
  const successors = dependencies.filter(dep => dep.predecessorTaskId === taskId && dep.successorTask);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 py-4">
        <ExclamationTriangleIcon className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" style={{ color: theme.colors.primary }} />
          <h3 className="font-medium" style={{ color: theme.colors.secondary }}>
            Task Dependencies
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button
                type="button"
                onClick={() => setShowEditControls(!showEditControls)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="Edit dependencies"
              >
                <PencilIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
              </button>
              {showEditControls && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowDependencySelector(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gold transition-colors hover:opacity-90"
                    style={{ backgroundColor: 'black', color: theme.colors.primary }}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Edit Dependencies
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditControls(false)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-200"
                    title="Done editing"
                  >
                    <CheckCircleIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                    Done
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Predecessors Section */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-medium mb-3" style={{ color: theme.colors.secondary }}>
          Predecessor Tasks (Must complete before this task)
        </h4>
        {predecessors.length > 0 ? (
          <div className="space-y-2">
            {predecessors.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
                style={{ borderColor: theme.colors.border }}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(dep.predecessorTask!.status, dep.predecessorTask!.completedAt)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dep.predecessorTask!.title}</p>
                    <p className="text-xs text-gray-500">
                      {getDependencyTypeLabel(dep.dependencyType)}
                      {dep.lagTime > 0 && <span className="ml-2">Lag: {dep.lagTime} days</span>}
                      {dep.predecessorTask!.completedAt && (
                        <span className="ml-2">
                          Completed: {new Date(dep.predecessorTask!.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {showEditControls && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDependency(dep.predecessorTask!.id, 'predecessor')}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"
                    title="Remove dependency"
                  >
                    <TrashIcon className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No predecessor dependencies</p>
        )}
      </div>

      {/* Successors Section */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-medium mb-3" style={{ color: theme.colors.secondary }}>
          Successor Tasks (Can start after this task)
        </h4>
        {successors.length > 0 ? (
          <div className="space-y-2">
            {successors.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
                style={{ borderColor: theme.colors.border }}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(dep.successorTask!.status, dep.successorTask!.completedAt)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dep.successorTask!.title}</p>
                    <p className="text-xs text-gray-500">
                      {getDependencyTypeLabel(dep.dependencyType)}
                      {dep.lagTime > 0 && <span className="ml-2">Lag: {dep.lagTime} days</span>}
                    </p>
                  </div>
                </div>
                {showEditControls && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDependency(dep.successorTask!.id, 'successor')}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"
                    title="Remove dependency"
                  >
                    <TrashIcon className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No successor dependencies</p>
        )}
      </div>

      {/* Dependency Summary */}
      {(predecessors.length > 0 || successors.length > 0) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Dependencies Summary:</strong> This task has {predecessors.length} predecessor{predecessors.length !== 1 ? 's' : ''} 
            {' '}and {successors.length} successor{successors.length !== 1 ? 's' : ''}.
          </p>
        </div>
      )}

      {/* Dependency Selector Modal */}
      {showDependencySelector && (
        <DependencySelectorModal
          isOpen={showDependencySelector}
          onClose={() => setShowDependencySelector(false)}
          onDependencySelected={handleAddDependency}
          currentTaskId={taskId}
          availableTasks={availableTasks.filter(t => {
            // Filter out current task and already added dependencies
            if (t.id === taskId) return false;
            const existingPredecessorIds = dependencies
              .filter(dep => dep.successorTaskId === taskId && dep.predecessorTask)
              .map(dep => dep.predecessorTask!.id);
            const existingSuccessorIds = dependencies
              .filter(dep => dep.predecessorTaskId === taskId && dep.successorTask)
              .map(dep => dep.successorTask!.id);
            return ![...existingPredecessorIds, ...existingSuccessorIds].includes(t.id);
          })}
          projectMembers={projectMembers}
          existingDependencies={dependencies}
        />
      )}
    </div>
  );
};

export default TaskDependenciesDisplay;
