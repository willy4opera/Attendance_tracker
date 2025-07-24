import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import taskService from '../../services/taskService';
import type { Task, TaskFormData } from './types';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskDetails from './components/TaskDetails';
import ActivityList from './components/ActivityList';
import toast from 'react-hot-toast';

const TaskServiceTest: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'activities'>('list');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await taskService.getTasks();
      setTasks(response.data.tasks || []);
    } catch (error: any) {
      toast.error('Failed to load tasks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await taskService.getActivities({ entityType: 'task', limit: 20 });
      setActivities(response.data.activities || []);
    } catch (error: any) {
      toast.error('Failed to load activities: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (data: TaskFormData) => {
    setLoading(true);
    try {
      await taskService.createTask(data);
      toast.success('Task created successfully!');
      await loadTasks();
      setActiveTab('list');
    } catch (error: any) {
      toast.error('Failed to create task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: number, data: any) => {
    setLoading(true);
    try {
      await taskService.updateTask(taskId, data);
      toast.success('Task updated successfully!');
      await loadTasks();
      setSelectedTask(null);
    } catch (error: any) {
      toast.error('Failed to update task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setLoading(true);
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted successfully!');
      await loadTasks();
    } catch (error: any) {
      toast.error('Failed to delete task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  if (!user) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please log in to access the task service test.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Task Service Test</h1>
        <p className="text-gray-600">Test all task-related CRUD operations and features</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Task List ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create Task
          </button>
          <button
            onClick={() => {
              setActiveTab('activities');
              loadActivities();
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activities
          </button>
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'list' && (
            <TaskList
              tasks={tasks}
              onEdit={(task) => setSelectedTask(task)}
              onDelete={handleDeleteTask}
              onViewDetails={handleViewDetails}
              onRefresh={loadTasks}
            />
          )}

          {activeTab === 'create' && (
            <TaskForm
              onSubmit={handleCreateTask}
              isLoading={loading}
            />
          )}

          {activeTab === 'activities' && (
            <ActivityList activities={activities} />
          )}
        </>
      )}

      {/* Task Details Modal */}
      {showDetails && selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setShowDetails(false);
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onRefresh={loadTasks}
        />
      )}

      {/* Edit Task Modal */}
      {selectedTask && !showDetails && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TaskForm
              task={selectedTask}
              onSubmit={(data) => handleUpdateTask(selectedTask.id, data)}
              onCancel={() => setSelectedTask(null)}
              isLoading={loading}
              isEdit
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskServiceTest;
