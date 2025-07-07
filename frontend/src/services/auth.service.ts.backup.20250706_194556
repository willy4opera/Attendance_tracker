import api, { setTokens, clearTokens } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { token, refreshToken, data } = response.data;
    
    // Store tokens
    setTokens(token, refreshToken);
    
    return {
      user: data.user,
      accessToken: token,
      refreshToken: refreshToken
    };
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    // Split name into firstName and lastName for backend
    const nameParts = userData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use firstName as lastName if only one name
    
    const response = await api.post('/auth/register', {
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.password,
      firstName,
      lastName,
      phoneNumber: userData.phoneNumber || ''
    });
    
    const { token, refreshToken, data } = response.data;
    
    // Store tokens
    setTokens(token, refreshToken);
    
    return {
      user: data.user,
      accessToken: token,
      refreshToken: refreshToken
    };
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  }

  async verifyEmail(token: string): Promise<void> {
    await api.get(`/auth/verify-email?token=${token}`);
  }

  async resendVerification(): Promise<void> {
    await api.post('/auth/resend-verification');
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  }

  async refreshTokens(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    const { token, refreshToken, data } = response.data;
    
    // Store new tokens
    setTokens(token, refreshToken);
    
    return {
      user: data.user,
      accessToken: token,
      refreshToken: refreshToken
    };
  }

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data.data;
  }
}

export default new AuthService();
export const authService = new AuthService();
