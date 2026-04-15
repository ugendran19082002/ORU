import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse, OrderPayload, OrderSubmitResult, SlotsData } from '@/types/api';
// AvailableSlot is used as the inner element type via SlotsData — keep import for callers
export type { AvailableSlot } from '@/types/api';

export const orderApi = {
  /**
   * Submit a new checkout order.
   * POST /orders
   */
  async submitOrder(payload: OrderPayload): Promise<ApiResponse<OrderSubmitResult>> {
    try {
      const response = await apiClient.post<ApiResponse<OrderSubmitResult>>('/orders', payload);
      return response.data;
    } catch (error) {
      log.error('[orderApi] submitOrder failed:', error);
      throw ApiError.from(error, 'Failed to place order');
    }
  },

  /**
   * Fetch available delivery slots for a shop and date.
   * GET /slots — returns { slots: [], status: '' } as the data payload.
   */
  async getAvailableSlots(shopId: number, date: string): Promise<SlotsData> {
    try {
      const response = await apiClient.get<ApiResponse<SlotsData>>('/slots', {
        params: { shop_id: shopId, date },
      });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch slots');
    } catch (error) {
      log.error('[orderApi] getAvailableSlots failed:', error);
      throw ApiError.from(error, 'Failed to fetch available slots');
    }
  },
};
