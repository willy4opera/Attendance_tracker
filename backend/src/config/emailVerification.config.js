// Configuration for email verification requirements
module.exports = {
  // Routes that require email verification
  requireVerificationFor: {
    sessions: {
      create: true,      // Creating sessions requires verified email
      update: true,      // Updating sessions requires verified email
      delete: true,      // Deleting sessions requires verified email
      invite: true       // Sending invites requires verified email
    },
    attendance: {
      mark: false,       // Users can mark attendance without verification
      history: true,     // Viewing history requires verification
      export: true       // Exporting data requires verification
    },
    users: {
      updateProfile: true,    // Updating profile requires verification
      changePassword: false,  // Can change password without verification
      deleteAccount: true     // Deleting account requires verification
    }
  },
  
  // Grace period after registration (in days)
  gracePeriodDays: 7,
  
  // Send reminder emails
  reminderSchedule: [1, 3, 7], // Send reminders after 1, 3, and 7 days
  
  // Verification token expiry (in hours)
  tokenExpiryHours: 24,
  
  // Rate limiting for resend requests
  resendRateLimit: {
    windowMinutes: 5,
    maxRequests: 3
  }
};
