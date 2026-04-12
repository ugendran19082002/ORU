import { apiClient } from './client';
import type { AppUser } from '@/types/session';

export interface UserUpdateResponse {
  status: number;
  message: string;
  data: AppUser & {
    access_token?: string;
    refresh_token?: string;
    next_step?: any;
  };
}

export const userApi = {
  /**
   * Update the current user's profile (name, email, role, etc.)
   */
  updateProfile: async (data: Partial<AppUser>): Promise<UserUpdateResponse> => {
    const response = await apiClient.patch<UserUpdateResponse>('/users/me', data);
    return response.data;
  },
};
