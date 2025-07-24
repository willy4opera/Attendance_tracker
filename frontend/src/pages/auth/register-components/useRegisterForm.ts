import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/useAuth'
import authService from '../../../services/auth.service'
import { toastSuccess, toastError, toastInfo } from '../../../utils/toastHelpers'
import { useOAuthCallback } from '../../../hooks/useOAuthCallback'
import { useSocialLogin } from '../shared-components/useSocialLogin'

export interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}


export function useRegisterForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerUser, refreshUser } = useAuth()
  
  // OAuth callback handling
  const { processing: oauthProcessing, error: oauthError, provider: oauthProvider } = useOAuthCallback()
  
  // Social login handling
  const { handleSocialLogin } = useSocialLogin({ mode: 'register' })

  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})

  // Handle OAuth errors
  useEffect(() => {
    if (oauthError) {
      toastError(`Authentication failed: ${oauthError}`)
    }
  }, [oauthError])

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
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (name === 'password') {
      checkPasswordStrength(value)
    }

    // Clear error for this field
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms'
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
      await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      })

      toastSuccess('Registration successful! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }


  return {
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
  }
}
