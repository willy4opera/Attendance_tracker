import React, { useState } from 'react';
import { AiOutlineBell, AiOutlineSearch, AiOutlineMail } from 'react-icons/ai';
import theme from '../../config/theme';
import EmailVerificationModal from '../modals/EmailVerificationModal';

interface User {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified?: boolean;
  emailVerified?: boolean; // Keep for backward compatibility
}

interface HeaderProps {
  title: string;
  user: User | null;
}

export default function Header({ title, user }: HeaderProps) {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Check both possible field names for email verification status
  const isEmailVerified = user?.isEmailVerified ?? user?.emailVerified ?? false;

  return (
    <>
      <header 
        className="flex items-center justify-between px-4 lg:px-8 py-3"
      >
        {/* Page Title */}
        <div>
          <h1 className="text-xl lg:text-2xl font-bold" style={{ color: theme.colors.secondary }}>
            {title}
          </h1>
          <p className="text-xs lg:text-sm" style={{ color: theme.colors.text.secondary }}>
            Welcome back, {user?.firstName}!
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2">
            <AiOutlineSearch className="w-5 h-5 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none w-64"
              style={{ color: theme.colors.text.primary }}
            />
          </div>

          {/* Email Verification Warning */}
          {!isEmailVerified && (
            <button
              onClick={() => setShowVerificationModal(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm hover:opacity-80 transition-opacity cursor-pointer"
              style={{ 
                backgroundColor: theme.colors.warning + '20',
                color: theme.colors.warning 
              }}
            >
              <AiOutlineMail className="w-4 h-4" />
              <span className="hidden sm:inline">Verify Email</span>
            </button>
          )}

          {/* Notifications */}
          <button 
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: theme.colors.text.primary }}
          >
            <AiOutlineBell className="w-5 h-5 lg:w-6 lg:h-6" />
            <span 
              className="absolute top-0 right-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.colors.error }}
            />
          </button>

          {/* User Avatar */}
          <div 
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer text-sm lg:text-base"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.secondary }}
          >
            {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </>
  );
}
