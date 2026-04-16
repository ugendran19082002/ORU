import { apiClient } from './client';
import type { ApiResponse, PaginatedData } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeliveryEarningEntry = {
  id: number;
  order_number: string;
  amount: number;
  tip: number;
  delivered_at: string;
  delivery_time_min: number | null;
};

export type DeliveryEarnings = {
  period: 'today' | 'week' | 'month';
  total_deliveries: number;
  total_earnings: number;
  recent: DeliveryEarningEntry[];
};

export type DeliveryTripEntry = {
  id: number;
  order_number: string;
  shop_name: string;
  status: 'assigned' | 'picked_up' | 'delivered' | 'failed';
  earnings: number;
  assigned_at: string;
  delivered_at: string | null;
  delivery_time_min: number | null;
};

export type PodSubmitResult = {
  assignment_id: number;
  order_id: number;
  status: 'delivered';
  delivered_at: string;
  delivery_time_min: number | null;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const deliveryApi = {
  /**
   * GET /delivery/earnings?period=today|week|month
   */
  getEarnings: async (period: 'today' | 'week' | 'month' = 'today') => {
    const res = await apiClient.get<ApiResponse<DeliveryEarnings>>(
      `/delivery/earnings?period=${period}`,
    );
    return res.data;
  },

  /**
   * GET /delivery/history?page=1&limit=20&period=today|week|month
   */
  getTripHistory: async (params?: {
    page?: number;
    limit?: number;
    period?: 'today' | 'week' | 'month';
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.period) query.set('period', params.period);
    const res = await apiClient.get<ApiResponse<PaginatedData<DeliveryTripEntry>>>(
      `/delivery/history?${query.toString()}`,
    );
    return res.data;
  },

  /**
   * POST /delivery/complete
   * Submit proof of delivery photo and optional OTP. Can also mark as failed.
   */
  submitPod: async (payload: {
    assignment_id: number;
    pod_photo_url?: string;
    delivery_otp?: string;
    status?: 'delivered' | 'failed';
    failed_reason?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<PodSubmitResult>>(
      '/delivery/complete',
      payload,
    );
    return res.data;
  },

  /**
   * POST /delivery/upload-pod
   * Upload POD image file
   */
  uploadPod: async (file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const res = await apiClient.post<ApiResponse<{ url: string }>>(
      '/delivery/upload-pod',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  /**
   * PATCH /delivery/location
   */
  pushLocation: async (latitude: number, longitude: number) => {
    const res = await apiClient.patch<ApiResponse<Record<string, never>>>(
      '/delivery/location',
      { latitude, longitude },
    );
    return res.data;
  },
};
