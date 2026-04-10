import { apiClient } from './client';
import type { Order } from '@/types/domain';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const orderApi = {
  /**
   * Submit a new checkout order
   * Simulates POST /v1/orders
   */
  async submitOrder(payload: Partial<Order>): Promise<{ success: boolean; orderId: string }> {
    // const response = await apiClient.post('/orders', payload);
    // return response.data;
    
    await delay(1200); // Placing an order takes longer
    return {
      success: true,
      orderId: `TNG-${Math.floor(Math.random() * 100000)}`,
    };
  }
};
