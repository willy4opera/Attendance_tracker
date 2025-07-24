/**
 * Group Management Service
 * 
 * Provides CRUD operations and member management for groups.
 * Updated to match backend API endpoints structure.
 */

import api from './api';
import type {
  Group,
  GroupWithMembers,
  GroupMember,
  CreateGroupDto,
  UpdateGroupDto,
  AddGroupMemberDto,
  ID
} from '../types';

// API Response interfaces matching backend structure
interface ApiResponse<T> {
  status: string;
  data: T;
  results?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

interface GroupsApiResponse {
  groups: Group[];
}

interface GroupApiResponse {
  group: GroupWithMembers;
}

interface GroupMembersApiResponse {
  members: GroupMember[];
}

class GroupService {
  private baseUrl = '/groups';

  // ==================== Group CRUD Operations ====================

  /**
   * Get all groups with optional filtering
   */
  async getGroups(): Promise<Group[]> {
    try {
      const response = await api.get<ApiResponse<GroupsApiResponse>>(this.baseUrl);
      
      // Handle the nested structure: response.data.data.groups
      if (response.data?.data?.groups) {
        return response.data.data.groups;
      }
      
      // Fallback for different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw new Error('Failed to fetch groups');
    }
  }

  /**
   * Get a specific group by ID with members
   */
  async getGroup(id: ID): Promise<GroupWithMembers> {
    try {
      const response = await api.get<ApiResponse<GroupApiResponse>>(`${this.baseUrl}/${id}`);
      
      if (response.data?.data?.group) {
        const group = response.data.data.group;
        
        // Transform the members data to match our expected structure
        const transformedMembers = group.members?.map(member => ({
          id: member.id || member.GroupMember?.id,
          groupId: id,
          userId: member.id,
          role: member.GroupMember?.role || 'member',
          joinedAt: member.GroupMember?.joinedAt || member.createdAt,
          isActive: member.GroupMember?.isActive ?? true,
          user: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            profilePicture: member.profilePicture
          }
        })) || [];

        return {
          ...group,
          members: transformedMembers,
          membersCount: transformedMembers.length,
          adminsCount: transformedMembers.filter(m => m.role === 'admin').length
        };
      }
      
      throw new Error('Group not found');
    } catch (error) {
      console.error(`Error fetching group ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a group with its members (alias for getGroup)
   */
  async getGroupWithMembers(id: ID): Promise<GroupWithMembers> {
    return this.getGroup(id);
  }

  /**
   * Create a new group
   */
  async createGroup(groupData: CreateGroupDto): Promise<Group> {
    try {
      const response = await api.post<ApiResponse<GroupApiResponse>>(this.baseUrl, groupData);
      
      if (response.data?.data?.group) {
        return response.data.data.group;
      }
      
      throw new Error('Failed to create group');
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  /**
   * Update an existing group
   */
  async updateGroup(id: ID, groupData: UpdateGroupDto): Promise<Group> {
    try {
      const response = await api.put<ApiResponse<GroupApiResponse>>(`${this.baseUrl}/${id}`, groupData);
      
      if (response.data?.data?.group) {
        return response.data.data.group;
      }
      
      throw new Error('Failed to update group');
    } catch (error) {
      console.error(`Error updating group ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a group
   */
  async deleteGroup(id: ID): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Error deleting group ${id}:`, error);
      throw error;
    }
  }

  // ==================== Group Member Management ====================

  /**
   * Get members of a group
   */
  async getGroupMembers(groupId: ID): Promise<GroupMember[]> {
    try {
      const response = await api.get<ApiResponse<GroupMembersApiResponse>>(`${this.baseUrl}/${groupId}/members`);
      
      if (response.data?.data?.members) {
        // Transform the members data to match our expected structure
        return response.data.data.members.map(member => ({
          id: member.id,
          groupId: member.groupId,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          isActive: member.isActive,
          user: member.user
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching members for group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Add a member to a group
   */
  async addMember(groupId: ID, memberData: AddGroupMemberDto): Promise<GroupMember> {
    try {
      const response = await api.post<ApiResponse<{ member: GroupMember }>>(`${this.baseUrl}/${groupId}/members`, memberData);
      
      if (response.data?.data?.member) {
        return response.data.data.member;
      }
      
      throw new Error('Failed to add member');
    } catch (error) {
      console.error(`Error adding member to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Add multiple members to a group
   */
  async addMembers(groupId: ID, memberIds: ID[]): Promise<GroupMember[]> {
    try {
      const response = await api.post<ApiResponse<{ members: GroupMember[] }>>(`${this.baseUrl}/${groupId}/members`, {
        userIds: memberIds
      });
      
      if (response.data?.data?.members) {
        return response.data.data.members;
      }
      
      throw new Error('Failed to add members');
    } catch (error) {
      console.error(`Error adding multiple members to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: ID, userId: ID): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${groupId}/members/${userId}`);
    } catch (error) {
      console.error(`Error removing member ${userId} from group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Update a group member (role, etc.)
   */
  async updateMember(groupId: ID, userId: ID, updateData: { role?: string; isActive?: boolean }): Promise<GroupMember> {
    try {
      const response = await api.put<ApiResponse<{ member: GroupMember }>>(`${this.baseUrl}/${groupId}/members/${userId}`, updateData);
      
      if (response.data?.data?.member) {
        return response.data.data.member;
      }
      
      throw new Error('Failed to update member');
    } catch (error) {
      console.error(`Error updating member ${userId} in group ${groupId}:`, error);
      throw error;
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Search groups by name or description
   */
  async searchGroups(query: string): Promise<Group[]> {
    try {
      const response = await api.get<ApiResponse<GroupsApiResponse>>(`${this.baseUrl}?search=${encodeURIComponent(query)}`);
      
      if (response.data?.data?.groups) {
        return response.data.data.groups;
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching groups with query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Check if user is member of a group
   */
  async isUserMember(groupId: ID, userId?: ID): Promise<boolean> {
    try {
      const endpoint = userId 
        ? `${this.baseUrl}/${groupId}/members/${userId}/check`
        : `${this.baseUrl}/${groupId}/members/me/check`;
      
      const response = await api.get<ApiResponse<{ isMember: boolean }>>(endpoint);
      return response.data?.data?.isMember || false;
    } catch (error) {
      console.error(`Error checking membership for group ${groupId}:`, error);
      return false;
    }
  }

  /**
   * Get groups that a user belongs to
   */
  async getUserGroups(userId?: ID): Promise<Group[]> {
    try {
      const endpoint = userId ? `${this.baseUrl}/users/${userId}/groups` : `/users/me/groups`;
      const response = await api.get<ApiResponse<GroupsApiResponse>>(endpoint);
      
      if (response.data?.data?.groups) {
        return response.data.data.groups;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching user groups:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new GroupService();
