import api from './api';
import type { Group } from '../types';

interface UserGroupMember {
  id: number;
  name: string;
  email: string;
  joinedAt: string;
  isOwner: boolean;
}

interface AvailableGroup extends Group {
  owner: {
    id: number;
    name: string;
  };
  memberCount: number;
}

class UserGroupService {
  // Get all groups for the current user
  async getUserGroups(): Promise<Group[]> {
    try {
      const response = await api.get('/groups/my-groups');
      // The API returns data in response.data.data.groups format
      return response.data.data?.groups || [];
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw new Error('Failed to fetch user groups');
    }
  }

  // Join a group
  async joinGroup(groupId: number): Promise<any> {
    try {
      const response = await api.post(`/groups/${groupId}/join`);
      return response.data;
    } catch (error) {
      console.error('Error joining group:', error);
      throw new Error('Failed to join group');
    }
  }

  // Leave a group
  async leaveGroup(groupId: number): Promise<any> {
    try {
      const response = await api.post(`/groups/${groupId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw new Error('Failed to leave group');
    }
  }

  // Get members of a group
  async getGroupMembers(groupId: number): Promise<UserGroupMember[]> {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      // The API returns data in response.data.data.members format
      return response.data.data?.members || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw new Error('Failed to fetch group members');
    }
  }

  // Remove a member from group (owner only)
  async removeMember(groupId: number, memberId: number): Promise<any> {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Failed to remove member');
    }
  }

  // Get available groups to join
  async getAvailableGroups(): Promise<AvailableGroup[]> {
    try {
      const response = await api.get('/groups/available');
      // The API returns data in response.data.data.groups format
      return response.data.data?.groups || [];
    } catch (error) {
      console.error('Error fetching available groups:', error);
      throw new Error('Failed to fetch available groups');
    }
  }
}

export default new UserGroupService();
