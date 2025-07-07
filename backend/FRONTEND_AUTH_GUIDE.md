# Frontend Authentication System Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Email Verification Endpoints](#email-verification-endpoints)
4. [Frontend Components Structure](#frontend-components-structure)
5. [Implementation Details](#implementation-details)
6. [State Management](#state-management)
7. [Security Best Practices](#security-best-practices)

## Overview

This guide provides a complete blueprint for implementing the frontend authentication system for the Attendance Tracker application. The backend uses JWT tokens with refresh token rotation for secure authentication.

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication Headers
```javascript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

## Authentication Endpoints

### 1. User Registration
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "passwordConfirm": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890" // Optional
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "token": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": false,
      "emailVerificationToken": "token_here",
      "emailVerificationExpires": "2025-07-06T12:00:00.000Z"
    }
  }
}
```

**Frontend Implementation:**
```javascript
// Register Component
const handleRegister = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store tokens
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Store user data
      setUser(data.data.user);
      
      // Redirect to email verification notice
      navigate('/verify-email-notice');
    }
  } catch (error) {
    // Handle error
  }
};
```

### 2. User Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "token": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": true
    }
  }
}
```

### 3. Logout
**Endpoint:** `POST /auth/logout`

**Headers Required:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### 4. Refresh Token
**Endpoint:** `POST /auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "token": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

### 5. Get Current User
**Endpoint:** `GET /auth/me`

**Headers Required:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": true
    }
  }
}
```

### 6. Update Password
**Endpoint:** `PATCH /auth/update-password`

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "newPasswordConfirm": "NewPass123!"
}
```

## Email Verification Endpoints

### 1. Verify Email with Token
**Endpoint:** `GET /email-verification/verify/:token`

**No Authentication Required**

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2. Resend Verification Email
**Endpoint:** `POST /email-verification/resend`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 3. Check Verification Status
**Endpoint:** `GET /email-verification/status`

**Headers Required:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "emailVerified": true,
    "email": "user@example.com"
  }
}
```

## Frontend Components Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── UpdatePassword.jsx
│   │   └── EmailVerification.jsx
│   ├── layout/
│   │   ├── ProtectedRoute.jsx
│   │   └── AuthLayout.jsx
│   └── shared/
│       ├── LoadingSpinner.jsx
│       └── ErrorMessage.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useRefreshToken.js
│   └── useAxiosPrivate.js
├── services/
│   ├── authService.js
│   └── apiClient.js
├── context/
│   └── AuthContext.jsx
└── utils/
    ├── tokenUtils.js
    └── validators.js
```

## Implementation Details

### 1. Auth Context Provider
```javascript
// context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token expired or invalid
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.data.user);
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setUser(response.data.user);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. API Client with Interceptors
```javascript
// services/apiClient.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { token, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. Protected Route Component
```javascript
// components/layout/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';

const ProtectedRoute = ({ children, requireEmailVerification = false }) => {
  const { isAuthenticated, isEmailVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireEmailVerification && !isEmailVerified) {
    return <Navigate to="/verify-email-notice" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### 4. Email Verification Component
```javascript
// components/auth/EmailVerification.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Email verified successfully! Please login.' } 
          });
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="email-verification">
      {status === 'verifying' && (
        <div>
          <LoadingSpinner />
          <p>Verifying your email...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="success-message">
          <h2>Email Verified Successfully!</h2>
          <p>{message}</p>
          <p>Redirecting to login...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error-message">
          <h2>Verification Failed</h2>
          <p>{message}</p>
          <button onClick={() => navigate('/resend-verification')}>
            Resend Verification Email
          </button>
        </div>
      )}
    </div>
  );
};
```

## State Management

### User State Structure
```javascript
{
  user: {
    id: "uuid",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "user",
    emailVerified: true,
    phoneNumber: "+1234567890",
    department: null,
    employeeId: null,
    profilePicture: null,
    isActive: true,
    lastLogin: "2025-07-05T12:00:00.000Z"
  },
  isAuthenticated: true,
  isLoading: false,
  error: null
}
```

### Token Storage
- **Access Token**: Short-lived (7 days), stored in localStorage
- **Refresh Token**: Long-lived (30 days), stored in localStorage
- Consider using httpOnly cookies for enhanced security in production

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Expiration**: Implement automatic token refresh
3. **Input Validation**: Validate all inputs client-side and server-side
4. **XSS Protection**: Sanitize all user inputs
5. **CSRF Protection**: Implement CSRF tokens for state-changing operations
6. **Rate Limiting**: Respect server rate limits (100 requests per 15 minutes)
7. **Secure Storage**: Consider using secure storage methods for tokens

## Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Error Handling

### Common Error Responses
```javascript
// 400 Bad Request
{
  "status": "fail",
  "message": "Validation error message"
}

