import { apiClient } from './client';
import { ApiError } from './apiError';
import type {
  ApiResponse,
  AdminShop,
  ShopApprovalResult,
  OnboardingStepReviewResult,
  OnboardingStep,
  GrowthSettings,
  GrowthSettingsPayload,
  LoyaltyLevel,
  LoyaltyLevelPayload,
  PlatformCoupon,
  CreateCouponPayload,
} from '@/types/api';

// Re-export so existing imports of AdminShop from adminApi still work
export type { AdminShop };

export const adminApi = {
  /** List all shops with optional status filtering */
  listShops: async (status?: string): Promise<ApiResponse<AdminShop[]>> => {
    const response = await apiClient.get<ApiResponse<AdminShop[]>>('/admin/shops', {
      params: { status },
    });
    return response.data;
  },

  /** Approve a shop application */
  approveShop: async (shopId: number): Promise<ApiResponse<ShopApprovalResult>> => {
    const response = await apiClient.post<ApiResponse<ShopApprovalResult>>(
      `/admin/shops/${shopId}/approve`,
    );
    return response.data;
  },

  /** Reject a shop application with admin notes */
  rejectShop: async (shopId: number, notes: string): Promise<ApiResponse<ShopApprovalResult>> => {
    const response = await apiClient.post<ApiResponse<ShopApprovalResult>>(
      `/admin/shops/${shopId}/reject`,
      { notes },
    );
    return response.data;
  },

  /** Get specific shop profile (Admin detail view) */
  getShopDetail: async (shopId: number): Promise<ApiResponse<AdminShop>> => {
    const response = await apiClient.get<ApiResponse<AdminShop>>(`/admin/shops/${shopId}`);
    return response.data;
  },

  /** Get shop onboarding progress (includes document URLs) */
  getShopOnboardingProgress: async (shopId: number): Promise<ApiResponse<OnboardingStep[]>> => {
    const response = await apiClient.get<ApiResponse<OnboardingStep[]>>(
      '/onboarding/shop/steps',
      { params: { shopId } },
    );
    return response.data;
  },

  /** Review (approve/reject) a specific onboarding step */
  reviewShopOnboardingStep: async (data: {
    shopId: number;
    stepId: number;
    status: 'approved' | 'rejected';
    notes?: string;
  }): Promise<ApiResponse<OnboardingStepReviewResult>> => {
    // Map UI 'approved' → backend 'completed'
    const backendStatus = data.status === 'approved' ? 'completed' : 'rejected';

    const response = await apiClient.post<ApiResponse<OnboardingStepReviewResult>>(
      `/admin/shops/${data.shopId}/onboarding/${data.stepId}/review`,
      { status: backendStatus, admin_notes: data.notes },
    );
    return response.data;
  },

  /** Get all growth engine settings (loyalty & referral) */
  getGrowthSettings: async (): Promise<ApiResponse<GrowthSettings>> => {
    const response = await apiClient.get<ApiResponse<GrowthSettings>>('/admin/growth/settings');
    return response.data;
  },

  /** Update growth engine settings */
  updateGrowthSettings: async (data: GrowthSettingsPayload): Promise<ApiResponse<GrowthSettings>> => {
    const response = await apiClient.put<ApiResponse<GrowthSettings>>('/admin/growth/settings', data);
    return response.data;
  },

  /** Get all loyalty levels */
  getLoyaltyLevels: async (): Promise<ApiResponse<LoyaltyLevel[]>> => {
    const response = await apiClient.get<ApiResponse<LoyaltyLevel[]>>('/admin/growth/levels');
    return response.data;
  },

  /** Update or create a loyalty level */
  updateLoyaltyLevel: async (
    id: number | 'new',
    data: LoyaltyLevelPayload,
  ): Promise<ApiResponse<LoyaltyLevel>> => {
    const response = await apiClient.put<ApiResponse<LoyaltyLevel>>(
      `/admin/growth/levels/${id}`,
      data,
    );
    return response.data;
  },

  /** List all platform coupons */
  listPlatformCoupons: async (): Promise<ApiResponse<PlatformCoupon[]>> => {
    const response = await apiClient.get<ApiResponse<PlatformCoupon[]>>('/admin/coupons');
    return response.data;
  },

  /** Create a platform coupon */
  createPlatformCoupon: async (
    data: CreateCouponPayload,
  ): Promise<ApiResponse<PlatformCoupon>> => {
    const response = await apiClient.post<ApiResponse<PlatformCoupon>>('/admin/coupons', data);
    return response.data;
  },

  /** Delete a platform coupon */
  deletePlatformCoupon: async (id: number): Promise<ApiResponse<{ deleted: true }>> => {
    const response = await apiClient.delete<ApiResponse<{ deleted: true }>>(`/admin/coupons/${id}`);
    return response.data;
  },

  /** List all orders for administrative oversight */
  listOrders: async (params?: { status?: string }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/orders', { params });
    return response.data;
  },

  /** Force-change an order's status */
  overrideOrderStatus: async (orderId: string, status: string, reason: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/orders/${orderId}/override-status`, {
      status,
      reason,
    });
    return response.data;
  },

  /** List all pending shop bank change requests */
  listBankRequests: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/bank-requests');
    return response.data;
  },

  /** Approve a bank change request */
  approveBankRequest: async (requestId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/bank-requests/${requestId}/approve`);
    return response.data;
  },

  /** Reject a bank change request */
  rejectBankRequest: async (requestId: number, reason: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/bank-requests/${requestId}/reject`, {
      reason,
    });
    return response.data;
  },
};

// Keep ApiError accessible for callers that need to catch it
export { ApiError };
