import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { Shop } from '@/types/domain';
import type {
  ApiResponse,
  ShopProfileRaw,
  ShopSettings,
  ShopToggleResult,
  BusyModeResult,
  ShopOpenStatus,
  ShopUpdatePayload,
  ShopSettingsPayload,
} from '@/types/api';

/** Map raw backend shape → frontend Shop domain model */
function mapShop(s: ShopProfileRaw): Shop {
  return {
    id: String(s.id),
    name: s.name,
    area: s.city ?? 'Chennai',
    rating: parseFloat(String(s.avg_rating || 0)) || 0,
    distanceKm: parseFloat(String(s.distance_km || 0)) || 0,
    eta: '25-45 mins',
    phone: s.phone,
    isOpen: s.is_open ?? true,
    isBusy: (s as any).ShopSetting?.busy_mode ?? false,
    couponCount: parseInt(String((s as any).coupon_count || 0)) || 0,
    tags: s.shop_type ? [s.shop_type, 'Mineral Water'] : ['Mineral Water', 'Purified'],
    verified: s.status === 'active' || s.status === 'approved',
    pricePerCan: parseFloat(String(s.min_price || 0)) || 0,
    minOrderValue: parseFloat(String((s as any).min_order_value || 0)) || 0,
    lat: parseFloat(String(s.latitude || 0)) || 0,
    lng: parseFloat(String(s.longitude || 0)) || 0,
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
   */
  async getShops(params?: { lat?: number; lng?: number; query?: string }): Promise<Shop[]> {
    if (!params?.lat || !params?.lng) {
      if (__DEV__ && !params?.query) {
        log.warn('[shopApi] No coords provided — returning empty shops list');
        return [];
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
   * Get schedule-aware open status.
   * GET /shop-owner/shops/me/open-status
   */
  async getOpenStatus(): Promise<ShopOpenStatus> {
    try {
      const response = await apiClient.get<ApiResponse<ShopOpenStatus>>('/shop-owner/shops/me/open-status');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, 'Failed to fetch open status');
    } catch (error) {
      log.error('[shopApi] getOpenStatus failed:', error);
      throw ApiError.from(error, 'Failed to fetch open status');
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

  /**
   * Fetch 7-day business hours schedule.
   * GET /shop-owner/schedule
   */
  async getSchedule(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/shop-owner/schedule');
      return response.data.data || [];
    } catch (error) {
      log.error('[shopApi] getSchedule failed:', error);
      throw ApiError.from(error, 'Failed to fetch schedule');
    }
  },

  /**
   * Update 7-day business hours schedule.
   * PATCH /shop-owner/schedule
   */
  async updateSchedule(schedule: any[]): Promise<any[]> {
    try {
      const response = await apiClient.patch<ApiResponse<any[]>>('/shop-owner/schedule', { schedule });
      return response.data.data || [];
    } catch (error) {
      log.error('[shopApi] updateSchedule failed:', error);
      throw ApiError.from(error, 'Failed to update schedule');
    }
  },

  /**
   * Fetch all delivery slots.
   * GET /shop-owner/slots
   */
  async getSlots(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/shop-owner/slots');
      return response.data.data || [];
    } catch (error) {
      log.error('[shopApi] getSlots failed:', error);
      throw ApiError.from(error, 'Failed to fetch delivery slots');
    }
  },

  /**
   * Sync/Replace delivery slots.
   * PATCH /shop-owner/slots
   */
  async updateSlots(slots: any[]): Promise<any[]> {
    try {
      const response = await apiClient.patch<ApiResponse<any[]>>('/shop-owner/slots', { slots });
      return response.data.data || [];
    } catch (error) {
      log.error('[shopApi] updateSlots failed:', error);
      throw ApiError.from(error, 'Failed to sync delivery slots');
    }
  },

  /**
   * Fetch all holidays.
   * GET /shop-owner/holidays
   */
  async getHolidays(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/shop-owner/holidays');
      return response.data.data || [];
    } catch (error) {
      log.error('[shopApi] getHolidays failed:', error);
      throw ApiError.from(error, 'Failed to fetch holidays');
    }
  },

  /**
   * Add a new holiday.
   * POST /shop-owner/holidays
   */
  async addHoliday(data: { holiday_date: string; reason: string }): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/holidays', data);
      return response.data.data;
    } catch (error) {
      log.error('[shopApi] addHoliday failed:', error);
      throw ApiError.from(error, 'Failed to add holiday');
    }
  },

  /**
   * Delete a holiday.
   * DELETE /shop-owner/holidays/:id
   */
  async deleteHoliday(id: number | string): Promise<any> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/shop-owner/holidays/${id}`);
      return response.data.data;
    } catch (error) {
      log.error('[shopApi] deleteHoliday failed:', error);
      throw ApiError.from(error, 'Failed to delete holiday');
    }
  },
};
