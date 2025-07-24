import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../contexts/useAuth'
import { useNavigate } from 'react-router-dom'
import authService from '../../../services/auth.service'
import { toastError, toastSuccess } from '../../../utils/toastHelpers'
import Swal from 'sweetalert2'
import theme from '../../../config/theme'

interface UseSocialLoginOptions {
  mode: 'login' | 'register'
}

// Global variable to store the popup window reference
let authWindow: Window | null = null
let checkWindowTimer: NodeJS.Timeout | null = null

export function useSocialLogin(options: UseSocialLoginOptions = { mode: 'login' }) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { refreshUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const processingRef = useRef(false)
  
  // Listen for messages from the popup window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      console.log('[useSocialLogin] Received message from:', event.origin);
      console.log('[useSocialLogin] Message type:', event.data?.type);
      console.log('[useSocialLogin] Full message data:', event.data);
      
      // Verify the origin of the message
      if (event.origin !== window.location.origin) {
        console.log('[useSocialLogin] Ignoring message from different origin');
        return
      }

      // Handle OAuth completion message
      if (event.data.type === 'oauth-complete') {
        console.log('[useSocialLogin] Processing oauth-complete message');
        const { provider, success } = event.data
        
        if (success) {
          console.log('[useSocialLogin] OAuth completed successfully');
          
          // Mark as processing
          processingRef.current = true
          
          // Clear any window checking timer
          if (checkWindowTimer) {
            clearInterval(checkWindowTimer)
            checkWindowTimer = null
          }
          
          try {
            // Close the Swal modal immediately
            console.log('[useSocialLogin] Closing Swal modal');
            Swal.close()
            
            // Show success message
            toastSuccess(`${provider} sign-in successful!`)
            
            // Refresh user data
            console.log('[useSocialLogin] Refreshing user data');
            await refreshUser()
            
            // Force page reload to ensure all components update
            console.log('[useSocialLogin] Reloading page to dashboard');
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 500)
            
          } catch (err) {
            console.error('[useSocialLogin] Failed to complete OAuth flow:', err)
            toastError('Authentication succeeded but failed to load user data. Please refresh the page.')
            // Force reload anyway
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          } finally {
            // Reset state
            setIsLoading(null)
            processingRef.current = false
            authWindow = null
          }
        }
      }
      
      // Handle OAuth error message
      else if (event.data.type === 'oauth-error') {
        console.log('[useSocialLogin] Processing oauth-error message');
        const { error, provider } = event.data
        
        console.error('[useSocialLogin] OAuth error details:', { error, provider });
        
        // Clear any window checking timer
        if (checkWindowTimer) {
          clearInterval(checkWindowTimer)
          checkWindowTimer = null
        }
        
        // Close Swal and show error
        Swal.close()
        toastError(error || 'Authentication failed')
        
        // Reset state
        setIsLoading(null)
        processingRef.current = false
        authWindow = null
      }
    }

    console.log('[useSocialLogin] Setting up message listener');
    window.addEventListener('message', handleMessage)
    
    return () => {
      console.log('[useSocialLogin] Cleaning up message listener');
      window.removeEventListener('message', handleMessage)
      if (checkWindowTimer) {
        clearInterval(checkWindowTimer)
        checkWindowTimer = null
      }
    }
  }, [refreshUser, navigate, isAuthenticated])

  const handleSocialLogin = async (provider: string) => {
    // Prevent duplicate requests
    if (isLoading === provider || processingRef.current) {
      console.log('[useSocialLogin] Already processing, ignoring click')
      return
    }
    
    // Reset processing flag
    processingRef.current = false
    
    // Clean up any existing timer
    if (checkWindowTimer) {
      clearInterval(checkWindowTimer)
      checkWindowTimer = null
    }
    
    // Close any existing popup window
    if (authWindow) {
      try {
        authWindow.close()
      } catch (e) {
        console.log('[useSocialLogin] Could not close existing window')
      }
      authWindow = null
    }
    
    setIsLoading(provider)
    
    // Show connecting modal
    Swal.fire({
      title: `Connecting to ${provider}...`,
      html: `<div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p class="mt-3">Please complete authentication in the popup window</p>
        <p class="mt-2 text-sm text-gray-500">If the popup was blocked, please allow popups and try again</p>
      </div>`,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: theme.colors.background.paper,
      color: theme.colors.primary,
      didOpen: async () => {
        try {
          console.log(`[useSocialLogin] Getting OAuth URL for ${provider}...`)
          
          // Get OAuth URL from backend
          const { url } = await authService.getOAuthUrl(provider.toLowerCase())
          
          console.log(`[useSocialLogin] OAuth URL received:`, url)
          console.log(`[useSocialLogin] Opening popup...`)
          
          // Calculate popup window position
          const width = 600
          const height = 700
          const left = window.screenX + (window.outerWidth - width) / 2
          const top = window.screenY + (window.outerHeight - height) / 2
          
          // Open OAuth in popup window
          authWindow = window.open(
            url,
            `${provider}_Login`,
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
          )

          // Check if popup was blocked
          if (!authWindow) {
            Swal.close()
            toastError('Popup was blocked! Please allow popups for this site and try again.')
            setIsLoading(null)
            return
          }

          console.log('[useSocialLogin] Popup window opened successfully')

          // Set a reasonable timeout for authentication
          setTimeout(() => {
            if (isLoading && !processingRef.current) {
              console.log('[useSocialLogin] Authentication timeout')
              Swal.close()
              toastError('Authentication timed out. Please try again.')
              setIsLoading(null)
              authWindow = null
            }
          }, 300000) // 5 minutes

        } catch (error: any) {
          console.error(`[useSocialLogin] Failed to get OAuth URL:`, error)
          Swal.close()
          
          let errorMessage = `Failed to connect to ${provider}`
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message
          } else if (error.message) {
            errorMessage = error.message
          }
          
          toastError(errorMessage)
          setIsLoading(null)
        }
      }
    })
  }

  return {
    handleSocialLogin,
    isLoading
  }
}
