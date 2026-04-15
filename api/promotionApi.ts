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
  /**
   * Validate a promo / coupon code against the current order subtotal.
   * POST /v1/promotions/validate
   */
  async validateCoupon(
    code: string,
    orderValue: number,
  ): Promise<CouponValidateResult> {
    try {
      const response = await apiClient.post<ApiResponse<CouponValidateResult>>(
        '/v1/promotions/validate',
        { code, order_value: orderValue },
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
};
