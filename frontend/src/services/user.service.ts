import api from './api';
import type { User } from '../types';

export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'all' | 'active' | 'inactive';
  emailVerified?: 'all' | 'verified' | 'unverified';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersByRole: {
    admin: number;
    moderator: number;
    user: number;
  };
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: 'admin' | 'moderator' | 'user';
  isActive?: boolean;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'admin' | 'moderator' | 'user';
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

class UserService {
  async getAllUsers(filters: UserFilters = {}): Promise<UsersResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.status && filters.status !== 'all') {
      params.append('isActive', filters.status === 'active' ? 'true' : 'false');
    }
    if (filters.emailVerified && filters.emailVerified !== 'all') {
      params.append('isEmailVerified', filters.emailVerified === 'verified' ? 'true' : 'false');
    }
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/users?${params.toString()}`);
    return response.data.data;
  }

  async getUserById(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data.user;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/users/stats');
    return response.data.data;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data.user;
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data.user;
  }

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  async activateUser(id: number): Promise<User> {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data.data.user;
  }

  async deactivateUser(id: number): Promise<User> {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data.data.user;
  }

  async resetUserPassword(id: number): Promise<void> {
    await api.post(`/users/${id}/reset-password`);
  }

  async bulkDeleteUsers(userIds: number[]): Promise<void> {
    await api.post('/users/bulk-delete', { userIds });
  }

  async bulkUpdateUsers(userIds: number[], updates: Partial<UpdateUserDto>): Promise<void> {
    await api.post('/users/bulk-update', { userIds, updates });
  }

  async exportUsers(filters: UserFilters = {}): Promise<void> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.status && filters.status !== 'all') {
      params.append('isActive', filters.status === 'active' ? 'true' : 'false');
    }

    const response = await api.get(`/users/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default new UserService();
