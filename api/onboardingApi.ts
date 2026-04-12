import { apiClient } from './client';
import type { OnboardingStatus, OnboardingStep, ShopCreationData } from '@/types/onboarding';

export interface OnboardingResponse<T> {
  status: number;
  message: string;
  data: T;
}

export const onboardingApi = {
  /**
   * Get all customer onboarding steps
   */
  getCustomerSteps: async (): Promise<OnboardingResponse<OnboardingStatus>> => {
    const response = await apiClient.get<OnboardingResponse<OnboardingStatus>>('/onboarding/customer/steps');
    return response.data;
  },

  /**
   * Complete a customer onboarding step
   */
  completeCustomerStep: async (stepKey: string, metadata?: any): Promise<OnboardingResponse<any>> => {
    const response = await apiClient.post<OnboardingResponse<any>>(`/onboarding/customer/steps/${stepKey}/complete`, { metadata });
    return response.data;
  },

  /**
   * Get all shop onboarding steps
   */
  getShopSteps: async (shopId: number): Promise<OnboardingResponse<OnboardingStatus>> => {
    const response = await apiClient.get<OnboardingResponse<OnboardingStatus>>(`/onboarding/shop/steps`, {
      params: { shopId }
    });
    return response.data;
  },

  /**
   * Create a new shop profile
   */
  createShop: async (data: ShopCreationData): Promise<OnboardingResponse<{ id: number, uuid: string }>> => {
    const response = await apiClient.post<OnboardingResponse<{ id: number, uuid: string }>>('/shop-owner/shops', data);
    return response.data;
  },

  /**
   * Fetch merchant's primary shop to find the active shop ID
   */
  getMerchantShop: async (): Promise<OnboardingResponse<any>> => {
    const response = await apiClient.get<OnboardingResponse<any>>('/shop-owner/shops/me');
    return response.data;
  },

  /**
   * Complete a shop onboarding step
   */
  completeShopStep: async (stepKey: string, shopId: number, metadata?: any, document_url?: string): Promise<OnboardingResponse<any>> => {
    const response = await apiClient.post<OnboardingResponse<any>>(`/onboarding/shop/steps/${stepKey}/complete`, {
      shop_id: shopId,
      metadata,
      document_url
    });
    return response.data;
  },

  /**
   * Specifically update bank details (Convenience method)
   */
  updateBankDetails: async (shopId: number, data: { bank_account_no: string; bank_ifsc: string }): Promise<OnboardingResponse<any>> => {
    return onboardingApi.completeShopStep('bank_details', shopId, data);
  },

  /**
   * Specifically update store timing
   */
  updateStoreTiming: async (shopId: number, data: { opening_time: string; closing_time: string; holiday_dates?: any }): Promise<OnboardingResponse<any>> => {
    return onboardingApi.completeShopStep('store_timing', shopId, data);
  },

  /**
   * Specifically update store branding/profile
   */
  updateStoreBranding: async (shopId: number, data: { logo_url?: string; banner_url?: string; description?: string }): Promise<OnboardingResponse<any>> => {
    return onboardingApi.completeShopStep('store_profile', shopId, data);
  },

  /**
   * Upload a shop document (FSSAI, GST, Bank, etc.)
   */
  uploadShopDocument: async (
    stepKey: string, 
    shopId: number, 
    file: { uri: string; name: string; type: string }
  ): Promise<OnboardingResponse<{ document_url: string; status: string }>> => {
    const formData = new FormData();
    formData.append('shop_id', shopId.toString());
    
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post<OnboardingResponse<{ document_url: string; status: string }>>(
      `/onboarding/shop/steps/${stepKey}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Legacy upload for images (Profile, Banner)
   * @deprecated Use uploadShopDocument for more flexibility
   */
  uploadFile: async (shopId: number, stepKey: string, fileUri: string): Promise<OnboardingResponse<{ document_url: string }>> => {
    const filename = fileUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    return onboardingApi.uploadShopDocument(stepKey, shopId, {
      uri: fileUri,
      name: filename,
      type
    }) as any;
  },

  /**
   * Skip a shop onboarding step
   */
  skipShopStep: async (stepKey: string, shopId: number): Promise<OnboardingResponse<any>> => {
    const response = await apiClient.post<OnboardingResponse<any>>(`/onboarding/shop/steps/${stepKey}/skip`, {
      shop_id: shopId
    });
    return response.data;
  },
  
  /**
   * Resubmit a rejected shop application for review
   */
  resubmitShop: async (shopId: number): Promise<OnboardingResponse<{ status: string }>> => {
    const response = await apiClient.post<OnboardingResponse<{ status: string }>>(`/onboarding/shop/${shopId}/resubmit`);
    return response.data;
  },
};
