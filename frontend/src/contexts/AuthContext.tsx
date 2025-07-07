import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth.service';
import api, { clearTokens } from '../services/api';
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
        setUser(null);
        return;
      }

      console.log("Loading user data...");
      console.log("Token exists:", !!token);
      const userData = await authService.getCurrentUser();
      console.log("User data from getCurrentUser:", userData);
      console.log("Login response userData:", userData);
      console.log("AuthContext: Setting user data:", userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear everything on error
      clearTokens();
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      console.log("User data from getCurrentUser:", userData);
      console.log("Login response userData:", userData);
      console.log("AuthContext: Setting user data:", userData);
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
      const { token, refreshToken, user: userData } = response;
      
      // Update the API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log("Login response userData:", userData);
      console.log("AuthContext: Setting user data:", userData);
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
      const { token, refreshToken, user: userData } = response;
      
      // Update the API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log("Register response userData:", userData);
      console.log("AuthContext: Setting user data:", userData);
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
      // Clear all auth data - authService.logout already calls clearTokens()
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      console.log("User cleared after logout");
      showToast.success('Logged out successfully');
    }
  }, []);

  console.log("AuthContext current user state:", user);
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
