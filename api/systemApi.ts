import { apiService, ApiResponse } from './apiService';

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  category: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
}

/**
 * System API Service
 * 
 * Handles global configuration, legal policies, and support links.
 */
export const systemApi = {
  /**
   * Get all public settings, optionally filtered by category
   */
  getSettings: (category?: string) => 
    apiService.get<SystemSetting[]>(`/system/settings${category ? `?category=${category}` : ''}`),

  /**
   * Get a specific setting by unique key
   */
  getSetting: (key: string) => 
    apiService.get<SystemSetting>(`/system/settings/${key}`),

  /**
   * Get shop categories and subcategories
   */
  getCategories: () => 
    apiService.get('/system/categories'),

  /**
   * Update a system setting by key (admin only)
   */
  updateSetting: (key: string, value: any) =>
    apiService.put(`/admin/system/settings/${key}`, { setting_value: value }),

  /**
   * Get haversine distance between two sets of coordinates via internal fast API
   */
  getDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => 
    apiService.get<{distance_km: number}>(`/system/distance?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`),
};
