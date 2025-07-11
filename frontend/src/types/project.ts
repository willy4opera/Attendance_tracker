// Project enums
export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

// Project member interface - defined before Project
export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: ProjectRole
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  }
  joinedAt: string
}

// Project stats interface (from backend response)
export interface ProjectStats {
  boardCount: number
  activeMemberCount: number
  progress: number
  // Additional fields
  totalTasks?: number
  completedTasks?: number
  inProgressTasks?: number
  todoTasks?: number
  overdueTasks?: number
  memberCount?: number
  completionPercentage?: number
}

// Main Project interface - matching backend response
export interface Project {
  id: number
  name: string
  code: string
  description?: string
  projectManagerId?: number
  departmentId?: number
  startDate?: string
  endDate?: string
  status: ProjectStatus
  budget?: number
  isActive: boolean
  metadata?: {
    customFields?: {
      priority?: ProjectPriority
      [key: string]: unknown
    }
    createdBy?: number
    createdAt?: string
    lastModifiedBy?: number
    lastModifiedAt?: string
  }
  createdAt: string
  updatedAt: string
  projectManager?: {
    id: number
    firstName: string
    lastName: string
    email: string
  } | null
  department?: {
    id: number
    name: string
    code: string
  } | null
  members?: ProjectMember[]
  stats?: ProjectStats
  // Legacy fields for compatibility
  priority?: ProjectPriority
  owner?: {
    id: string
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  }
  ownerId?: string
  boardCount?: number
  taskCount?: number
  completedTaskCount?: number
  isArchived?: boolean
}

// Project with stats
export interface ProjectWithStats extends Project {
  stats: ProjectStats
}

// API response interfaces
export interface ProjectsResponse {
  projects: Project[]
  total: number
  page: number
  totalPages: number
}

// DTO interfaces - matching backend validation exactly
export interface CreateProjectDto {
  name: string                    // Required
  code: string                    // Required, max 20 chars
  description?: string            // Optional
  projectManagerId?: number       // Optional, integer
  departmentId?: number           // Optional, integer
  startDate?: string              // Optional, ISO8601 date
  endDate?: string                // Optional, ISO8601 date
  budget?: number                 // Optional, decimal
  status?: ProjectStatus          // Optional, enum values
  teamMembers?: Array<{           // Optional array
    userId: number                // Integer
    role: 'member' | 'lead' | 'viewer'  // Enum values
  }>
  metadata?: {                    // Optional metadata
    customFields?: Record<string, unknown>
    [key: string]: unknown
  }
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  isArchived?: boolean
}
