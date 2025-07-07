import api from './api';
import { AxiosError } from 'axios';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'admin' | 'moderator' | 'user';
  department?: string;
  status: 'active' | 'inactive';
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

class UserService {
  // Get all users with optional filters
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<UsersResponse> {
    try {
      const response = await api.get('/users', { params });
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch users');
    }
  }

  // Get a single user by ID
  async getUser(id: string): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data.user;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch user');
    }
  }

  // Create a new user
  async createUser(userData: Partial<User> & { password: string }): Promise<User> {
    try {
      const response = await api.post('/users', userData);
      return response.data.data.user;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create user');
    }
  }

  // Update a user
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data.data.user;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update user');
    }
  }

  // Delete a user
  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete user');
    }
  }

  // Activate/Deactivate users
  async updateUserStatus(userIds: string[], status: 'active' | 'inactive'): Promise<void> {
    try {
      await api.post('/users/bulk-status', { userIds, status });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update user status');
    }
  }
}

export default new UserService();
