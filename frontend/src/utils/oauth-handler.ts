// OAuth Handler utility for frontend integration

export interface OAuthConfig {
  google: {
    redirectUri: string
  }
  facebook: {
    redirectUri: string
  }
  github: {
    redirectUri: string
  }
  linkedin: {
    redirectUri: string
  }
}

// OAuth configuration from environment variables
export const oauthConfig: OAuthConfig = {
  google: {
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/register'
  },
  facebook: {
    redirectUri: import.meta.env.VITE_FACEBOOK_REDIRECT_URI || window.location.origin + '/register'
  },
  github: {
    redirectUri: import.meta.env.VITE_GITHUB_REDIRECT_URI || window.location.origin + '/register'
  },
  linkedin: {
    redirectUri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI || window.location.origin + '/register'
  }
}

// Function to detect OAuth provider from URL
export function detectOAuthProvider(location: Location): string | null {
  const urlParams = new URLSearchParams(location.search)
  
  // Check for explicit provider parameter
  const provider = urlParams.get('provider')
  if (provider) return provider
  
  // Check for OAuth authorization code
  const code = urlParams.get('code')
  if (!code) return null
  
  // Try to detect provider from state parameter
  const state = urlParams.get('state')
  if (state) {
    try {
      const stateData = JSON.parse(atob(state))
      if (stateData.provider) return stateData.provider
    } catch (e) {
      // State is not base64 encoded JSON
    }
  }
  
  // Check for provider-specific parameters
  if (urlParams.get('scope')?.includes('googleapis.com')) return 'google'
  if (urlParams.get('granted_scopes')) return 'facebook'
  
  // Default to Google if we have a code but can't determine provider
  // This is because Google is configured to redirect to /register
  return 'google'
}

// Function to handle OAuth errors
export function getOAuthError(location: Location): string | null {
  const urlParams = new URLSearchParams(location.search)
  
  const error = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')
  
  if (error) {
    return errorDescription || error
  }
  
  return null
}

// Function to extract and decode OAuth code
export function extractOAuthCode(location: Location): string | null {
  const urlParams = new URLSearchParams(location.search)
  const code = urlParams.get('code')
  
  if (!code) return null
  
  // Decode URL-encoded code
  return decodeURIComponent(code)
}

// Function to check if current URL is an OAuth callback
export function isOAuthCallback(location: Location): boolean {
  const urlParams = new URLSearchParams(location.search)
  return !!(urlParams.get('code') || urlParams.get('error'))
}

// Function to clear OAuth parameters from URL
export function clearOAuthParams(navigate: any, location: Location): void {
  const { pathname } = location
  navigate(pathname, { replace: true })
}

// Function to get OAuth redirect URI for a provider
export function getRedirectUri(provider: 'google' | 'facebook' | 'github' | 'linkedin'): string {
  return oauthConfig[provider].redirectUri
}
