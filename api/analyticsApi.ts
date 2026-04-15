import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShopAnalytics = {
  period: string;
  orders: {
    total: number;
    delivered: number;
    cancelled: number;
    avg_order_value: number;
  };
  revenue: {
    gross: number;
    net: number;
    commission: number;
  };
  daily_revenue: Array<{ date: string; revenue: number; orders: number }>;
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_qty: number;
    revenue: number;
  }>;
  delivery: {
    avg_delivery_time_mins: number;
    on_time_rate: number;
  };
  rating: {
    avg: number;
    count: number;
  };
  peak_hours: Array<{ hour: number; orders: number }>;
};

export type AdminDashboard = {
  period: string;
  orders: {
    total: number;
    delivered: number;
    cancelled: number;
    total_revenue: number;
  };
  users: {
    total: number;
    new_this_period: number;
  };
  shops: {
    total: number;
    active: number;
    pending: number;
  };
  top_shops: Array<{
    shop_id: number;
    shop_name: string;
    total_orders: number;
    revenue: number;
  }>;
  complaints: {
    total: number;
    open: number;
    sos: number;
  };
  refunds: {
    total: number;
    total_amount: number;
  };
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const analyticsApi = {
  /**
   * Fetch analytics summary for the current shop owner.
   * GET /shop-owner/analytics
   */
  async getShopAnalytics(params?: { period?: string }): Promise<ShopAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<ShopAnalytics>>('/shop-owner/analytics', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch shop analytics');
    } catch (error) {
      log.error('[analyticsApi] getShopAnalytics failed:', error);
      throw ApiError.from(error, 'Failed to fetch shop analytics');
    }
  },

  /**
   * Fetch earnings breakdown for the current shop owner.
   * GET /shop-owner/earnings
   */
  async getShopEarnings(params?: {
    period?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<ShopAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<ShopAnalytics>>('/shop-owner/earnings', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch shop earnings');
    } catch (error) {
      log.error('[analyticsApi] getShopEarnings failed:', error);
      throw ApiError.from(error, 'Failed to fetch shop earnings');
    }
  },

  /**
   * [Admin] Fetch the platform-wide admin dashboard stats.
   * GET /admin/analytics/dashboard
   */
  async getAdminDashboard(params?: { period?: string }): Promise<AdminDashboard> {
    try {
      const response = await apiClient.get<ApiResponse<AdminDashboard>>('/admin/analytics/dashboard', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch admin dashboard');
    } catch (error) {
      log.error('[analyticsApi] getAdminDashboard failed:', error);
      throw ApiError.from(error, 'Failed to fetch admin dashboard');
    }
  },
};
