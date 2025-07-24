import type { ID } from './common';

// Board types aligned with API guide
export interface Board {
  id: ID
  name: string
  description?: string
  projectId: ID | null
  departmentId: ID | null
  createdBy: ID
  backgroundColor: string
  backgroundImage?: string | null
  visibility: 'private' | 'department' | 'organization' | 'public'
  isStarred: boolean
  isArchived: boolean
  settings: {
    cardCoverImages: boolean
    voting: boolean
    comments: boolean
    invitations: string
    selfJoin: boolean
  }
  createdAt: string
  updatedAt: string
  creator: {
    id: ID
    firstName: string
    lastName: string
    email: string
  }
  project?: {
    id: ID
    name: string
    code: string
  } | null
  department?: {
    id: ID
    name: string
    code: string
  } | null
  members: Array<{
    id: ID
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
    BoardMember: {
      role: 'owner' | 'admin' | 'member' | 'viewer'
    }
  }>
  lists?: BoardList[]
  stats?: {
    listCount: number
    taskCount: number
    memberCount: number
  }
}

export interface BoardList {
  id: ID
  name: string
  boardId: ID
  position: number
  color?: string | null
  isArchived: boolean
  watchedBy: any[]
  settings: {
    limitCards: boolean
    maxCards: number | null
    showCardCount: boolean
  }
  createdAt: string
  updatedAt: string
  tasks?: Task[]
}

export interface Task {
  id: ID
  title: string
  description?: string
  taskListId: number
  position: number
  createdBy: ID
  assignedTo: any[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in-progress' | 'completed'
  dueDate?: string | null
  startDate?: string | null
  completedAt?: string | null
  estimatedHours?: number | null
  actualHours?: number | null
  labels: string[]
  checklist: any[]
  attachmentCount: number
  commentCount: number
  watcherCount: number
  coverImage?: string | null
  coverColor?: string | null
  isArchived: boolean
  customFields: Record<string, any>
  metadata: {
    votes: any[]
    viewCount: number
    lastViewedBy?: any
    lastViewedAt?: string | null
  }
  createdAt: string
  updatedAt: string
  creator: {
    id: ID
    firstName: string
    lastName: string
    email: string
  }
}

export interface BoardMember {
  id: ID
  boardId: ID
  userId: ID
  role: BoardRole
  user: {
    id: ID
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  }
  joinedAt: string
}

export interface BoardSettings {
  allowComments: boolean
  allowAttachments: boolean
  allowLabels: boolean
  allowDueDates: boolean
  allowVoting: boolean
  cardAging: boolean
  permissions: {
    canAddMembers: boolean
    canCreateLists: boolean
    canArchiveBoard: boolean
  }
}

export interface BoardStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  overdueTasks: number
  listCount: number
  memberCount: number
  recentActivity: number
}

export interface BoardWithStats extends Board {
  stats?: BoardStats
}

export interface BoardsResponse {
  boards: Board[]
  total: number
  page: number
  totalPages: number
}

export interface CreateBoardDto {
  name: string
  description?: string
  projectId?: number | null
  departmentId?: number | null
  backgroundColor?: string
  backgroundImage?: string
  visibility: 'private' | 'department' | 'organization' | 'public'
  settings?: Partial<BoardSettings>
  memberIds?: number[]
}

export interface UpdateBoardDto extends Partial<CreateBoardDto> {
  isArchived?: boolean
}

export interface CreateBoardListDto {
  name: string
  position: number
  color?: string
}

export interface UpdateBoardListDto extends Partial<CreateBoardListDto> {
  isArchived?: boolean
}

export enum BoardVisibility {
  PRIVATE = 'private',
  DEPARTMENT = 'department',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

export enum BoardRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export interface TaskAssignee {
  id: ID
  userId: ID
  taskId: ID
  user: {
    id: ID
    firstName: string
    lastName: string
    email: string
  }
}

export interface TaskLabel {
  id: ID
  name: string
  color: string
}

// User interface for references
export interface User {
  id: ID
  firstName: string
  lastName: string
  email: string
  profilePicture?: string
}
