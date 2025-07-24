import React from 'react'
import { Link } from 'react-router-dom'
import type { LoginFormData } from './useLoginForm'
import theme from '../../../config/theme'
import { AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'

interface LoginFormProps {
  formData: LoginFormData
  errors: Partial<LoginFormData>
  isLoading: boolean
  showPassword: boolean
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  setShowPassword: (value: boolean) => void
  onForgotPassword: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  errors,
  isLoading,
  showPassword,
  handleChange,
  handleSubmit,
  setShowPassword,
  onForgotPassword
}) => {
  return (
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
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent focus:ring-opacity-50"
              style={{ color: theme.colors.secondary }}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent focus:ring-opacity-50"
              style={{ color: theme.colors.secondary }}
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
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300"
            style={{ accentColor: theme.colors.primary }}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm" style={{ color: theme.colors.secondary }}>
            Remember me
          </label>
        </div>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm hover:underline"
          style={{ color: theme.colors.secondary }}
          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.secondary}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
        style={{ 
          backgroundColor: theme.colors.primary,
          color: 'white',
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.opacity = '0.9'
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.opacity = '1'
          }
        }}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

export default LoginForm
