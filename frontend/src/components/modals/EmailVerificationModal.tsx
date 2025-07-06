import React, { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { emailVerificationService } from '../../services/emailVerification.service';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../contexts/useAuth';
import { AxiosError } from 'axios';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ isOpen, onClose }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { refreshUser, user } = useAuth();

  // Debug: Log user object to see its structure
  useEffect(() => {
    if (user) {
      console.log('User object:', user);
    }
  }, [user]);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      showToast.error('Please enter a valid 6-character verification code');
      return;
    }

    try {
      setLoading(true);
      const response = await emailVerificationService.verifyEmailWithOTP(otp.toUpperCase());
      showToast.success(response.message || 'Email verified successfully!');
      await refreshUser(); // Refresh user data to update emailVerified status
      setOtp(''); // Clear the OTP
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Failed to verify email';
      showToast.error(errorMessage);
      
      // If the error is about invalid token, suggest resending
      if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired')) {
        showToast.info('Try resending the verification email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // Check for email in different possible locations
    const userEmail = user?.email || (user as any)?.user?.email;
    
    if (!userEmail) {
      console.error('User object structure:', user);
      showToast.error('Unable to find user email. Please refresh the page and try again.');
      return;
    }

    try {
      setResending(true);
      const response = await emailVerificationService.resendVerificationEmail(userEmail);
      showToast.success(response.message || 'Verification email sent successfully!');
      showToast.info('Check your email for the new verification code');
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Failed to resend verification email';
      showToast.error(errorMessage);
    } finally {
      setResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6) {
      handleVerify();
    }
  };

  if (!isOpen) return null;

  // Get user email from possible locations
  const displayEmail = user?.email || (user as any)?.user?.email || 'your email address';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div 
          className="fixed inset-0 bg-black opacity-30"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#fddc9a] bg-opacity-20 mb-4">
              <ShieldCheckIcon className="h-10 w-10 text-[#fddc9a]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-600">
              Enter the 6-character verification code sent to
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {displayEmail}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                  if (value.length <= 6) {
                    setOtp(value);
                  }
                }}
                onKeyPress={handleKeyPress}
                maxLength={6}
                placeholder="XXXXXX"
                className="w-full px-4 py-3 text-center text-lg font-semibold tracking-widest border border-gray-300 rounded-md focus:ring-2 focus:ring-[#fddc9a] focus:border-transparent"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                The code is the last 6 characters of your verification link
              </p>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || otp.length < 6}
              className="w-full py-3 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
            >
              {resending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <>
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Resend Verification Email
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Check your spam folder if you don't see the email in your inbox
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
