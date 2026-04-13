import { apiClient } from './client';

export interface AdminShop {
  id: number;
  uuid: string;
  name: string;
  phone?: string;
  shop_type?: string;
  status: string;
  delivery_radius_km?: string;
  gstin?: string | null;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
  is_verified?: boolean;
  admin_notes?: string | null;
  created_at: string;
  owner?: {
    name: string;
    phone: string;
    email: string | null;
  };
}

export interface AdminApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export const adminApi = {
  /**
   * List all shops with optional status filtering
   */
  listShops: async (status?: string): Promise<AdminApiResponse<AdminShop[]>> => {
    const response = await apiClient.get<AdminApiResponse<AdminShop[]>>('/admin/shops', {
      params: { status }
    });
    return response.data;
  },

  /**
   * Approve a shop application globally
   */
  approveShop: async (shopId: number): Promise<AdminApiResponse<any>> => {
    const response = await apiClient.post<AdminApiResponse<any>>(`/admin/shops/${shopId}/approve`);
    return response.data;
  },

  /**
   * Reject a shop application with notes
   */
  rejectShop: async (shopId: number, notes: string): Promise<AdminApiResponse<any>> => {
    const response = await apiClient.post<AdminApiResponse<any>>(`/admin/shops/${shopId}/reject`, {
      notes
    });
    return response.data;
  },

  /**
   * Get specific shop profile (Admin Detail View)
   */
  getShopDetail: async (shopId: number): Promise<AdminApiResponse<AdminShop>> => {
    const response = await apiClient.get<AdminApiResponse<AdminShop>>(`/admin/shops/${shopId}`);
    return response.data;
  },

  /**
   * Get specific shop onboarding progress (to view document URLs)
   */
  getShopOnboardingProgress: async (shopId: number): Promise<AdminApiResponse<any>> => {
    // Re-using the onboarding steps API which includes titles and document_urls
    const response = await apiClient.get<AdminApiResponse<any>>(`/onboarding/shop/steps`, {
      params: { shopId }
    });
    return response.data;
  },

  /**
   * Review (Approve/Reject) a specific onboarding step
   */
  reviewShopOnboardingStep: async (data: { 
    shopId: number; 
    stepId: number; 
    status: 'approved' | 'rejected'; 
    notes?: string 
  }): Promise<AdminApiResponse<any>> => {
    const response = await apiClient.post<AdminApiResponse<any>>('/admin/shops/onboarding/review', data);
    return response.data;
  }
};
