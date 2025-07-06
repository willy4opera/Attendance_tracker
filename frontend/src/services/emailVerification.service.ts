import api from './api';

interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

class EmailVerificationService {
  async verifyEmailWithOTP(code: string): Promise<VerifyEmailResponse> {
    try {
      // The backend expects the verification code/token in the URL
      const response = await api.post(`/email-verification/verify/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<ResendVerificationResponse> {
    try {
      const response = await api.post('/email-verification/resend', { email });
      return response.data;
    } catch (error) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  }

  async checkVerificationStatus(): Promise<{ isVerified: boolean }> {
    try {
      const response = await api.get('/email-verification/status');
      return response.data;
    } catch (error) {
      console.error('Error checking verification status:', error);
      throw error;
    }
  }
}

export const emailVerificationService = new EmailVerificationService();
export default emailVerificationService;
