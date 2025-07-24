// Import common types
import type { ID } from './common';

// Core User type
export interface User {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  role: 'admin' | 'moderator' | 'user';
  department?: {
    id: ID;
    name: string;
    code: string;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

// Department types
export interface Department {
  id: string
  name: string
  code: string
  description?: string
  headOfDepartmentId?: string
  parentDepartmentId?: string
  isActive: boolean
  metadata?: {
    customFields?: Record<string, unknown>
    createdBy?: string
    createdAt?: string
    lastModifiedBy?: string
    lastModifiedAt?: string
  }
  headOfDepartment?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  parentDepartment?: {
    id: string
    name: string
    code: string
  }
  createdAt: string
  updatedAt: string
}

export interface DepartmentStats {
  userCount: number
  activeUsers: number
  projectCount: number
  activeProjects: number
  boardCount: number
  subDepartmentCount: number
}

export interface DepartmentWithStats extends Department {
  stats?: DepartmentStats
  users?: User[]
  projects?: any[]
  boards?: any[]
  subDepartments?: Department[]
}

export interface DepartmentsResponse {
  departments: Department[]
  total: number
  page: number
  totalPages: number
}

export interface CreateDepartmentDto {
  name: string
  code: string
  description?: string
  headOfDepartmentId?: string
  parentDepartmentId?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  isActive?: boolean
}

// Export project management types
export * from './project'
export * from './board'
export * from './task'
export * from './activity';
export * from './comment';
export * from './social';
export * from './apiTypes';
export * from "./notification";
// Re-export common types
export type { ID } from './common';
export { isUUID, idToString, parseIdFromRoute } from './common';

// Add session and attendance exports
export type * from "./session";
export type * from "./attendance";

// Group management types
export type * from './group';
