import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

// OAuth handler component that can be integrated into your Register page
const GoogleOAuthHandler = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we have an authorization code in the URL
    const urlParams = new URLSearchParams(location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    if (error) {
      setError(`OAuth error: ${error}`)
      return
    }

    if (code) {
      handleOAuthCallback(code)
    }
  }, [location])

  const handleOAuthCallback = async (code: string) => {
    setProcessing(true)
    setError(null)

    try {
      // Decode URL-encoded code if necessary
      const decodedCode = decodeURIComponent(code)
      
      // Exchange authorization code for tokens
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/auth/oauth/google`,
        { code: decodedCode }
      )

      if (response.data.token) {
        // Store tokens
        localStorage.setItem('token', response.data.token)
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken)
        }

        // Store user data if available
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }

        // Redirect to dashboard or home page
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      }
    } catch (err: any) {
      console.error('OAuth callback error:', err)
      setError(err.response?.data?.message || 'Authentication failed')
      setProcessing(false)
    }
  }

  // Function to initiate OAuth flow
  const initiateGoogleOAuth = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/auth/oauth/google/url`
      )
      
      if (response.data.data?.url) {
        // Redirect to Google OAuth URL
        window.location.href = response.data.data.url
      }
    } catch (err: any) {
      console.error('Failed to get OAuth URL:', err)
      setError('Failed to initiate Google sign-in')
    }
  }

  // If processing OAuth callback
  if (processing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Completing sign-in with Google...</p>
          </div>
        </div>
      </div>
    )
  }

  // If there's an error
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Authentication Failed</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Export the OAuth initiation function for use in buttons
export const initiateGoogleOAuth = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/auth/oauth/google/url`
    )
    
    if (response.data.data?.url) {
      window.location.href = response.data.data.url
    }
  } catch (err) {
    console.error('Failed to get OAuth URL:', err)
    throw err
  }
}

export default GoogleOAuthHandler
