import { apiClient } from './client';

export interface AdminShop {
  id: number;
  uuid: string;
  name: string;
  contact_number: string;
  shop_type: 'individual' | 'company';
  status: 'pending_review' | 'active' | 'rejected' | 'suspended';
  is_verified: boolean;
  admin_notes: string | null;
  created_at: string;
  owner?: {
    name: string;
    phone: string;
    email: string;
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
  }
};
