import { apiClient } from './client';
import { mockShops } from '@/utils/mockData';
import type { Shop } from '@/types/domain';

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const shopApi = {
  /**
   * Fetch all shops
   * Simulates GET /v1/shops
   */
  async getShops(): Promise<Shop[]> {
    // Wait for the backend endpoints to be ready:
    // const response = await apiClient.get('/shops');
    // return response.data;
    
    await delay(800); // simulate latency
    return mockShops;
  },

  /**
   * Fetch a single shop by its ID
   * Simulates GET /v1/shops/:id
   */
  async getShopById(id: string): Promise<Shop | null> {
    await delay(500);
    const shop = mockShops.find(s => s.id === id);
    if (!shop) throw new Error('Shop not found');
    return shop;
  }
};
