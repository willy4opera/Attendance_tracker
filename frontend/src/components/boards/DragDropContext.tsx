import React, { createContext, useContext, ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Task } from '../../types';
import TaskCard from './TaskCard';

interface DragDropContextProps {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
}

interface DragDropState {
  activeTask: Task | null;
  activeId: string | null;
}

const DragDropStateContext = createContext<DragDropState>({
  activeTask: null,
  activeId: null,
});

export const useDragDropState = () => useContext(DragDropStateContext);

export const DragDropProvider: React.FC<DragDropContextProps> = ({
  children,
  onDragEnd,
  onDragOver,
  onDragStart,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // You'll need to get the task data here based on the active.id
    // This is a placeholder - implement based on your task management
    const task = active.data.current as Task;
    setActiveTask(task || null);
    
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveTask(null);
    onDragEnd(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    onDragOver?.(event);
  };

  return (
    <DragDropStateContext.Provider value={{ activeTask, activeId }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        {children}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80 cursor-grabbing transform rotate-3">
              <TaskCard
                task={activeTask}
                isDragging={true}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragDropStateContext.Provider>
  );
};

// Helper function to handle reordering
export const reorderTasks = (
  tasks: Task[],
  activeId: string,
  overId: string
): Task[] => {
  const activeIndex = tasks.findIndex((task) => task.id.toString() === activeId);
  const overIndex = tasks.findIndex((task) => task.id.toString() === overId);

  if (activeIndex !== -1 && overIndex !== -1) {
    return arrayMove(tasks, activeIndex, overIndex);
  }

  return tasks;
};

// Helper function to move task between lists
export const moveTaskBetweenLists = (
  sourceTasks: Task[],
  destinationTasks: Task[],
  activeId: string,
  overId: string,
  newStatus: string
): { source: Task[]; destination: Task[] } => {
  const activeTask = sourceTasks.find((task) => task.id.toString() === activeId);
  
  if (!activeTask) {
    return { source: sourceTasks, destination: destinationTasks };
  }

  // Remove from source
  const newSourceTasks = sourceTasks.filter((task) => task.id.toString() !== activeId);
  
  // Add to destination with new status
  const updatedTask = { ...activeTask, status: newStatus as Task['status'] };
  const overIndex = destinationTasks.findIndex((task) => task.id.toString() === overId);
  
  let newDestinationTasks: Task[];
  if (overIndex === -1) {
    // If no specific position, add to end
    newDestinationTasks = [...destinationTasks, updatedTask];
  } else {
    // Insert at specific position
    newDestinationTasks = [
      ...destinationTasks.slice(0, overIndex),
      updatedTask,
      ...destinationTasks.slice(overIndex),
    ];
  }

  return {
    source: newSourceTasks,
    destination: newDestinationTasks,
  };
};
