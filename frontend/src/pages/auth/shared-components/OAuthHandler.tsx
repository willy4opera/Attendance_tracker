import React from 'react'
import { useLocation } from 'react-router-dom'
import OAuthCallbackHandler from '../OAuthCallbackHandler'

// This component checks if the current route is an OAuth callback
export default function OAuthHandler({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  
  // Check if this is an OAuth callback
  const urlParams = new URLSearchParams(location.search)
  const hasOAuthCode = urlParams.has('code')
  const hasOAuthError = urlParams.has('error')
  
  // If this is an OAuth callback in a popup window, render the callback handler
  if ((hasOAuthCode || hasOAuthError) && window.opener && !window.opener.closed) {
    return <OAuthCallbackHandler />
  }
  
  // Otherwise render the children (login or register form)
  return <>{children}</>
}
