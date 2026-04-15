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

  async getMyOrders(params?: { status?: string; page?: number; limit?: number }): Promise<{ data: any[]; pagination: any }> {
    try {
      const response = await apiClient.get<ApiResponse<{ data: any[]; pagination: any }>>('/orders', { params });
      if (response.data.status === 1) return response.data.data;
      return { data: [], pagination: {} };
    } catch (error) {
      log.error('[orderApi] getMyOrders failed:', error);
      throw ApiError.from(error, 'Failed to fetch orders');
    }
  },

  async getOrderById(id: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/orders/${id}`);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('NOT_FOUND', 404, 'Order not found');
    } catch (error) {
      log.error('[orderApi] getOrderById failed:', error);
      throw ApiError.from(error, 'Failed to fetch order');
    }
  },

  async cancelOrder(id: string, reason?: string): Promise<void> {
    try {
      await apiClient.post(`/orders/${id}/cancel`, { reason });
    } catch (error) {
      log.error('[orderApi] cancelOrder failed:', error);
      throw ApiError.from(error, 'Failed to cancel order');
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
