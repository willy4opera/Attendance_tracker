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
  private pendingOAuthRequests?: Map<string, Promise<any>>;

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
    const response = await api.post<AuthResponse>('/auth/signup', userData);
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

  // OAuth methods
  async getOAuthUrl(provider: string): Promise<{ url: string }> {
    // Generate state parameter to identify provider and prevent CSRF
    const state = btoa(JSON.stringify({ 
      provider, 
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2) 
    }));
    
    const response = await api.get<{ data: { url: string } }>(`/auth/oauth/${provider}/url?state=${encodeURIComponent(state)}`);
    return response.data.data;
  }

  async authenticateOAuth(provider: string, data: any): Promise<any> {
    const code = data.code || data.accessToken;
    console.log(`[AuthService] OAuth ${provider} authentication started with code:`, code ? code.substring(0, 20) + '...' : 'NO CODE', 'state:', data.state ? data.state.substring(0, 20) + '...' : 'NO STATE');
    
    
    // Check global deduplication first
    
    // Create request key for backward compatibility
    const requestKey = `${provider}_${code}`;
    
    // Check if we have a pending request with the same key
    if (this.pendingOAuthRequests?.has(requestKey)) {
      console.log(`[AuthService] Found pending OAuth request for ${provider}, returning existing promise`);
      return this.pendingOAuthRequests.get(requestKey);
    }
    
    // Initialize pendingOAuthRequests if needed
    if (!this.pendingOAuthRequests) {
      this.pendingOAuthRequests = new Map();
    }
    
    try {
      // Create and store the promise
      const requestPromise = this.executeOAuthRequest(provider, data);
      this.pendingOAuthRequests.set(requestKey, requestPromise);
      
      // Also store in global deduplication
      if (code) {
      }
      
      const result = await requestPromise;
      
      // Clean up after successful request
      this.pendingOAuthRequests.delete(requestKey);
      
      return result;
    } catch (error) {
      // Clean up after failed request
      this.pendingOAuthRequests.delete(requestKey);
      throw error;
    }
  }
  
  private async executeOAuthRequest(provider: string, data: any): Promise<any> {
    try {
      // Skip deduplication for OAuth to prevent duplicate code errors
      const response = await api.post<AuthResponse>(`/auth/oauth/${provider}`, data, { skipDeduplication: true });
      
      // Check if response has the expected structure
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from authentication server');
      }
      
      const { token, refreshToken, data: responseData } = response.data;
      
      // Validate required fields
      if (!token) {
        throw new Error('No authentication token received');
      }
      
      // Store tokens
      setTokens(token, refreshToken);
      
      return {
        user: responseData?.user,
        token
      };
    } catch (error: any) {
      console.error(`[AuthService] OAuth ${provider} authentication failed:`, error);
      
      // Check for duplicate code error
      if (error.response?.data?.error === 'duplicate_code') {
        // Create a more specific error for duplicate codes
        const duplicateError = new Error('The authorization code has already been used. Please try signing in again.');
        (duplicateError as any).response = error.response;
        throw duplicateError;
      }
      
      // Handle LinkedIn-specific errors
      if (provider === 'linkedin') {
        const status = error.response?.status;
        const message = error.response?.data?.message || '';
        
        // Handle the specific LinkedIn error messages from our backend
        if (message.includes('authorization already exists')) {
          // This happens when LinkedIn says "external member binding exists"
          const linkedInError = new Error('You have already authorized LinkedIn. Please try signing in again from the login page.');
          (linkedInError as any).isRecoverable = true;
          (linkedInError as any).response = error.response;
          throw linkedInError;
        }
        
        if (status === 409 || message.includes('already connected')) {
          // This is actually a success case for LinkedIn - user is already connected
          const linkedInError = new Error('Your LinkedIn account is already connected. Please try logging in again.');
          (linkedInError as any).isRecoverable = true;
          (linkedInError as any).response = error.response;
          throw linkedInError;
        }
        
        if (status === 401 || message.includes('expired')) {
          const expiredError = new Error('The authorization has expired. Please try logging in again.');
          (expiredError as any).response = error.response;
          throw expiredError;
        }
        
        if (status === 503 || message.includes('LinkedIn temporarily blocked')) {
          const serviceError = new Error(message || 'LinkedIn service is temporarily unavailable. Please try again later.');
          (serviceError as any).response = error.response;
          (serviceError as any).isLinkedInRateLimit = true;
          throw serviceError;
        }
      }
      
      // Handle other provider-specific errors if needed
      if (error.response?.data?.message) {
        const customError = new Error(error.response.data.message);
        (customError as any).response = error.response;
        throw customError;
      }
      
      // Re-throw the original error
      throw error;
    }
  }

  async handleGoogleAuth(code: string) {
    return this.authenticateOAuth('google', { code });
  }

  async handleFacebookAuth(code: string) {
    return this.authenticateOAuth('facebook', { code });
  }

  async handleGitHubAuth(code: string) {
    return this.authenticateOAuth('github', { code });
  }

  async handleLinkedInAuth(code: string, state?: string) {
    return this.authenticateOAuth('linkedin', { code, state });
  }
}

export default new AuthService();
export const authService = new AuthService();
