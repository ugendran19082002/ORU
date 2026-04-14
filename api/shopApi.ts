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
  },

  /**
   * Fetch the current user's shop profile
   * GET /shop-owner/shops/me
   */
  async getMyShop(): Promise<any> {
    try {
      const response = await apiClient.get('/shop-owner/shops/me');
      if (response.data.status === 1) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch shop profile');
    } catch (error) {
      console.error("[shopApi] getMyShop failed:", error);
      throw error;
    }
  },

  /**
   * Update the current user's shop profile
   * PATCH /shop-owner/shops/me
   */
  async updateMyShop(data: any): Promise<any> {
    try {
      const response = await apiClient.patch('/shop-owner/shops/me', data);
      if (response.data.status === 1) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update shop profile');
    } catch (error) {
      console.error("[shopApi] updateMyShop failed:", error);
      throw error;
    }
  },

  /**
   * Get shop operational settings
   * GET /shop-owner/shops/me/settings
   */
  async getShopSettings(): Promise<any> {
    try {
      const response = await apiClient.get('/shop-owner/shops/me/settings');
      if (response.data.status === 1) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch shop settings');
    } catch (error) {
      console.error("[shopApi] getShopSettings failed:", error);
      throw error;
    }
  },

  /**
   * Update shop operational settings
   * PATCH /shop-owner/shops/me/settings
   */
  async updateShopSettings(data: any): Promise<any> {
    try {
      const response = await apiClient.patch('/shop-owner/shops/me/settings', data);
      if (response.data.status === 1) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update shop settings');
    } catch (error) {
      console.error("[shopApi] updateShopSettings failed:", error);
      throw error;
    }
  },

  /**
   * Toggle shop open/closed status
   * POST /shop-owner/shops/me/toggle-open
   */
  async toggleShopOpen(isOpen: boolean): Promise<any> {
    try {
      const response = await apiClient.post('/shop-owner/shops/me/toggle-open', { is_open: isOpen });
      if (response.data.status === 1) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to toggle shop status');
    } catch (error) {
      console.error("[shopApi] toggleShopOpen failed:", error);
      throw error;
    }
  },

  /**
   * Toggle busy mode (auto-reject new orders)
   * POST /shop-owner/shops/me/toggle-busy
   */
  async toggleBusyMode(busyMode: boolean): Promise<any> {
    try {
      const response = await apiClient.post('/shop-owner/shops/me/toggle-busy', { busy_mode: busyMode });
      if (response.data.status === 1) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to toggle busy mode');
    } catch (error) {
      console.error("[shopApi] toggleBusyMode failed:", error);
      throw error;
    }
  }
};
