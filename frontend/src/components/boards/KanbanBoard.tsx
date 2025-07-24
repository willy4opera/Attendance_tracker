import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../../types';
import TaskList from './TaskList';
import CreateTaskModal from '../tasks/CreateTaskModal';
import EditTaskModal from '../tasks/EditTaskModal';
import CreateListButton from './CreateListButton';
import { DragDropProvider, reorderTasks } from './DragDropContext';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useTasks } from '../../hooks/useTasks';
import { useBoardLists } from '../../hooks/useBoardLists';
import { notify } from '../../utils/notifications';
import theme from '../../config/theme';

interface KanbanBoardProps {
  boardId: number;
  boardName?: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  boardName,
}) => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Use the custom hooks with caching
  const { lists, isLoading: listsLoading, error: listsError, createList, updateList, deleteList } = useBoardLists(boardId);
  const { tasks, loading: tasksLoading, error: tasksError, updateTask, deleteTask, refetch: refetchTasks } = useTasks({ boardId: String(boardId) });

  // Group tasks by list ID
  const tasksByListId = (tasks || []).reduce((acc, task) => {
    const listId = task.taskListId || 0;
    if (!acc[listId]) {
      acc[listId] = [];
    }
    acc[listId].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  const handleCreateList = async (name: string) => {
    try {
      await createList({ 
        name,
        position: lists.length 
      });
      notify.toast.success('List created successfully');
    } catch (error) {
      console.error('Failed to create list:', error);
      notify.toast.error('Failed to create list');
      throw error;
    }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !tasks) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Get the task that was dragged
    const activeTask = tasks.find(task => task.id.toString() === activeId);
    if (!activeTask) return;

    // Check if we're dropping on a list
    const overList = lists.find(list => list.id.toString() === overId);
    if (overList && activeTask.taskListId !== overList.id) {
      try {
        await updateTask(activeTask.id.toString(), { taskListId: overList.id });
        notify.toast.success('Task moved successfully');
      } catch (error) {
        notify.toast.error('Failed to move task');
      }
      return;
    }

    // Check if we're dropping on another task
    const overTask = tasks.find(task => task.id.toString() === overId);
    if (overTask) {
      if (activeTask.taskListId === overTask.taskListId) {
        // Reordering within the same list
        const listTasks = tasksByListId[activeTask.taskListId] || [];
        const updatedTasks = reorderTasks(listTasks, activeId, overId);
        
        // Update positions
        try {
          notify.toast.info('Task reordered');
        } catch (error) {
          notify.toast.error('Failed to reorder task');
        }
      } else {
        // Moving to a different list
        try {
          await updateTask(activeTask.id.toString(), { taskListId: overTask.taskListId });
          notify.toast.success('Task moved successfully');
        } catch (error) {
          notify.toast.error('Failed to move task');
        }
      }
    }
  }, [tasks, lists, updateTask, tasksByListId]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
  }, []);

  const handleAddTask = (listId: number) => {
    setSelectedListId(listId);
    setIsCreateModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id.toString());
  };

  const handleTaskClick = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = await notify.alert.confirmDelete(
      'Delete Task',
      'Are you sure you want to delete this task?'
    );

    if (confirmed) {
      try {
        await deleteTask(taskId);
        notify.toast.success('Task deleted successfully');
      } catch (error) {
        notify.toast.error('Failed to delete task');
      }
    }
  };

  const handleCreateTask = () => {
    setIsCreateModalOpen(false);
    setSelectedListId(null);
    refetchTasks();
  };

  const handleUpdateTask = () => {
    setEditingTaskId(null);
    refetchTasks();
  };

  const handleDeleteList = async (listId: number) => {
    const confirmed = await notify.alert.confirmDelete(
      'Delete List',
      'Are you sure you want to delete this list? All tasks in this list will be deleted.'
    );

    if (confirmed) {
      try {
        await deleteList(listId);
        notify.toast.success('List deleted successfully');
      } catch (error) {
        notify.toast.error('Failed to delete list');
      }
    }
  };

  const handleEditListName = async (listId: number, newName: string) => {
    try {
      await updateList({ listId, data: { name: newName } });
      notify.toast.success('List name updated');
    } catch (error) {
      notify.toast.error('Failed to update list name');
      throw error;
    }
  };

  const loading = tasksLoading || listsLoading;
  const error = tasksError || listsError;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
        <span className="ml-2" style={{ color: theme.colors.text.secondary }}>Loading board...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.error + '10', color: theme.colors.error }}>
        <p>Error loading board: {error}</p>
        {error.includes('429') && (
          <p className="mt-2 text-sm">
            Too many requests. Please wait a moment and refresh the page.
          </p>
        )}
      </div>
    );
  }

  return (
    <DragDropProvider 
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}>
        <div style={{ 
          height: '100%',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#888 #f1f1f1'
        }}>
          <div style={{ 
            display: 'inline-flex',
            height: '100%',
            padding: '1rem',
            gap: '1rem',
            minWidth: 'max-content'
          }}>
            {lists.map((list) => (
              <div key={list.id} style={{ 
                flex: '0 0 320px',
                width: '320px',
                minWidth: '320px',
                maxWidth: '320px',
                height: 'calc(100% - 2rem)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <TaskList
                  title={list.name || 'Untitled List'}
                  status={list.id.toString()}
                  tasks={tasksByListId[list.id] || []}
                  onAddTask={() => handleAddTask(list.id)}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onEditListName={(newName) => handleEditListName(list.id, newName)}
                  onDeleteList={() => handleDeleteList(list.id)}
                  onTaskClick={handleTaskClick}
                />
              </div>
            ))}
            
            {/* Add List Button */}
            <div style={{ 
              flex: '0 0 320px',
              width: '320px',
              minWidth: '320px',
              maxWidth: '320px',
              height: 'calc(100% - 2rem)'
            }}>
              <CreateListButton onCreateList={handleCreateList} />
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedListId(null);
          }}
          boardId={boardId}
          listId={selectedListId}
          onSuccess={handleCreateTask}
        />
      )}

      {/* Edit Task Modal */}
      {editingTaskId && (
        <EditTaskModal
          taskId={editingTaskId}
          isOpen={true}
          onClose={() => setEditingTaskId(null)}
          onSuccess={handleUpdateTask}
        />
      )}
    </DragDropProvider>
  );
};

export default KanbanBoard;
