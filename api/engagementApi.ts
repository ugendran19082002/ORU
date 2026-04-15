import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

export type BackendNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export type LoyaltyLedgerEntry = {
  id: number;
  type: 'earn' | 'redeem';
  points: number;
  created_at: string;
  description?: string;
};

export type LoyaltyBalance = {
  total_points: number;
  redeemable_points: number;
  tier?: string;
  referral_code?: string;
};

export const notificationApi = {
  async getNotifications(params?: { page?: number; limit?: number; unread_only?: boolean }): Promise<{ data: BackendNotification[]; unread_count: number }> {
    try {
      const response = await apiClient.get<ApiResponse<{ data: BackendNotification[]; unread_count: number }>>('/notifications', { params });
      if (response.data.status === 1) return response.data.data;
      return { data: [], unread_count: 0 };
    } catch (error) {
      log.error('[notificationApi] getNotifications failed:', error);
      throw ApiError.from(error, 'Failed to fetch notifications');
    }
  },

  async markRead(id: string): Promise<void> {
    try {
      await apiClient.post(`/notifications/${id}/read`);
    } catch (error) {
      log.error('[notificationApi] markRead failed:', error);
    }
  },

  async markAllRead(): Promise<void> {
    try {
      await apiClient.post('/notifications/read-all');
    } catch (error) {
      log.error('[notificationApi] markAllRead failed:', error);
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      if (response.data.status === 1) return response.data.data.count;
      return 0;
    } catch (error) {
      return 0;
    }
  },
};

export const loyaltyApi = {
  async getBalance(userId?: string): Promise<LoyaltyBalance> {
    try {
      const response = await apiClient.get<ApiResponse<LoyaltyBalance>>('/loyalty/balance');
      if (response.data.status === 1) return response.data.data;
      return { total_points: 0, redeemable_points: 0 };
    } catch (error) {
      log.error('[loyaltyApi] getBalance failed:', error);
      return { total_points: 0, redeemable_points: 0 };
    }
  },

  async getLedger(params?: { page?: number; limit?: number }): Promise<{ data: LoyaltyLedgerEntry[]; total_points: number }> {
    try {
      const response = await apiClient.get<ApiResponse<{ data: LoyaltyLedgerEntry[]; total_points: number }>>('/loyalty/ledger', { params });
      if (response.data.status === 1) return response.data.data;
      return { data: [], total_points: 0 };
    } catch (error) {
      log.error('[loyaltyApi] getLedger failed:', error);
      return { data: [], total_points: 0 };
    }
  },
};
