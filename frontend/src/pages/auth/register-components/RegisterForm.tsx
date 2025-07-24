import React from 'react'
import type { RegisterFormData } from './useRegisterForm'
import theme from '../../../config/theme'
import { AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineUser } from 'react-icons/ai'
import { Link } from 'react-router-dom'

interface RegisterFormProps {
  formData: RegisterFormData
  errors: Partial<RegisterFormData>
  isLoading: boolean
  showPassword: boolean
  showConfirmPassword: boolean
  passwordStrength: number
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  setShowPassword: (value: boolean) => void
  setShowConfirmPassword: (value: boolean) => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  errors,
  isLoading,
  showPassword,
  showConfirmPassword,
  passwordStrength,
  handleChange,
  handleSubmit,
  setShowPassword,
  setShowConfirmPassword
}) => {
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength === 2) return 'bg-yellow-500'
    if (passwordStrength === 3) return 'bg-yellow-600'
    if (passwordStrength === 4) return 'bg-green-500'
    return 'bg-green-600'
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        {/* Name Fields Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
              First Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineUser className="h-5 w-5" style={{ color: theme.colors.secondary }} />
              </div>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent focus:ring-opacity-50"
                style={{ color: theme.colors.secondary }}
                placeholder="First name"
              />
            </div>
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
              Last Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineUser className="h-5 w-5" style={{ color: theme.colors.secondary }} />
              </div>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent focus:ring-opacity-50"
                style={{ color: theme.colors.secondary }}
                placeholder="Last name"
              />
            </div>
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
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
              placeholder="Create a password"
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
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: theme.colors.secondary }}>
                  Password strength
                </span>
                <span className="text-xs" style={{ color: theme.colors.secondary }}>
                  {passwordStrength === 1 && 'Weak'}
                  {passwordStrength === 2 && 'Fair'}
                  {passwordStrength === 3 && 'Good'}
                  {passwordStrength === 4 && 'Strong'}
                  {passwordStrength === 5 && 'Very Strong'}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AiOutlineLock className="h-5 w-5" style={{ color: theme.colors.secondary }} />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent focus:ring-opacity-50"
              style={{ color: theme.colors.secondary }}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <AiOutlineEyeInvisible className="h-5 w-5 hover:opacity-70" style={{ color: theme.colors.secondary }} />
              ) : (
                <AiOutlineEye className="h-5 w-5 hover:opacity-70" style={{ color: theme.colors.secondary }} />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 mt-0.5"
            style={{ accentColor: theme.colors.primary }}
          />
          <label htmlFor="agreeToTerms" className="ml-2 block text-sm" style={{ color: theme.colors.secondary }}>
            I agree to the{' '}
            <Link 
              to="/terms" 
              className="font-medium hover:underline"
              style={{ color: theme.colors.primary }}
            >
              Terms and Conditions
            </Link>
            {' '}and{' '}
            <Link 
              to="/privacy" 
              className="font-medium hover:underline"
              style={{ color: theme.colors.primary }}
            >
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1 ml-6">{errors.agreeToTerms}</p>}
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
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}

export default RegisterForm
