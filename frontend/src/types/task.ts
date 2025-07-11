
// Task types based on the Comprehensive API Guide
export interface Task {
  id: number
  title: string
  description?: string
  taskListId: number
  position: number
  createdBy: number
  assignedTo: number[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'review' | 'done'
  dueDate?: string
  startDate?: string
  completedAt?: string
  estimatedHours?: number
  actualHours?: number
  labels: string[]
  checklist: any[]
  attachmentCount: number
  commentCount: number
  watcherCount: number
  coverImage?: string
  coverColor?: string
  isArchived: boolean
  customFields: Record<string, any>
  metadata: {
    votes: any[]
    viewCount: number
    lastViewedBy?: number
    lastViewedAt?: string
  }
  createdAt: string
  updatedAt: string
  creator?: {
    id: number
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  }
  list?: {
    id: number
    name: string
    board?: {
      id: number
      name: string
    }
  }
  watchers?: {
    id: number
    firstName: string
    lastName: string
    email: string
    TaskWatcher: {
      isWatching: boolean
    }
  }[]
}

export interface TaskAssignee {
  id: string
  taskId: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  }
  assignedAt: string
}

export interface TaskLabel {
  id: string
  name: string
  color: string
  boardId: string
  createdAt: string
  updatedAt: string
}

export interface TaskAttachment {
  id: string
  taskId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedBy?: User
  uploadedById?: string
  createdAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  content: string
  author?: User
  authorId?: string
  parentId?: string
  replies?: TaskComment[]
  mentions?: string[]
  isEdited: boolean
  createdAt: string
  updatedAt: string
}

export interface TaskChecklistItem {
  id: string
  taskId: string
  text: string
  isCompleted: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export interface TaskStats {
  totalComments: number
  totalAttachments: number
  totalChecklistItems: number
  completedChecklistItems: number
  totalAssignees: number
  totalLabels: number
  hoursSpent: number
  estimatedHours: number
  daysUntilDue?: number
  isOverdue: boolean
}

export interface TaskWithStats extends Task {
  stats?: TaskStats
}

export interface TasksResponse {
  tasks: Task[]
  total: number
  page: number
  totalPages: number
}

// DTO types for API calls
export interface CreateTaskDto {
  title: string
  description?: string
  taskListId: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  labels?: string[]
  dueDate?: string
  startDate?: string
  assignedTo?: number[]
  assignedDepartments?: number[]
  estimatedHours?: number
  status?: 'todo' | 'in_progress' | 'review' | 'done'
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  isCompleted?: boolean
  isArchived?: boolean
  actualHours?: number
}

export interface MoveTaskDto {
  taskId: string
  targetListId: string
  position: number
}

export interface CreateTaskCommentDto {
  content: string
  parentId?: string
  mentions?: string[]
}

export interface UpdateTaskCommentDto {
  content: string
  mentions?: string[]
}

export interface CreateTaskChecklistItemDto {
  text: string
  position: number
}

export interface UpdateTaskChecklistItemDto {
  text?: string
  isCompleted?: boolean
  position?: number
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done'
}

// Import User type for references
import type { User } from './index'
