// Group-related TypeScript types
import type { ID } from './common';

// Base Group interface
export interface Group {
  id: ID;
  name: string;
  description?: string;
  color?: string; // Hex color for group identification
  isActive: boolean;
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
  
  // Metadata
  metadata?: {
    tags?: string[];
    customFields?: Record<string, unknown>;
    settings?: GroupSettings;
  };
}

// Group settings for customization
export interface GroupSettings {
  allowSelfJoin: boolean;
  requireApproval: boolean;
  maxMembers?: number;
  visibility: 'public' | 'private' | 'invite-only';
  permissions?: GroupPermissions;
}

// Group permissions structure
export interface GroupPermissions {
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageGroup: boolean;
  canViewMembers: boolean;
}

// Group member relationship
export interface GroupMember {
  id: ID;
  groupId: ID;
  userId: ID;
  role: GroupMemberRole;
  joinedAt: string;
  isActive: boolean;
  
  // User details (populated from join)
  user?: {
    id: ID;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    department?: {
      id: ID;
      name: string;
      code: string;
    };
  };
}

// Group member roles
export type GroupMemberRole = 'admin' | 'moderator' | 'member';

// Extended group with member details
export interface GroupWithMembers extends Group {
  members: GroupMember[];
  membersCount: number;
  adminsCount: number;
  createdByUser?: {
    id: ID;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Group statistics
export interface GroupStats {
  totalMembers: number;
  activeMembers: number;
  admins: number;
  moderators: number;
  recentActivity: number;
  joinedThisMonth: number;
}

// Extended group with statistics
export interface GroupWithStats extends GroupWithMembers {
  stats: GroupStats;
}

// API Request/Response types
export interface GroupsResponse {
  groups: Group[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GroupWithMembersResponse {
  group: GroupWithMembers;
}

export interface GroupMembersResponse {
  members: GroupMember[];
  total: number;
  page: number;
  totalPages: number;
}

// DTO types for API operations
export interface CreateGroupDto {
  name: string;
  description?: string;
  color?: string;
  settings?: Partial<GroupSettings>;
  metadata?: {
    tags?: string[];
    customFields?: Record<string, unknown>;
  };
}

export interface UpdateGroupDto extends Partial<CreateGroupDto> {
  isActive?: boolean;
}

export interface AddGroupMemberDto {
  userId: ID;
  role?: GroupMemberRole;
}

export interface UpdateGroupMemberDto {
  role?: GroupMemberRole;
  isActive?: boolean;
}

export interface BulkAddMembersDto {
  userIds: ID[];
  role?: GroupMemberRole;
}

// Filter and search types
export interface GroupFilters {
  search?: string;
  isActive?: boolean;
  createdBy?: ID;
  role?: GroupMemberRole; // For filtering groups where user has specific role
  tags?: string[];
  visibility?: GroupSettings['visibility'];
  hasMembers?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'membersCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface GroupMemberFilters {
  search?: string;
  role?: GroupMemberRole;
  isActive?: boolean;
  department?: ID;
  joinedAfter?: string;
  joinedBefore?: string;
  sortBy?: 'joinedAt' | 'user.firstName' | 'user.lastName' | 'role';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// User group membership info (for checking user's groups)
export interface UserGroupMembership {
  groupId: ID;
  group: Pick<Group, 'id' | 'name' | 'description' | 'color'>;
  role: GroupMemberRole;
  joinedAt: string;
  isActive: boolean;
}

export interface UserGroupsResponse {
  groups: UserGroupMembership[];
  total: number;
}

// Group activity/audit types
export interface GroupActivity {
  id: ID;
  groupId: ID;
  userId: ID;
  action: GroupActivityAction;
  details?: Record<string, unknown>;
  createdAt: string;
  
  // User details
  user?: {
    id: ID;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type GroupActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'settings_updated';

export interface GroupActivitiesResponse {
  activities: GroupActivity[];
  total: number;
  page: number;
  totalPages: number;
}

// Error types specific to group operations
export interface GroupError {
  code: string;
  message: string;
  field?: string;
}

export interface GroupValidationError extends GroupError {
  field: string;
  value?: unknown;
}

// Utility types for permissions checking
export type GroupPermissionCheck = {
  groupId: ID;
  userId: ID;
  permission: keyof GroupPermissions;
};

export type GroupMembershipStatus = 'member' | 'admin' | 'moderator' | 'not_member';

// Export utility type guards
export const isGroupAdmin = (member: GroupMember): boolean => {
  return member.role === 'admin';
};

export const isGroupModerator = (member: GroupMember): boolean => {
  return member.role === 'moderator' || member.role === 'admin';
};

export const canManageGroup = (member: GroupMember): boolean => {
  return member.role === 'admin';
};

export const canInviteMembers = (member: GroupMember, permissions?: GroupPermissions): boolean => {
  if (member.role === 'admin') return true;
  if (member.role === 'moderator' && permissions?.canInviteMembers) return true;
  return false;
};
