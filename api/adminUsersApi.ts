import { apiClient } from './client';
import { ApiError } from './apiError';
import type { ApiResponse, PaginatedData } from '@/types/api';
import type { AppRole } from '@/types/session';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  email: string | null;
  role: AppRole;
  status: 'active' | 'suspended' | string;
  created_at: string;
};

export type AdminRefund = {
  id: number;
  order_id: number;
  order_number?: string;
  customer_name: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  deny_reason?: string | null;
  created_at: string;
  resolved_at?: string | null;
  payment_id?: number | null;
};

export type AdminPayout = {
  id: number;
  shop_id: number;
  shop_name: string;
  amount: number;
  period_from: string;
  period_to: string;
  status: 'pending' | 'processed';
  processed_at?: string | null;
  created_at: string;
};

export type AdminPayoutSummary = {
  total_pending_amount: number;
  pending_shop_count: number;
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const adminUsersApi = {
  /**
   * List all platform users with optional filtering.
   * GET /admin/users?role=&search=&page=&limit=
   */
  listUsers: async (params?: {
    role?: AppRole | '';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedData<AdminUser>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedData<AdminUser>>>('/admin/users', {
      params,
    });
    return response.data;
  },

  /**
   * Update a user's status or role.
   * PATCH /admin/users/:id
   */
  updateUser: async (
    userId: number,
    data: { status?: 'active' | 'suspended'; role?: AppRole },
  ): Promise<ApiResponse<AdminUser>> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/users/${userId}`,
      data,
    );
    return response.data;
  },
};

// ─── Refunds API ──────────────────────────────────────────────────────────────

export const adminRefundsApi = {
  /**
   * List all refund requests.
   * GET /admin/refunds?status=&page=&limit=
   */
  listRefunds: async (params?: {
    status?: 'pending' | 'approved' | 'denied' | '';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedData<AdminRefund>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedData<AdminRefund>>>(
      '/admin/refunds',
      { params },
    );
    return response.data;
  },

  /**
   * Approve a refund request.
   * PATCH /admin/refunds/:id/approve
   */
  approveRefund: async (refundId: number): Promise<ApiResponse<AdminRefund>> => {
    const response = await apiClient.patch<ApiResponse<AdminRefund>>(
      `/admin/refunds/${refundId}/approve`,
    );
    return response.data;
  },

  /**
   * Deny a refund request with an optional reason.
   * PATCH /admin/refunds/:id/deny
   */
  denyRefund: async (
    refundId: number,
    reason?: string,
  ): Promise<ApiResponse<AdminRefund>> => {
    const response = await apiClient.patch<ApiResponse<AdminRefund>>(
      `/admin/refunds/${refundId}/deny`,
      reason ? { reason } : {},
    );
    return response.data;
  },

  /**
   * Trigger Razorpay reconcile for a stuck payment (admin only).
   * POST /payments/:paymentId/reconcile
   */
  reconcilePayment: async (paymentId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/payments/${paymentId}/reconcile`,
    );
    return response.data;
  },
};

// ─── Payouts API ──────────────────────────────────────────────────────────────

export const adminPayoutsApi = {
  /**
   * List all shop payout records.
   * GET /admin/payouts?status=&page=&limit=
   */
  listPayouts: async (params?: {
    status?: 'pending' | 'processed' | '';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedData<AdminPayout>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedData<AdminPayout>>>(
      '/admin/payouts',
      { params },
    );
    return response.data;
  },

  /**
   * Get summary stats for admin payout dashboard.
   * GET /admin/payouts/summary
   */
  getPayoutSummary: async (): Promise<ApiResponse<AdminPayoutSummary>> => {
    const response = await apiClient.get<ApiResponse<AdminPayoutSummary>>(
      '/admin/payouts/summary',
    );
    return response.data;
  },

  /**
   * Mark a payout as processed.
   * PATCH /admin/payouts/:id/process
   */
  processPayout: async (payoutId: number): Promise<ApiResponse<AdminPayout>> => {
    const response = await apiClient.patch<ApiResponse<AdminPayout>>(
      `/admin/payouts/${payoutId}/process`,
    );
    return response.data;
  },
};

export { ApiError };
