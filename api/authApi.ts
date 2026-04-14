import { apiClient } from './client';
import type { AppRole } from '@/types/session';

export interface SendOtpResponse {
  status: number;
  message: string;
  data: {
    expires_in: number;
  };
}

export interface VerifyOtpResponse {
  status: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    is_new_user: boolean;
    next_step: {
      step_key: string;
      screen_route: string;
      title: string;
    } | null;
    user: {
      id: number;
      uuid: string;
      phone: string;
      name: string;
      email: string | null;
      role: AppRole;
      status: string;
      loyalty_points: number;
      referral_code: string | null;
      preferred_language: string;
      biometric_enabled: boolean;
      onboarding_completed: boolean;
      created_at: string;
    };
  };
}

export const authApi = {
  /**
   * Send OTP to a phone number
   */
  sendOtp: async (phone: string, device_id: string = "1"): Promise<SendOtpResponse> => {
    const response = await apiClient.post<SendOtpResponse>('/auth/send-otp', {
      phone,
      device_id
    });
    return response.data;
  },

  /**
   * Verify OTP and get tokens
   */
  verifyOtp: async (phone: string, otp: string, device_id: string = "1"): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', {
      phone,
      otp,
      device_id
    });
    return response.data;
  },

  /**
   * Get current user profile (using current token)
   */
  getMe: async (): Promise<{ status: number; data: any }> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Reset user role and erase all data
   */
  resetRole: async (): Promise<{ status: number; message: string; data: any }> => {
    const response = await apiClient.post<{ status: number; message: string; data: any }>('/auth/reset-role');
    return response.data;
  },
};
