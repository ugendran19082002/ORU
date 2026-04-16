import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

export type CouponValidateResult = {
  code: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  /** Computed discount amount in rupees (already applied against order value) */
  discount_amount: number;
  message: string;
};

export const promotionApi = {
  async validateCoupon(
    code: string,
    orderValue: number,
  ): Promise<CouponValidateResult> {
    try {
      const response = await apiClient.post<ApiResponse<CouponValidateResult>>(
        '/promotion/coupons/validate',
        { code, cart_value: orderValue },
      );
      if (response.data.status === 1) return response.data.data;
      throw new ApiError(
        'INVALID_COUPON',
        400,
        response.data.message || 'Invalid coupon code',
      );
    } catch (error) {
      log.error('[promotionApi] validateCoupon failed:', error);
      throw ApiError.from(error, 'Coupon validation failed');
    }
  },

  /**
   * Fetch current user's referral code and stats.
   * GET /referrals/mine
   */
  async getMyReferrals(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/promotion/referrals/mine');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', 400, 'Failed to fetch referral data');
    } catch (error) {
      log.error('[promotionApi] getMyReferrals failed:', error);
      throw ApiError.from(error, 'Failed to fetch referral data');
    }
  },

  /**
   * Generate or fetch the user's personal referral code.
   * POST /referrals/generate
   */
  async generateReferralCode(): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<{ code: string }>>('/promotion/referrals/generate');
      if (response.data.status === 1) return response.data.data.code;
      throw new ApiError('GENERATE_FAILED', 400, 'Failed to generate code');
    } catch (error) {
      log.error('[promotionApi] generateReferralCode failed:', error);
      throw ApiError.from(error, 'Failed to generate code');
    }
  },

  /**
   * Apply a friend's referral code.
   * POST /referrals/apply
   */
  async applyReferralCode(code: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/promotion/referrals/apply', { code });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('APPLY_FAILED', 400, response.data.message || 'Invalid code');
    } catch (error) {
      log.error('[promotionApi] applyReferralCode failed:', error);
      throw ApiError.from(error, 'Failed to apply code');
    }
  },

  /**
   * Shop Owner: Fetch all coupons created by the shop.
   * GET /shop-owner/promotions
   */
  async getShopCoupons(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/shop-owner/promotions');
      if (response.data.status === 1) return response.data.data;
      return [];
    } catch (error) {
      log.error('[promotionApi] getShopCoupons failed:', error);
      throw ApiError.from(error, 'Failed to fetch coupons');
    }
  },

  /**
   * Shop Owner: Create a new promotional coupon.
   * POST /shop-owner/promotions
   */
  async createShopCoupon(payload: any): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/promotions', payload);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('CREATE_FAILED', 400, response.data.message || 'Failed to create coupon');
    } catch (error) {
      log.error('[promotionApi] createShopCoupon failed:', error);
      throw ApiError.from(error, 'Failed to create coupon');
    }
  },

  /**
   * Shop Owner: Delete a coupon.
   * DELETE /shop-owner/promotions/:id
   */
  async deleteShopCoupon(couponId: number): Promise<void> {
    try {
      await apiClient.delete(`/shop-owner/promotions/${couponId}`);
    } catch (error) {
      log.error('[promotionApi] deleteShopCoupon failed:', error);
      throw ApiError.from(error, 'Failed to delete coupon');
    }
  },

  /**
   * Shop Owner: Toggle coupon active/inactive status.
   * PATCH /shop-owner/promotions/:id/status
   */
  async toggleCouponStatus(couponId: number): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(`/shop-owner/promotions/${couponId}/status`);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', 400, response.data.message || 'Failed to update coupon');
    } catch (error) {
      log.error('[promotionApi] toggleCouponStatus failed:', error);
      throw ApiError.from(error, 'Failed to update coupon');
    }
  },
};
