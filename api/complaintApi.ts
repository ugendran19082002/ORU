import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse, PaginatedData } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Complaint = {
  id: number;
  order_id: number;
  customer_id: number;
  shop_id: number;
  type: string;
  issue_type: string | null;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'normal' | 'urgent';
  is_sos: boolean;
  admin_action: 'pending_review' | 'approved' | 'rejected' | 'escalated' | null;
  admin_notes: string | null;
  resolution_type: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string | null;
  Order?: { order_number: string; status: string; total_amount: number };
  Shop?: { id: number; name: string };
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const complaintApi = {
  /**
   * Fetch the current customer's complaints.
   * GET /complaints
   */
  async getMyComplaints(params?: {
    status?: Complaint['status'];
    page?: number;
    limit?: number;
  }): Promise<PaginatedData<Complaint>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedData<Complaint>>>('/complaints', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch complaints');
    } catch (error) {
      log.error('[complaintApi] getMyComplaints failed:', error);
      throw ApiError.from(error, 'Failed to fetch complaints');
    }
  },

  /**
   * File a new complaint for an order.
   * POST /complaints
   */
  async fileComplaint(data: {
    order_id: number;
    type: string;
    description: string;
    photo_urls?: string[];
  }): Promise<Complaint> {
    try {
      const response = await apiClient.post<ApiResponse<Complaint>>('/complaints', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('SUBMIT_FAILED', response.status ?? 400, response.data.message || 'Failed to file complaint');
    } catch (error) {
      log.error('[complaintApi] fileComplaint failed:', error);
      throw ApiError.from(error, 'Failed to file complaint');
    }
  },

  /**
   * File an SOS complaint for an order.
   * POST /complaints/sos
   */
  async fileSosComplaint(data: {
    order_id: number;
    issue_type: string;
    description: string;
    is_sos?: boolean;
    photo_urls?: string[];
  }): Promise<Complaint> {
    try {
      const response = await apiClient.post<ApiResponse<Complaint>>('/complaints/sos', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('SUBMIT_FAILED', response.status ?? 400, response.data.message || 'Failed to file SOS complaint');
    } catch (error) {
      log.error('[complaintApi] fileSosComplaint failed:', error);
      throw ApiError.from(error, 'Failed to file SOS complaint');
    }
  },

  /**
   * [Admin] List all complaints with optional filters.
   * GET /admin/complaints
   */
  async adminListComplaints(params?: {
    status?: Complaint['status'];
    page?: number;
    limit?: number;
  }): Promise<PaginatedData<Complaint>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedData<Complaint>>>('/admin/complaints', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch complaints');
    } catch (error) {
      log.error('[complaintApi] adminListComplaints failed:', error);
      throw ApiError.from(error, 'Failed to fetch complaints');
    }
  },

  /**
   * [Admin] Review and action a complaint.
   * PATCH /admin/complaints/:id/review
   */
  async adminReviewComplaint(
    id: number,
    data: {
      action: Complaint['admin_action'];
      admin_notes?: string;
      resolution_type?: string;
    },
  ): Promise<Complaint> {
    try {
      const response = await apiClient.patch<ApiResponse<Complaint>>(`/admin/complaints/${id}/review`, data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', response.status ?? 400, response.data.message || 'Failed to review complaint');
    } catch (error) {
      log.error('[complaintApi] adminReviewComplaint failed:', error);
      throw ApiError.from(error, 'Failed to review complaint');
    }
  },

  /**
   * [Shop Owner] List complaints assigned to their shop.
   * GET /shop-owner/complaints
   */
  async shopGetComplaints(params?: {
    status?: Complaint['status'];
    page?: number;
    limit?: number;
  }): Promise<PaginatedData<Complaint>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedData<Complaint>>>('/shop-owner/complaints', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch shop complaints');
    } catch (error) {
      log.error('[complaintApi] shopGetComplaints failed:', error);
      throw ApiError.from(error, 'Failed to fetch shop complaints');
    }
  },

  /**
   * [Shop Owner] Resolve a complaint assigned to them.
   * PATCH /shop-owner/complaints/:id/resolve
   */
  async shopResolveComplaint(
    id: number,
    data: {
      resolution_notes: string;
      resolution_type?: string;
    },
  ): Promise<Complaint> {
    try {
      const response = await apiClient.patch<ApiResponse<Complaint>>(`/shop-owner/complaints/${id}/resolve`, data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', response.status ?? 400, response.data.message || 'Failed to resolve complaint');
    } catch (error) {
      log.error('[complaintApi] shopResolveComplaint failed:', error);
      throw ApiError.from(error, 'Failed to resolve complaint');
    }
  },
};
