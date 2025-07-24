import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface OAuthResponse {
  token: string
  refreshToken?: string
  user?: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

class OAuthService {
  // Get OAuth URL for a provider
  async getOAuthUrl(provider: 'google' | 'facebook' | 'github' | 'linkedin'): Promise<string> {
    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/oauth/${provider}/url`)
      return response.data.data?.url || response.data.url
    } catch (error) {
      console.error(`Failed to get ${provider} OAuth URL:`, error)
      throw error
    }
  }

  // Exchange authorization code for tokens
  async exchangeCodeForToken(provider: 'google' | 'facebook' | 'github' | 'linkedin', code: string): Promise<OAuthResponse> {
    try {
      // Decode URL-encoded code if necessary
      const decodedCode = decodeURIComponent(code)
      
      const response = await axios.post(
        `${API_URL}/api/v1/auth/oauth/${provider}`,
        { code: decodedCode }
      )
      
      return response.data
    } catch (error) {
      console.error(`Failed to exchange ${provider} code:`, error)
      throw error
    }
  }

  // Handle the complete OAuth flow
  async handleOAuthCallback(provider: string, code: string): Promise<OAuthResponse> {
    const validProviders = ['google', 'facebook', 'github', 'linkedin']
    
    if (!validProviders.includes(provider.toLowerCase())) {
      throw new Error(`Invalid OAuth provider: ${provider}`)
    }

    return this.exchangeCodeForToken(provider as any, code)
  }

  // Initiate OAuth flow by redirecting to provider
  async initiateOAuthFlow(provider: 'google' | 'facebook' | 'github' | 'linkedin'): Promise<void> {
    try {
      const url = await this.getOAuthUrl(provider)
      window.location.href = url
    } catch (error) {
      console.error(`Failed to initiate ${provider} OAuth flow:`, error)
      throw error
    }
  }

  // Store OAuth tokens and user data
  storeAuthData(data: OAuthResponse): void {
    if (data.token) {
      localStorage.setItem('token', data.token)
    }
    
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }
    
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }
  }

  // Clear auth data
  clearAuthData(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }
}

export default new OAuthService()
