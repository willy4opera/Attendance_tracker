import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import authService from '../services/auth.service'
import { useAuth } from '../contexts/useAuth'
import { detectOAuthProvider, extractOAuthCode, getOAuthError, clearOAuthParams } from '../utils/oauth-handler'

interface UseOAuthCallbackResult {
  processing: boolean
  error: string | null
  provider: string | null
}

export function useOAuthCallback(): UseOAuthCallbackResult {
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check for OAuth error
      const oauthError = getOAuthError(location)
      if (oauthError) {
        setError(oauthError)
        clearOAuthParams(navigate, location)
        return
      }

      // Extract authorization code
      const code = extractOAuthCode(location)
      if (!code) return

      // Detect provider
      const detectedProvider = detectOAuthProvider(location)
      if (!detectedProvider) {
        setError('Unable to determine OAuth provider')
        clearOAuthParams(navigate, location)
        return
      }

      setProvider(detectedProvider)
      setProcessing(true)

      try {
        let result
        
        // Call the appropriate auth handler based on provider
        switch (detectedProvider.toLowerCase()) {
          case 'google':
            result = await authService.authenticateOAuth('google', { code })
            break
          case 'facebook':
            result = await authService.authenticateOAuth('facebook', { code })
            break
          case 'github':
            result = await authService.authenticateOAuth('github', { code })
            break
          case 'linkedin':
            result = await authService.authenticateOAuth('linkedin', { code })
            break
          default:
            throw new Error(`Unsupported OAuth provider: ${detectedProvider}`)
        }

        if (result) {
          // Refresh user data
          await refreshUser()
          
          // Clear OAuth params from URL
          clearOAuthParams(navigate, location)
          
          // Navigate to dashboard after successful auth
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000)
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err)
        setError(err.response?.data?.message || err.message || 'Authentication failed')
        setProcessing(false)
        
        // Clear OAuth params from URL
        clearOAuthParams(navigate, location)
      }
    }

    handleOAuthCallback()
  }, [location, navigate, refreshUser])

  return { processing, error, provider }
}
