import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

export interface SubscriptionData {
  shop_id: number;
  subscription: any;
  status: string;
  features: {
    priorityListing: boolean;
    analyticsAccess: boolean;
    lowCommission: boolean;
    instantDelivery: boolean;
  };
}

export const subscriptionApi = {
  /**
   * Fetch current shop subscription info.
   * GET /shop-owner/subscription
   */
  async getSubscription(): Promise<SubscriptionData> {
    try {
      const response = await apiClient.get<ApiResponse<SubscriptionData>>('/shop-owner/subscription');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, 'Failed to fetch subscription');
    } catch (error) {
      log.error('[subscriptionApi] getSubscription failed:', error);
      throw ApiError.from(error, 'Failed to fetch subscription');
    }
  },

  /**
   * Activate a subscription plan.
   * POST /shop-owner/subscription/activate
   */
  async activateSubscription(planId?: number, autoRenew: boolean = true): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/subscription/activate', { 
        plan_id: planId,
        is_auto_renew: autoRenew,
      });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('ACTIVATE_FAILED', response.status ?? 400, response.data.message || 'Failed to activate plan');
    } catch (error) {
      log.error('[subscriptionApi] activateSubscription failed:', error);
      throw ApiError.from(error, 'Failed to activate plan');
    }
  },

  /**
   * Cancel active subscription.
   * POST /shop-owner/subscription/cancel
   */
  async cancelSubscription(reason?: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/subscription/cancel', { reason });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('CANCEL_FAILED', response.status ?? 400, response.data.message || 'Failed to cancel plan');
    } catch (error) {
      log.error('[subscriptionApi] cancelSubscription failed:', error);
      throw ApiError.from(error, 'Failed to cancel plan');
    }
  },
};
