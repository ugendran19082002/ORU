import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse, PaginatedData } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShopWallet = {
  id: number;
  shop_id: number;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_paid_out: number;
  total_commission: number;
  payout_mode: 'instant' | 'scheduled';
  payout_cycle: 'daily' | 'weekly' | 'monthly';
  bank_account_verified: boolean;
  razorpay_fund_account_id: string | null;
  last_payout_at: string | null;
};

export type PayoutLog = {
  id: number;
  type: 'credit' | 'debit' | 'refund_debit' | 'commission';
  amount: number;
  commission_amount: number;
  net_amount: number;
  balance_after: number;
  order_id: number | null;
  payout_status: 'pending' | 'processing' | 'paid' | 'failed' | null;
  description: string | null;
  failed_reason: string | null;
  scheduled_for: string | null;
  processed_at: string | null;
  created_at: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const payoutApi = {
  /**
   * Fetch the shop owner's wallet details.
   * GET /shop-owner/payouts/wallet
   */
  async getWallet(): Promise<ShopWallet> {
    try {
      const response = await apiClient.get<ApiResponse<ShopWallet>>('/shop-owner/payouts/wallet');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch wallet');
    } catch (error) {
      log.error('[payoutApi] getWallet failed:', error);
      throw ApiError.from(error, 'Failed to fetch wallet');
    }
  },

  /**
   * Fetch paginated payout transaction logs.
   * GET /shop-owner/payouts
   */
  async getPayoutLogs(params?: {
    page?: number;
    limit?: number;
    type?: PayoutLog['type'];
    payout_status?: PayoutLog['payout_status'];
  }): Promise<PaginatedData<PayoutLog>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedData<PayoutLog>>>('/shop-owner/payouts', { params });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch payout logs');
    } catch (error) {
      log.error('[payoutApi] getPayoutLogs failed:', error);
      throw ApiError.from(error, 'Failed to fetch payout logs');
    }
  },

  /**
   * Request an instant payout of a specific amount.
   * POST /shop-owner/payouts/instant
   */
  async requestInstantPayout(amount: number): Promise<PayoutLog> {
    try {
      const response = await apiClient.post<ApiResponse<PayoutLog>>('/shop-owner/payouts/instant', { amount });
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('PAYOUT_FAILED', response.status ?? 400, response.data.message || 'Failed to request instant payout');
    } catch (error) {
      log.error('[payoutApi] requestInstantPayout failed:', error);
      throw ApiError.from(error, 'Failed to request instant payout');
    }
  },

  /**
   * Update payout settings (mode, cycle, UPI ID).
   * PATCH /shop-owner/payouts/settings
   */
  async updatePayoutSettings(data: {
    payout_mode: ShopWallet['payout_mode'];
    payout_cycle: ShopWallet['payout_cycle'];
    upi_id?: string;
  }): Promise<ShopWallet> {
    try {
      const response = await apiClient.patch<ApiResponse<ShopWallet>>('/shop-owner/payouts/settings', data);
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('UPDATE_FAILED', response.status ?? 400, response.data.message || 'Failed to update payout settings');
    } catch (error) {
      log.error('[payoutApi] updatePayoutSettings failed:', error);
      throw ApiError.from(error, 'Failed to update payout settings');
    }
  },
};
