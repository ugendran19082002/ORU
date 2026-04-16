import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse, PlatformPlan, PlatformSubscription, CheckoutBenefits } from '@/types/api';

export type { PlatformPlan, PlatformSubscription, CheckoutBenefits };

// ─── API ──────────────────────────────────────────────────────────────────────

export const platformSubscriptionApi = {
  /**
   * Fetch all available subscription plans.
   * GET /subscriptions/plans
   */
  async listPlans(): Promise<PlatformPlan[]> {
    try {
      const response = await apiClient.get<ApiResponse<PlatformPlan[]>>('/subscriptions/plans');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch plans');
    } catch (error) {
      log.error('[platformSubscriptionApi] listPlans failed:', error);
      throw ApiError.from(error, 'Failed to fetch plans');
    }
  },

  /**
   * Fetch the current user's active platform subscription.
   * GET /subscriptions/platform/mine
   */
  async getMySubscription(): Promise<PlatformSubscription> {
    try {
      const response = await apiClient.get<ApiResponse<PlatformSubscription>>('/subscriptions/platform/mine');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch subscription');
    } catch (error) {
      log.error('[platformSubscriptionApi] getMySubscription failed:', error);
      throw ApiError.from(error, 'Failed to fetch subscription');
    }
  },

  /**
   * Subscribe to a plan.
   * POST /subscriptions/platform/subscribe
   */
  async subscribe(data: {
    plan_id: number;
    billing_cycle?: PlatformSubscription['billing_cycle'];
    razorpay_payment_id?: string;
  }): Promise<PlatformSubscription> {
    try {
      const response = await apiClient.post<ApiResponse<PlatformSubscription>>('/subscriptions/platform/subscribe', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('SUBSCRIBE_FAILED', response.status ?? 400, response.data.message || 'Failed to subscribe');
    } catch (error) {
      log.error('[platformSubscriptionApi] subscribe failed:', error);
      throw ApiError.from(error, 'Failed to subscribe');
    }
  },

  /**
   * Cancel an existing subscription by ID.
   * POST /subscriptions/platform/:id/cancel
   */
  async cancelSubscription(id: number): Promise<PlatformSubscription> {
    try {
      const response = await apiClient.post<ApiResponse<PlatformSubscription>>(`/subscriptions/platform/${id}/cancel`);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('CANCEL_FAILED', response.status ?? 400, response.data.message || 'Failed to cancel subscription');
    } catch (error) {
      log.error('[platformSubscriptionApi] cancelSubscription failed:', error);
      throw ApiError.from(error, 'Failed to cancel subscription');
    }
  },

  /**
   * Fetch checkout-time benefit flags for the current user.
   * GET /subscriptions/platform/benefits
   */
  async getCheckoutBenefits(): Promise<CheckoutBenefits> {
    try {
      const response = await apiClient.get<ApiResponse<CheckoutBenefits>>('/subscriptions/platform/benefits');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch checkout benefits');
    } catch (error) {
      log.error('[platformSubscriptionApi] getCheckoutBenefits failed:', error);
      throw ApiError.from(error, 'Failed to fetch checkout benefits');
    }
  },

  /** POST /subscriptions/platform/initiate — create Razorpay sub + DB row */
  async initiateSubscription(data: { plan_id: number }): Promise<{ subscription_id: number; razorpay_subscription_id: string | null }> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/subscriptions/platform/initiate', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('INITIATE_FAILED', response.status ?? 400, response.data.message || 'Failed to initiate subscription');
    } catch (error) {
      log.error('[platformSubscriptionApi] initiateSubscription failed:', error);
      throw ApiError.from(error, 'Failed to initiate subscription');
    }
  },

  /** POST /subscriptions/platform/:id/pause */
  async pauseSubscription(id: number, data: { pause_start: string; pause_end: string; reason?: string }): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/subscriptions/platform/${id}/pause`, data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('PAUSE_FAILED', response.status ?? 400, response.data.message || 'Failed to pause subscription');
    } catch (error) {
      log.error('[platformSubscriptionApi] pauseSubscription failed:', error);
      throw ApiError.from(error, 'Failed to pause subscription');
    }
  },

  /** POST /subscriptions/platform/:id/resume */
  async resumeSubscription(id: number): Promise<PlatformSubscription> {
    try {
      const response = await apiClient.post<ApiResponse<PlatformSubscription>>(`/subscriptions/platform/${id}/resume`);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('RESUME_FAILED', response.status ?? 400, response.data.message || 'Failed to resume subscription');
    } catch (error) {
      log.error('[platformSubscriptionApi] resumeSubscription failed:', error);
      throw ApiError.from(error, 'Failed to resume subscription');
    }
  },

  /** POST /subscriptions/platform/:id/retry-payment */
  async retryPayment(id: number): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(`/subscriptions/platform/${id}/retry-payment`);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('RETRY_FAILED', response.status ?? 400, response.data.message || 'Failed to retry payment');
    } catch (error) {
      log.error('[platformSubscriptionApi] retryPayment failed:', error);
      throw ApiError.from(error, 'Failed to retry payment');
    }
  },
};
