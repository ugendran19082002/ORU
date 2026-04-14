import { apiClient } from './client';
import type { Order } from '@/types/domain';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const orderApi = {
  /**
   * Submit a new checkout order
   * POST /orders
   */
  async submitOrder(payload: any): Promise<any> {
    try {
      const response = await apiClient.post('/orders', payload);
      return response.data;
    } catch (error) {
      console.error("[orderApi] submitOrder failed:", error);
      throw error;
    }
  },

  /**
   * Fetch available slots for a shop and date
   * GET /slots
   */
  async getAvailableSlots(shopId: number, date: string): Promise<any> {
    try {
      const response = await apiClient.get('/slots', {
        params: { shop_id: shopId, date }
      });
      if (response.data.status === 1) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch slots');
    } catch (error) {
       console.error("[orderApi] getAvailableSlots failed:", error);
       throw error;
    }
  }
};
