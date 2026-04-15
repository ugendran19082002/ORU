import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlatformPlan = {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  free_delivery_count: number;
  auto_discount_pct: number;
  monthly_coupon_count: number;
  monthly_coupon_value: number;
  loyalty_boost_pct: number;
  is_active: boolean;
  description: string | null;
};

export type PlatformSubscription = {
  id: number;
  plan_id: number;
  status: 'active' | 'expired' | 'cancelled' | 'paused' | 'grace_period';
  billing_cycle: 'monthly' | 'yearly';
  amount_paid: number;
  auto_renew: boolean;
  started_at: string;
  expires_at: string;
  next_billing_at: string | null;
  free_deliveries_used: number;
  coupons_issued_this_cycle: number;
  plan?: PlatformPlan;
};

export type CheckoutBenefits = {
  has_subscription: boolean;
  free_delivery: boolean;
  auto_discount_pct: number;
  loyalty_boost_pct: number;
};

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
};
