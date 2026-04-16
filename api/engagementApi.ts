import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

export type SosPayload = {
  latitude?: number;
  longitude?: number;
  note?: string;
};

export const engagementApi = {
  /**
   * Trigger an SOS alert on the backend.
   * POST /sos
   */
  async triggerSos(payload: SosPayload): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/sos', payload);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('SOS_FAILED', 400, 'Failed to trigger emergency alert');
    } catch (error) {
      log.error('[engagementApi] triggerSos failed:', error);
      throw ApiError.from(error, 'SOS trigger failed');
    }
  },

  /**
   * File a formal complaint for an order.
   * POST /complaints
   */
  async fileComplaint(data: any): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/complaints', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('COMPLAINT_FAILED', 400, 'Failed to file complaint');
    } catch (error) {
      log.error('[engagementApi] fileComplaint failed:', error);
      throw ApiError.from(error, 'Failed to file complaint');
    }
  },
};

export const notificationApi = {
  async getNotifications(params?: any): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/notifications', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', 400, 'Failed to fetch notifications');
    } catch (error) {
      log.error('[notificationApi] getNotifications failed:', error);
      throw ApiError.from(error, 'Failed to fetch notifications');
    }
  },

  async markRead(id: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/notifications/${id}/read`);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', 400, 'Failed to mark read');
    } catch (error) {
      log.error('[notificationApi] markRead failed:', error);
      throw ApiError.from(error, 'Failed to mark notifications read');
    }
  },
};

export const loyaltyApi = {
  async getLedger(params?: any): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/promotion/loyalty/ledger', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', 400, 'Failed to fetch loyalty data');
    } catch (error) {
      log.error('[loyaltyApi] getLedger failed:', error);
      throw ApiError.from(error, 'Failed to fetch loyalty data');
    }
  },
};
