import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth.service';
import api from '../services/api';
import { showToast } from '../utils/toast';
import { AxiosError } from 'axios';

// Define interfaces directly in this file
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'moderator' | 'user';
  name?: string;
  emailVerified?: boolean;
  isEmailVerified?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface ErrorResponse {
  message?: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      const { accessToken, refreshToken, user: userData } = response;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(userData);
      showToast.success('Login successful!');
      
      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const message = axiosError.response?.data?.message || 'Login failed';
      showToast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      const { accessToken, refreshToken, user: userData } = response;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(userData);
      showToast.success('Registration successful!');
      
      return { success: true };
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const message = axiosError.response?.data?.message || 'Registration failed';
      showToast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      showToast.success('Logged out successfully');
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
