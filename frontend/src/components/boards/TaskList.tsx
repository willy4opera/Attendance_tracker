import React, { useState } from 'react';
import { PlusIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import TaskCard from './TaskCard';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import type { BoardList } from '../../types';

interface TaskListProps {
  list: BoardList;
  boardId: string;
  projectId?: string;
  onUpdate: (listId: string, data: { name?: string; position?: number }) => void;
  onDelete: (listId: string) => void;
  onTaskUpdate?: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  list, 
  boardId, 
  projectId, 
  onUpdate, 
  onDelete,
  onTaskUpdate 
}) => {
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);

  const handleTaskCreated = (task: any) => {
    setIsCreateTaskModalOpen(false);
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow-md p-4 w-80 flex-shrink-0">
      {/* List Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg text-gray-900">{list.name}</h3>
        <div className="relative">
          <button
            onClick={() => setIsListMenuOpen(!isListMenuOpen)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
          
          {isListMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => {
                  onDelete(list.id);
                  setIsListMenuOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Delete List
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Count */}
      <div className="text-sm text-gray-600 mb-3">
        {list.tasks?.length || 0} tasks
      </div>

      {/* Tasks */}
      <div className="space-y-3 mb-4">
        {list.tasks?.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onUpdate={onTaskUpdate}
          />
        ))}
      </div>

      {/* Add Task Button */}
      <button
        onClick={() => setIsCreateTaskModalOpen(true)}
        className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add a task
      </button>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={handleTaskCreated}
        initialProjectId={projectId}
        initialBoardId={boardId}
        initialListId={list.id}
      />
    </div>
  );
};

export default TaskList;
