import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  stock_qty: number;
  low_stock_limit?: number;
  is_available?: boolean;
  image_url?: string;
  unit_label?: string;
}

export const inventoryApi = {
  /**
   * Fetch shop owner's products.
   * GET /shop-owner/products
   */
  async getMyProducts(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/shop-owner/products');
      if (response.data.status === 1) return response.data.data;
      return [];
    } catch (error) {
      log.error('[inventoryApi] getMyProducts failed:', error);
      throw ApiError.from(error, 'Failed to fetch products');
    }
  },

  /**
   * Create a new product.
   * POST /shop-owner/products
   */
  async createProduct(data: ProductPayload): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/products', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('CREATE_FAILED', response.status ?? 400, response.data.message || 'Failed to create product');
    } catch (error) {
      log.error('[inventoryApi] createProduct failed:', error);
      throw ApiError.from(error, 'Failed to create product');
    }
  },

  /**
   * Update an existing product.
   * PATCH /shop-owner/products/:id
   */
  async updateProduct(id: string, data: Partial<ProductPayload>): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(`/shop-owner/products/${id}`, data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', response.status ?? 400, response.data.message || 'Failed to update product');
    } catch (error) {
      log.error('[inventoryApi] updateProduct failed:', error);
      throw ApiError.from(error, 'Failed to update product');
    }
  },

  /**
   * Delete (deactivate) a product.
   * DELETE /shop-owner/products/:id
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      await apiClient.delete(`/shop-owner/products/${id}`);
    } catch (error) {
      log.error('[inventoryApi] deleteProduct failed:', error);
      throw ApiError.from(error, 'Failed to delete product');
    }
  },
  /**
   * Fetch detailed can inventory (Full, Empty, Damaged).
   * GET /shop-owner/inventory
   */
  async getInventory(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/shop-owner/inventory');
      if (response.data.status === 1) return response.data.data;
      return [];
    } catch (error) {
      log.error('[inventoryApi] getInventory failed:', error);
      throw ApiError.from(error, 'Failed to fetch inventory');
    }
  },

  /**
   * Update detailed inventory counts.
   * PATCH /shop-owner/inventory
   */
  async updateInventorySummary(payload: {
    product_id: number;
    change_type: string;
    full_cans_change?: number;
    empty_cans_change?: number;
    damaged_cans_change?: number;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>('/shop-owner/inventory', payload);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', response.status ?? 400, response.data.message || 'Failed to update inventory');
    } catch (error) {
      log.error('[inventoryApi] updateInventorySummary failed:', error);
      throw ApiError.from(error, 'Failed to update inventory');
    }
  },
};
