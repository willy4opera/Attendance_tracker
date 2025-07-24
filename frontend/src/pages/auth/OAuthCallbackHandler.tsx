import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import authService from '../../services/auth.service';
import theme from '../../config/theme';

// Global flag to prevent duplicate processing
let isProcessingGlobally = false;

// This component handles OAuth callbacks
export default function OAuthCallbackHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing authentication...');
  const processingRef = useRef(false);
  
  useEffect(() => {
    console.log('[OAuthCallback] Component mounted');
    console.log('[OAuthCallback] Is popup?', !!(window.opener && !window.opener.closed));
    console.log('[OAuthCallback] Is authenticated?', isAuthenticated);
    
    const handleOAuthCallback = async () => {
      // Prevent duplicate processing
      if (isProcessingGlobally || processingRef.current) {
        console.log('[OAuthCallback] Already processing, skipping...');
        return;
      }
      
      processingRef.current = true;
      isProcessingGlobally = true;
      
      // Extract parameters from URL
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      console.log('[OAuthCallback] URL params:', { 
        code: code?.substring(0, 20) + '...', 
        error, 
        state 
      });

      // Check if we're in a popup
      const isPopup = window.opener && !window.opener.closed;
      
      // Handle error from OAuth provider
      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        
        if (isPopup) {
          // Notify parent window of error
          console.log('[OAuthCallback] Sending error to parent window');
          try {
            window.opener.postMessage({
              type: 'oauth-error',
              error: error
            }, window.location.origin);
          } catch (e) {
            console.error('[OAuthCallback] Failed to send error message:', e);
          }
          
          // Close popup after delay
          setTimeout(() => window.close(), 2000);
        } else {
          // Not in popup, redirect to login
          setTimeout(() => navigate('/login'), 2000);
        }
        return;
      }

      // Check if we have a code
      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        
        if (isPopup) {
          try {
            window.opener.postMessage({
              type: 'oauth-error',
              error: 'No authorization code received'
            }, window.location.origin);
          } catch (e) {
            console.error('[OAuthCallback] Failed to send message:', e);
          }
          setTimeout(() => window.close(), 2000);
        } else {
          setTimeout(() => navigate('/login'), 2000);
        }
        return;
      }

      // Try to detect the provider
      let provider = urlParams.get('provider') || 'google'; // Default to google
      
      if (state) {
        try {
          const stateData = JSON.parse(atob(state));
          provider = stateData.provider || provider;
        } catch (e) {
          console.error('[OAuthCallback] Failed to parse state:', e);
        }
      }

      console.log(`[OAuthCallback] Processing ${provider} OAuth callback...`);

      try {
        // Authenticate and get tokens - disable any notifications in the API call
        console.log('[OAuthCallback] Calling authenticateOAuth...');
        const response = await authService.authenticateOAuth(provider, { code });
        
        if (response && response.token) {
          console.log('[OAuthCallback] Authentication successful, token received');
          setStatus('success');
          setMessage('Authentication successful!');
          
          // Refresh user data in auth context without notifications
          console.log('[OAuthCallback] Refreshing user data...');
          await refreshUser();
          
          // Small delay to ensure auth state is updated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (isPopup) {
            // We're in a popup, notify the parent window
            console.log('[OAuthCallback] Notifying parent window of success');
            try {
              window.opener.postMessage({
                type: 'oauth-complete',
                provider: provider,
                success: true
              }, window.location.origin);
              
              console.log('[OAuthCallback] Success message sent to parent');
            } catch (e) {
              console.error('[OAuthCallback] Failed to send success message:', e);
            }
            
            // Close the popup
            setTimeout(() => {
              console.log('[OAuthCallback] Closing popup window');
              window.close();
            }, 1000);
          } else {
            // Not in popup, navigate directly to dashboard
            console.log('[OAuthCallback] Not in popup, navigating to dashboard');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
          }
        } else {
          throw new Error('No token received from authentication');
        }
      } catch (err: any) {
        console.error('[OAuthCallback] Authentication failed:', err);
        setStatus('error');
        
        let errorMessage = 'Authentication failed';
        if (err.response?.data?.error === 'duplicate_code') {
          errorMessage = 'This authorization code has already been used. Please try signing in again.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setMessage(errorMessage);
        
        if (isPopup) {
          // Notify parent of error
          try {
            window.opener.postMessage({
              type: 'oauth-error',
              error: errorMessage,
              provider: provider
            }, window.location.origin);
          } catch (e) {
            console.error('[OAuthCallback] Failed to send error message:', e);
          }
          
          setTimeout(() => {
            window.close();
          }, 3000);
        } else {
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } finally {
        // Reset global flag after a delay
        setTimeout(() => {
          isProcessingGlobally = false;
        }, 5000);
      }
    };

    // Only process if we have OAuth parameters
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('code') || urlParams.has('error')) {
      handleOAuthCallback();
    } else {
      console.log('[OAuthCallback] No OAuth parameters found');
      // No OAuth params, redirect based on auth status
      if (isAuthenticated) {
        window.location.href = '/dashboard';
      } else {
        navigate('/login');
      }
    }
  }, [location, navigate, refreshUser, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="text-center p-8">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto" style={{ borderColor: theme.colors.primary }}></div>
            <p className="mt-4 text-lg" style={{ color: theme.colors.secondary }}>
              {message}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please wait, do not close this window...
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-lg" style={{ color: theme.colors.secondary }}>
              {message}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {window.opener ? 'Closing window...' : 'Redirecting to dashboard...'}
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <p className="text-lg text-red-500">
              {message}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This window will close automatically...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
