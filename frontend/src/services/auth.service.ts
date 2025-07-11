import api, { clearTokens, setTokens } from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface AuthResponse {
  status: string;
  token: string;
  refreshToken: string;
  data: {
    user: any;
  };
}

interface UserResponse {
  success?: boolean;
  status?: string;
  data: any;
}

class AuthService {
  async login(credentials: LoginCredentials) {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { token, refreshToken, data } = response.data;
    
    // Store tokens using the api module's setTokens function
    setTokens(token, refreshToken);
    
    // Return user data - fix: return the entire response structure
    return {
      user: data.user,
      token,
      refreshToken
    };
  }

  async register(userData: RegisterData) {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { token, refreshToken, data } = response.data;
    
    // Store tokens using the api module's setTokens function
    setTokens(token, refreshToken);
    
    // Return user data - fix: return the entire response structure
    return {
      user: data.user,
      token,
      refreshToken
    };
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens using the api module's clearTokens function
      clearTokens();
    }
  }

  async getCurrentUser() {
    try {
      // First try to get user data from /users/me
      const response = await api.get<UserResponse>('/users/me');
      let userData;
      
      // Handle both possible response structures
      if (response.data.data) {
        // If data is nested, extract it
        userData = response.data.data.user || response.data.data;
      } else {
        // If data is at root level
        userData = response.data;
      }
      
      // If we don't have profilePicture, try to fetch from profile endpoint
      if (!userData.profilePicture) {
        try {
          const profileResponse = await api.get('/users/profile');
          if (profileResponse.data.success && profileResponse.data.data) {
            const profileData = profileResponse.data.data;
            // Merge profile data with user data
            userData = {
              ...userData,
              profilePicture: profileData.profilePicture || profileData.profilePictureUrl
            };
          }
        } catch (profileError) {
          console.log('Could not fetch profile picture:', profileError);
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<AuthResponse>('/auth/refresh-token', {
      refreshToken
    });

    const { token, refreshToken: newRefreshToken } = response.data;
    
    // Update tokens using the api module's setTokens function
    setTokens(token, newRefreshToken);
    
    return token;
  }

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
}

export default new AuthService();
export const authService = new AuthService();
