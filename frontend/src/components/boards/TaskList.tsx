import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../../types';
import DraggableTaskCard from './DraggableTaskCard';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import theme from '../../config/theme';

interface TaskListProps {
  title: string;
  status: string;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditListName?: (newName: string) => Promise<void>;
  onDeleteList?: () => void;
  onTaskClick?: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditListName,
  onDeleteList,
  onTaskClick,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'TaskList',
      status,
    },
  });

  const taskIds = tasks.map(task => task.id.toString());

  const handleEditTitle = async () => {
    if (!editedTitle.trim() || editedTitle === title) {
      setEditedTitle(title);
      setIsEditingTitle(false);
      return;
    }

    if (onEditListName) {
      setIsSubmitting(true);
      try {
        await onEditListName(editedTitle.trim());
        setIsEditingTitle(false);
      } catch (error) {
        console.error('Failed to update list name:', error);
        setEditedTitle(title);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Update title when prop changes
  React.useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const getStatusColor = () => {
    // Default colors for common statuses - with theme integration
    const lowerTitle = (title || '').toLowerCase();
    switch (lowerTitle) {
      case 'to do':
        return `bg-gray-100`;
      case 'in progress':
        return `bg-blue-50`;
      case 'under-review':
        return `bg-yellow-50`;
      case 'done':
        return `bg-green-50`;
      default:
        return `bg-gray-50`;
    }
  };

  const getHeaderColor = () => {
    const lowerTitle = (title || '').toLowerCase();
    switch (lowerTitle) {
      case 'to do':
        return 'bg-gray-200 text-gray-800';
      case 'in progress':
        return 'bg-blue-200 text-blue-900';
      case 'under-review':
        return 'bg-yellow-200 text-yellow-900';
      case 'done':
        return 'bg-green-200 text-green-900';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex flex-col h-full rounded-lg shadow-sm transition-all duration-200 group',
        getStatusColor(),
        isOver && 'ring-2 ring-opacity-50',
        isOver && `ring-[${theme.colors.primary}]`
      )}
      style={{
        borderColor: isOver ? theme.colors.primary : 'transparent',
        borderWidth: isOver ? '2px' : '0px'
      }}
    >
      {/* List Header */}
      <div className={clsx('px-4 py-3 rounded-t-lg', getHeaderColor())}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {isEditingTitle ? (
              <form onSubmit={(e) => { e.preventDefault(); handleEditTitle(); }} className="flex-1 flex gap-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm font-semibold bg-white rounded border focus:outline-none focus:ring-2"
                  style={{
                      borderColor: theme.colors.primary + '40',
                  } as any}
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="p-1 transition-colors"
                  style={{ color: theme.colors.success }}
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedTitle(title);
                    setIsEditingTitle(false);
                  }}
                  disabled={isSubmitting}
                  className="p-1 transition-colors"
                  style={{ color: theme.colors.error }}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <>
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className="text-xs px-2 py-0.5 bg-white bg-opacity-50 rounded-full">
                  {tasks.length}
                </span>
              </>
            )}
          </div>
          
          {!isEditingTitle && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEditListName && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title="Edit list name"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
              {onDeleteList && (
                <button
                  onClick={onDeleteList}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  style={{ color: theme.colors.error }}
                  title="Delete list"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task List Body */}
      <div className="flex-1 p-2 overflow-y-auto">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id.toString())}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Add Task Button */}
      <div className="p-2">
        <button
          onClick={onAddTask}
          className="w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            backgroundColor: theme.colors.secondary,
            color: theme.colors.primary
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
            e.currentTarget.style.color = theme.colors.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.secondary;
            e.currentTarget.style.color = theme.colors.primary;
          }}
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add a task</span>
        </button>
      </div>
    </div>
  );
};

export default TaskList;
