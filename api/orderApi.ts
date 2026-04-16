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
      const response = await apiClient.get<ApiResponse<SlotsData>>('/orders/slots', {
        params: { shop_id: shopId, date },
      });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch slots');
    } catch (error) {
      log.error('[orderApi] getAvailableSlots failed:', error);
      throw ApiError.from(error, 'Failed to fetch available slots');
    }
  },

  /**
   * Update the status of an order.
   * PATCH /orders/:id/status
   */
  async updateStatus(id: string, status: string): Promise<void> {
    try {
      await apiClient.patch(`/orders/${id}/status`, { status });
    } catch (error) {
      log.error('[orderApi] updateStatus failed:', error);
      throw ApiError.from(error, 'Failed to update order status');
    }
  },

  /**
   * Assign a delivery person to an order.
   * POST /shop-owner/orders/:orderId/assign-delivery
   */
  async assignDelivery(orderId: string, agentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/shop-owner/orders/${orderId}/assign-delivery`, { 
        delivery_person_id: agentId 
      });
      return response.data;
    } catch (error) {
      log.error('[orderApi] assignDelivery failed:', error);
      throw ApiError.from(error, 'Failed to assign delivery person');
    }
  },

  /**
   * Reschedule an order to a new slot.
   * POST /shop-owner/orders/:orderId/reschedule
   */
  async rescheduleOrder(id: string, date: string, slotId: number): Promise<void> {
    try {
      await apiClient.post(`/shop-owner/orders/${id}/reschedule`, { 
        scheduled_date: date, 
        slot_id: slotId 
      });
    } catch (error) {
      log.error('[orderApi] rescheduleOrder failed:', error);
      throw ApiError.from(error, 'Failed to reschedule order');
    }
  },

  /**
   * Reorder a past order.
   * POST /orders/:orderId/reorder
   */
  async reorder(id: string, paymentMethod: string = 'cod'): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/orders/${id}/reorder`, {
        payment_method: paymentMethod
      });
      return response.data;
    } catch (error) {
      log.error('[orderApi] reorder failed:', error);
      throw ApiError.from(error, 'Failed to reorder');
    }
  },

  /**
   * Initiate a refund.
   * POST /refunds
   */
  async initiateRefund(orderId: string, amount: number, reason: string): Promise<void> {
    try {
      await apiClient.post('/refunds', { 
        order_id: parseInt(orderId), 
        amount, 
        reason 
      });
    } catch (error) {
      log.error('[orderApi] initiateRefund failed:', error);
      throw ApiError.from(error, 'Failed to initiate refund');
    }
  },
};
