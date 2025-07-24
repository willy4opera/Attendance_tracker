import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/useAuth'
import authService from '../../../services/auth.service'
import { toastSuccess, toastError, toastInfo } from '../../../utils/toastHelpers'
import { useOAuthCallback } from '../../../hooks/useOAuthCallback'
import { useSocialLogin } from '../shared-components/useSocialLogin'

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}


export function useLoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, refreshUser } = useAuth()
  
  // OAuth callback handling
  const { processing: oauthProcessing, error: oauthError, provider: oauthProvider } = useOAuthCallback()
  
  // Social login handling
  const { handleSocialLogin } = useSocialLogin({ mode: 'login' })

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})

  // Handle OAuth errors
  useEffect(() => {
    if (oauthError) {
      toastError(`Authentication failed: ${oauthError}`)
    }
  }, [oauthError])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error for this field
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toastError('Please fix the errors in the form')
      return
    }

    setIsLoading(true)

    try {
      await login({
        email: formData.email,
        password: formData.password
      })
      
      toastSuccess('Login successful! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }


  const handleForgotPassword = () => {
    toastInfo('Password reset feature coming soon!')
  }

  return {
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
  }
}
