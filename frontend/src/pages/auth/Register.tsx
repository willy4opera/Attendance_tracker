import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import theme from '../../config/theme'
import { useRegisterForm } from './register-components/useRegisterForm'
import RegisterForm from './register-components/RegisterForm'
import SocialLoginButtons from './shared-components/SocialLoginButtons'
import OAuthProcessing from './shared-components/OAuthProcessing'
import OAuthCallbackHandler from './OAuthCallbackHandler'

export default function Register() {
  const location = useLocation()
  const {
    formData,
    errors,
    isLoading,
    oauthProcessing,
    oauthProvider,
    showPassword,
    showConfirmPassword,
    passwordStrength,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
    handleSocialLogin
  } = useRegisterForm()

  // Check if this is an OAuth callback
  const urlParams = new URLSearchParams(location.search)
  const hasOAuthCode = urlParams.has('code')
  const hasOAuthError = urlParams.has('error')
  
  // If this is an OAuth callback, handle it
  if (hasOAuthCode || hasOAuthError) {
    return <OAuthCallbackHandler />
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
            Create Account
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.colors.secondary }}>
            Join us to start tracking attendance
          </p>
        </div>

        {/* Registration Form */}
        <RegisterForm
          formData={formData}
          errors={errors}
          isLoading={isLoading}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          passwordStrength={passwordStrength}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          setShowPassword={setShowPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />

        {/* Social Login Buttons */}
        <SocialLoginButtons onSocialLogin={handleSocialLogin} />

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <span className="text-sm" style={{ color: theme.colors.secondary }}>
            Already have an account?{' '}
          </span>
          <Link 
            to="/login" 
            className="text-sm font-medium hover:underline" 
            style={{ color: theme.colors.secondary }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.secondary}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
