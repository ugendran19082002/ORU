import { apiClient } from './client';
import { mockShops } from '@/utils/mockData';
import type { Shop } from '@/types/domain';

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const shopApi = {
  /**
   * Fetch approved nearby shops based on coordinates
   */
  async getShops(params?: { lat: number; lng: number }): Promise<Shop[]> {
    if (!params?.lat || !params?.lng) {
      // Fallback for screens that don't pass coords yet (returns empty or mock if needed)
      return mockShops;
    }

    try {
      const response = await apiClient.get('/shops', { params });
      if (response.data.status === 1 && response.data.data.data) {
        return response.data.data.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          area: s.city || 'Chennai',
          rating: parseFloat(s.avg_rating) || 4.5,
          distanceKm: parseFloat(s.distance_km) || 0,
          eta: '25-45 mins',
          phone: s.phone || '',
          isOpen: s.is_open ?? true,
          tags: ['Mineral Water', 'Purified'],
          verified: s.status === 'active',
          pricePerCan: parseFloat(s.min_price) || 45,
          lat: parseFloat(s.latitude),
          lng: parseFloat(s.longitude),
          accent: '#005d90',
          heroImage: 'water_can_1',
          products: []
        }));
      }
      return [];
    } catch (error) {
      console.error("[shopApi] getShops failed:", error);
      throw error;
    }
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
