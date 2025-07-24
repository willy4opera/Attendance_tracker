import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { authService } from '../services/auth.service';
import api, { clearTokens } from '../services/api';
import { showToast } from '../utils/toast';
import { AxiosError } from 'axios';

// Define interfaces directly in this file
export interface User {
  id?: string | number;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'moderator' | 'user';
  name?: string;
  emailVerified?: boolean;
  departmentId?: string | number;
  phoneNumber?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const userLoadedRef = useRef(false);
  const loadingRef = useRef(false);

  const loadUser = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current || userLoadedRef.current) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    loadingRef.current = true;
    
    try {
      console.log("Loading user data...");
      console.log("Token exists:", !!token);
      
      const userData = await authService.getCurrentUser();
      console.log("User data from getCurrentUser:", userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      userLoadedRef.current = true;
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear everything on error
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  const refreshUser = useCallback(async () => {
    // Only refresh if user is already authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      const userData = await authService.getCurrentUser();
      console.log("User data from getCurrentUser:", userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [isAuthenticated]);

  // Only load user once on mount
  useEffect(() => {
    if (!userLoadedRef.current) {
      loadUser();
    }
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      const { token, refreshToken, user: userData } = response;
      
      console.log("Login response userData:", userData);
      console.log("AuthContext: Setting user data:", userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      userLoadedRef.current = true;
      
      showToast.success('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
      let message = 'Login failed. Please try again.';
      
      if (error instanceof AxiosError) {
        const errorResponse = error.response?.data;
        if (errorResponse?.message) {
          message = errorResponse.message;
        } else if (errorResponse?.error?.message) {
          message = errorResponse.error.message;
        }
      }
      
      showToast.error(message);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    userLoadedRef.current = false;
    showToast.success('Logged out successfully!');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
