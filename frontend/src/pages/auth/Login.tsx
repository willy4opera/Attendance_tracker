import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGoogle, FaFacebook, FaGithub, FaLinkedin, FaMicrosoft, FaApple } from 'react-icons/fa'
import { AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import theme from '../../config/theme'
import { useAuth } from '../../contexts/useAuth'
import { toastSuccess, toastError, toastInfo } from '../../utils/toastHelpers'

interface SocialProvider {
  name: string
  icon: React.ReactNode
  color: string
}

const socialProviders: SocialProvider[] = [
  { name: 'Google', icon: <FaGoogle />, color: '#DB4437' },
  { name: 'Facebook', icon: <FaFacebook />, color: '#1877F2' },
  { name: 'GitHub', icon: <FaGithub />, color: '#333333' },
  { name: 'LinkedIn', icon: <FaLinkedin />, color: '#0A66C2' },
  { name: 'Microsoft', icon: <FaMicrosoft />, color: '#5E5E5E' },
  { name: 'Apple', icon: <FaApple />, color: '#000000' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await login({ email, password })
      
      if (response.success) {
        toastSuccess('Login successful! Redirecting...')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        toastError(response.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      toastError('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    toastInfo(`${provider} login coming soon!`)
    // TODO: Implement social login
    // window.location.href = `/api/v1/auth/${provider.toLowerCase()}`
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
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AiOutlineMail className="h-5 w-5" style={{ color: theme.colors.secondary }} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent focus:ring-opacity-50"
                  style={{ 
                    color: theme.colors.secondary
                  }}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AiOutlineLock className="h-5 w-5" style={{ color: theme.colors.secondary }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent focus:ring-opacity-50"
                  style={{ 
                    color: theme.colors.secondary
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible className="h-5 w-5 hover:opacity-70" style={{ color: theme.colors.secondary }} />
                  ) : (
                    <AiOutlineEye className="h-5 w-5 hover:opacity-70" style={{ color: theme.colors.secondary }} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                style={{ accentColor: theme.colors.primary }}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: theme.colors.secondary }}>
                Remember me
              </label>
            </div>
            <Link 
              to="/forgot-password" 
              className="text-sm hover:underline" 
              style={{ color: theme.colors.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.secondary}
              onClick={() => toastInfo('Password reset feature coming soon!')}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            style={{ 
              backgroundColor: theme.colors.primary,
              color: theme.colors.secondary,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = theme.colors.secondary
                e.currentTarget.style.color = theme.colors.primary
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary
              e.currentTarget.style.color = theme.colors.secondary
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2" style={{ backgroundColor: theme.colors.background.paper, color: theme.colors.secondary }}>
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {socialProviders.map((provider) => (
            <button
              key={provider.name}
              onClick={() => handleSocialLogin(provider.name)}
              className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg hover:shadow-md transition-all duration-200"
              style={{
                backgroundColor: 'white',
                borderColor: '#e5e5e5'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary
                e.currentTarget.style.borderColor = theme.colors.secondary
                const icon = e.currentTarget.querySelector('svg')
                if (icon) {
                  (icon as unknown as HTMLElement).style.color = theme.colors.primary
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#e5e5e5'
                const icon = e.currentTarget.querySelector('svg')
                if (icon) {
                  (icon as unknown as HTMLElement).style.color = provider.color
                }
              }}
            >
              <span className="text-xl">
                {React.cloneElement(provider.icon as React.ReactElement, {
                  style: { color: provider.color }
                })}
              </span>
            </button>
          ))}
        </div>

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