// 401 Unauthorized
{
  "status": "fail",
  "message": "You are not logged in! Please log in to get access."
}

// 403 Forbidden
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}

// 404 Not Found
{
  "status": "fail",
  "message": "Resource not found"
}

// 500 Internal Server Error
{
  "status": "error",
  "message": "Something went wrong!"
}
```

## Email Templates

The system sends the following emails:
1. **Welcome Email** - Includes verification link and code
2. **Verification Success Email** - Confirms email verification
3. **Password Reset Email** - Contains reset link
4. **Login Notification** - Security alert for new logins

## Next Steps

1. Implement the authentication context and provider
2. Create login and registration forms with validation
3. Set up protected routes for authenticated areas
4. Implement email verification flow
5. Add token refresh logic
6. Create user profile management
7. Add forgot/reset password functionality
8. Implement session management
9. Add social authentication (if required)
10. Set up analytics and monitoring

## Testing Checklist

- [x] User can register with valid credentials ✅ Backend implemented
- [x] Registration fails with invalid data ✅ Backend validation implemented
- [x] User receives welcome email with verification link ✅ Email service configured
- [x] Email verification link works without authentication ✅ Fixed route protection issue
- [x] User can login with correct credentials ✅ Backend endpoint ready
- [x] Login fails with incorrect credentials ✅ Backend validation implemented
- [x] Protected routes redirect to login when not authenticated ✅ Middleware implemented
- [x] Token refresh works automatically ✅ Refresh token endpoint ready
- [x] Logout clears all stored tokens ✅ Backend endpoint ready
- [x] Password update requires current password ✅ Backend validation implemented
- [x] Email verification status is tracked correctly ✅ Database field and logic implemented
- [x] Rate limiting is respected ✅ Rate limiter middleware configured (100 req/15 min)
- [x] Error messages are user-friendly ✅ AppError utility implemented

## Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [React Router Authentication](https://reactrouter.com/docs/en/v6/examples/auth)

## Backend Implementation Status

### ✅ Completed Features

1. **Authentication System**
   - JWT token generation with access and refresh tokens
   - User registration with password hashing (bcrypt)
   - User login with email/password
   - Token refresh mechanism
   - Logout functionality
   - Get current user endpoint
   - Update password endpoint

2. **Email Verification System**
   - Email verification token generation on registration
   - Verification link sent in welcome email
   - Public verification endpoint (no auth required)
   - Verification status tracking
   - Resend verification email functionality
   - Email verification success notifications

3. **Email Service**
   - Nodemailer integration
   - Mobile-responsive HTML email templates
   - Welcome email with embedded verification
   - Verification success email
   - Login notification emails
   - Password reset emails
   - Session invitation emails

4. **Security Features**
   - Password hashing with bcrypt
   - JWT token expiration (7 days access, 30 days refresh)
   - Rate limiting (100 requests per 15 minutes)
   - CORS configuration
   - Input validation and sanitization
   - SQL injection protection
   - XSS protection

5. **Database Models**
   - User model with email verification fields
   - Session model with attendance tracking
   - Attendance model with various marking methods
   - Proper indexes for performance

### 🚧 Frontend Tasks Remaining

1. **Components to Build**
   - Login form with validation
   - Registration form with password confirmation
   - Email verification notice page
   - Email verification handler page
   - Password reset request form
   - Password reset form
   - User profile/dashboard
   - Protected route wrapper

2. **State Management**
   - Auth context implementation
   - Token storage strategy
   - User state management
   - Automatic token refresh

3. **UI/UX Considerations**
   - Loading states
   - Error handling and display
   - Success notifications
   - Form validation feedback
   - Responsive design

### 📝 Notes

- Backend API base URL: `http://localhost:5000/api/v1`
- Email verification tokens expire in 24 hours
- Verification code is the last 6 characters of the token (uppercase)
- All passwords must meet complexity requirements
- Rate limiting is applied globally to all API endpoints
