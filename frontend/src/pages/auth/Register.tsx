import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaGoogle, FaFacebook, FaGithub, FaLinkedin, FaMicrosoft, FaApple } from 'react-icons/fa'
import { AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineUser, AiOutlinePhone } from 'react-icons/ai'
import theme from '../../config/theme'
import api, { setTokens } from '../../services/api'
import { useAuth } from '../../contexts/useAuth'
import { toastSuccess, toastError, toastInfo } from '../../utils/toast'

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

export default function Register() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const checkPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/)) strength++
    if (password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    setPasswordStrength(strength)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'password') {
      checkPasswordStrength(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toastError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toastError('Password must be at least 8 characters long')
      return
    }

    if (!agreeToTerms) {
      toastError('Please agree to the terms and conditions')
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber
      })
      
      const { token, refreshToken } = response.data
      
      // Store tokens
      setTokens(token, refreshToken)
      
      // Fetch user data after setting tokens
      await refreshUser()
      
      toastSuccess('Registration successful! 🎉')
      toastInfo('Please check your email to verify your account')
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      const errorMessage = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.'
      toastError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    toastInfo(`${provider} registration coming soon!`)
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444' // red
    if (passwordStrength <= 3) return '#f59e0b' // yellow
    return '#10b981' // green
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return ''
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ backgroundColor: theme.colors.background.default }}>
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
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* First Name and Last Name - Side by side */}
            <div className="grid grid-cols-2 gap-4">
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
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ 
                      color: theme.colors.secondary,
                       
                    }}
                    placeholder="First name"
                  />
                </div>
              </div>

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
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ 
                      color: theme.colors.secondary,
                       
                    }}
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

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
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    color: theme.colors.secondary,
                     
                  }}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2" style={{ color: theme.colors.secondary }}>
                Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AiOutlinePhone className="h-5 w-5" style={{ color: theme.colors.secondary }} />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    color: theme.colors.secondary,
                     
                  }}
                  placeholder="+1234567890"
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    color: theme.colors.secondary,
                     
                  }}
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
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: theme.colors.secondary }}>Password strength</span>
                    <span className="text-xs font-medium" style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
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
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    color: theme.colors.secondary,
                     
                  }}
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
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 mt-1"
              style={{ accentColor: theme.colors.primary }}
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm" style={{ color: theme.colors.secondary }}>
              I agree to the{' '}
              <Link 
                to="/terms" 
                className="underline"
                style={{ color: theme.colors.secondary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.secondary}
              >
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link 
                to="/privacy" 
                className="underline"
                style={{ color: theme.colors.secondary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.secondary}
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreeToTerms}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            style={{ 
              backgroundColor: theme.colors.primary,
              color: theme.colors.secondary,
              opacity: (isLoading || !agreeToTerms) ? 0.7 : 1,
              cursor: (isLoading || !agreeToTerms) ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && agreeToTerms) {
                e.currentTarget.style.backgroundColor = theme.colors.secondary
                e.currentTarget.style.color = theme.colors.primary
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary
              e.currentTarget.style.color = theme.colors.secondary
            }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2" style={{ backgroundColor: theme.colors.background.paper, color: theme.colors.secondary }}>
              Or sign up with
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
