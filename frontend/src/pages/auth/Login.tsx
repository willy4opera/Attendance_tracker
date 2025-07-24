import React, { useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import theme from '../../config/theme'
import { useLoginForm } from './login-components/useLoginForm'
import LoginForm from './login-components/LoginForm'
import SocialLoginButtons from './shared-components/SocialLoginButtons'
import OAuthProcessing from './shared-components/OAuthProcessing'
import OAuthCallbackHandler from './OAuthCallbackHandler'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const location = window.location
  
  const {
    formData,
    errors,
    isLoading,
    oauthProcessing,
    oauthProvider,
    showPassword,
    setShowPassword,
    handleChange,
    handleSubmit,
    handleSocialLogin,
    handleForgotPassword
  } = useLoginForm()

  // Check if this is an OAuth callback
  const urlParams = new URLSearchParams(location.search)
  const hasOAuthCode = urlParams.has('code')
  const hasOAuthError = urlParams.has('error')
  
  // If this is an OAuth callback, handle it
  if (hasOAuthCode || hasOAuthError) {
    return <OAuthCallbackHandler />
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('[Login] User already authenticated, redirecting to dashboard')
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.default }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" style={{ borderColor: theme.colors.primary }}></div>
          <p className="mt-4 text-lg" style={{ color: theme.colors.secondary }}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  // If authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Show OAuth processing screen if processing
  if (oauthProcessing) {
    return <OAuthProcessing provider={oauthProvider} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg" style={{ backgroundColor: theme.colors.background.paper }}>
        {/* Logo and Title */}
        <div className="text-center">
          <img src="/images/logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold" style={{ color: theme.colors.secondary }}>
            Welcome Back
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.colors.secondary }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <LoginForm
          formData={formData}
          errors={errors}
          isLoading={isLoading}
          showPassword={showPassword}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          setShowPassword={setShowPassword}
          onForgotPassword={handleForgotPassword}
        />

        {/* Social Login Buttons */}
        <SocialLoginButtons onSocialLogin={handleSocialLogin} />

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <span className="text-sm" style={{ color: theme.colors.secondary }}>
            Don't have an account?{' '}
          </span>
          <Link 
            to="/register" 
            className="text-sm font-medium hover:underline" 
            style={{ color: theme.colors.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.secondary}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
