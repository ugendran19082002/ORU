import { apiClient } from './client';
import { ApiError } from './apiError';
import { mockShops } from '@/utils/mockData';
import { log } from '@/utils/logger';
import type { Shop } from '@/types/domain';
import type {
  ApiResponse,
  ShopProfileRaw,
  ShopSettings,
  ShopToggleResult,
  BusyModeResult,
  ShopUpdatePayload,
  ShopSettingsPayload,
} from '@/types/api';

/** Map raw backend shape → frontend Shop domain model */
function mapShop(s: ShopProfileRaw): Shop {
  return {
    id: String(s.id),
    name: s.name,
    area: s.city ?? 'Chennai',
    rating: parseFloat(s.avg_rating) || 0,
    distanceKm: parseFloat(s.distance_km) || 0,
    eta: '25-45 mins',
    phone: s.phone,
    isOpen: s.is_open ?? true,
    tags: s.shop_type ? [s.shop_type, 'Mineral Water'] : ['Mineral Water', 'Purified'],
    verified: s.status === 'active' || s.status === 'approved',
    pricePerCan: parseFloat(s.min_price) || 0,
    lat: parseFloat(s.latitude),
    lng: parseFloat(s.longitude),
    accent: '#005d90',
    heroImage: 'water_can_1',
    // Map products if present (usually in getShopById)
    products: (s.Products || []).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      description: p.description || '20L Standard Can',
      price: parseFloat(p.price) || 30,
      image: p.image_url || 'water_can_1',
      unitLabel: p.unit_label || '20L Can',
      inStock: Boolean(p.is_available),
      stockCount: p.stock_qty || 100,
    })),
  };
}

export const shopApi = {
  /**
   * Fetch approved nearby shops based on coordinates.
   * Falls back to mock data in dev mode when coordinates are missing.
   */
  async getShops(params?: { lat?: number; lng?: number; query?: string }): Promise<Shop[]> {
    if (!params?.lat || !params?.lng) {
      if (__DEV__ && !params?.query) {
        log.warn('[shopApi] No coords provided — returning mock shops (dev only)');
        return mockShops;
      }
    }

    try {
      const response = await apiClient.get<ApiResponse<{ data: ShopProfileRaw[] }>>('/shops', { params });
      if (response.data.status === 1 && response.data.data?.data) {
        return response.data.data.data.map(mapShop);
      }
      return [];
    } catch (error) {
      log.error('[shopApi] getShops failed:', error);
      throw ApiError.from(error, 'Failed to fetch shops');
    }
  },

  /**
   * Fetch a single shop by ID.
   * GET /shops/:id
   */
  async getShopById(id: string): Promise<Shop | null> {
    try {
      const response = await apiClient.get<ApiResponse<ShopProfileRaw>>(`/shops/${id}`);
      if (response.data.status === 1 && response.data.data) {
        return mapShop(response.data.data);
      }
      return null;
    } catch (error) {
      log.error('[shopApi] getShopById failed:', error);
      throw ApiError.from(error, 'Shop not found');
    }
  },

  /**
   * Fetch the current shop owner's shop profile.
   * GET /shop-owner/shops/me
   */
  async getMyShop(): Promise<ShopProfileRaw> {
    try {
      const response = await apiClient.get<ApiResponse<ShopProfileRaw>>('/shop-owner/shops/me');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch shop profile');
    } catch (error) {
      log.error('[shopApi] getMyShop failed:', error);
      throw ApiError.from(error, 'Failed to fetch shop profile');
    }
  },

  /**
   * Update the current shop owner's shop profile.
   * PATCH /shop-owner/shops/me
   */
  async updateMyShop(data: ShopUpdatePayload): Promise<ShopProfileRaw> {
    try {
      const response = await apiClient.patch<ApiResponse<ShopProfileRaw>>('/shop-owner/shops/me', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', response.status ?? 400, response.data.message || 'Failed to update shop profile');
    } catch (error) {
      log.error('[shopApi] updateMyShop failed:', error);
      throw ApiError.from(error, 'Failed to update shop profile');
    }
  },

  /**
   * Get shop operational settings.
   * GET /shop-owner/shops/me/settings
   */
  async getShopSettings(): Promise<ShopSettings> {
    try {
      const response = await apiClient.get<ApiResponse<ShopSettings>>('/shop-owner/shops/me/settings');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch shop settings');
    } catch (error) {
      log.error('[shopApi] getShopSettings failed:', error);
      throw ApiError.from(error, 'Failed to fetch shop settings');
    }
  },

  /**
   * Update shop operational settings.
   * PATCH /shop-owner/shops/me/settings
   */
  async updateShopSettings(data: ShopSettingsPayload): Promise<ShopSettings> {
    try {
      const response = await apiClient.patch<ApiResponse<ShopSettings>>('/shop-owner/shops/me/settings', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', response.status ?? 400, response.data.message || 'Failed to update shop settings');
    } catch (error) {
      log.error('[shopApi] updateShopSettings failed:', error);
      throw ApiError.from(error, 'Failed to update shop settings');
    }
  },

  /**
   * Toggle shop open/closed status.
   * POST /shop-owner/shops/me/toggle-open
   */
  async toggleShopOpen(isOpen: boolean): Promise<ShopToggleResult> {
    try {
      const response = await apiClient.post<ApiResponse<ShopToggleResult>>(
        '/shop-owner/shops/me/toggle-open',
        { is_open: isOpen },
      );
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('TOGGLE_FAILED', response.status ?? 400, response.data.message || 'Failed to toggle shop status');
    } catch (error) {
      log.error('[shopApi] toggleShopOpen failed:', error);
      throw ApiError.from(error, 'Failed to toggle shop status');
    }
  },

  /**
   * Toggle busy mode (auto-reject new orders).
   * POST /shop-owner/shops/me/toggle-busy
   */
  async toggleBusyMode(busyMode: boolean): Promise<BusyModeResult> {
    try {
      const response = await apiClient.post<ApiResponse<BusyModeResult>>(
        '/shop-owner/shops/me/toggle-busy',
        { busy_mode: busyMode },
      );
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('TOGGLE_FAILED', response.status ?? 400, response.data.message || 'Failed to toggle busy mode');
    } catch (error) {
      log.error('[shopApi] toggleBusyMode failed:', error);
      throw ApiError.from(error, 'Failed to toggle busy mode');
    }
  },

  /**
   * Fetch personalized shop recommendations based on order history.
   * GET /shops/personalized
   */
  async getPersonalizedShops(params?: { lat?: number; lng?: number; limit?: number }): Promise<Shop[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ data: ShopProfileRaw[] }>>('/shops/personalized', { params });
      if (response.data.status === 1 && response.data.data?.data) {
        return response.data.data.data.map(mapShop);
      }
      return [];
    } catch (error: any) {
      if (error?.response?.status === 404) {
        log.warn('[shopApi] Personalized shops endpoint not found (Backend incomplete) — falling back to empty list');
        return [];
      }
      log.error('[shopApi] getPersonalizedShops failed:', error);
      return [];
    }
  },

  /**
   * Global search for shops by name or category.
   * GET /shops/search
   */
  async searchShops(params: { q: string; lat?: number; lng?: number; limit?: number }): Promise<Shop[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ data: ShopProfileRaw[] }>>('/shops', { params: { ...params, query: params.q } });
      if (response.data.status === 1 && response.data.data?.data) {
        return response.data.data.data.map(mapShop);
      }
      return [];
    } catch (error: any) {
      log.error('[shopApi] searchShops failed:', error);
      return [];
    }
  },
};
