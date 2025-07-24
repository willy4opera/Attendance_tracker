export interface Task {
  id: number;
  title: string;
  description: string;
  taskListId: number;
  boardId: number;
  position: number;
  createdBy: number;
  assignedTo: number[];
  assignedDepartments: number[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  estimatedHours: string | null;
  actualHours: string | null;
  labels: string[];
  checklist: any[];
  attachmentCount: number;
  commentCount: number;
  watcherCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  list?: {
    id: number;
    name: string;
    board?: {
      id: number;
      name: string;
    };
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  watchers?: any[];
  assignedUsers?: any[];
  dependencies?: {
    predecessors: any[];
    successors: any[];
  };
}

export interface TaskFormData {
  title: string;
  description?: string;
  taskListId: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: number[];
  assignedDepartments?: number[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  labels?: string[];
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
}

export interface Activity {
  id: number;
  taskId: number;
  userId: number;
  boardId: number;
  activityType: string;
  details: {
    message: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
  };
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
  task?: {
    id: number;
    title: string;
  };
}
