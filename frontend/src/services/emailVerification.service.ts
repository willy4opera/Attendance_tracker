import api from './api';

interface VerifyEmailResponse {
  success?: boolean;
  status?: string;
  message: string;
}

interface ResendVerificationResponse {
  success?: boolean;
  status?: string;
  message: string;
}

interface VerificationStatusResponse {
  isVerified: boolean;
  isEmailVerified?: boolean;
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

  async checkVerificationStatus(): Promise<VerificationStatusResponse> {
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
