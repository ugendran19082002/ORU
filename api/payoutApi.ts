import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';
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
  upi_id?: string | null;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
  account_holder_name?: string | null;
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

export const payoutApi = {
  /**
   * Get current payout settings and wallet balance.
   * GET /shop-owner/payouts/wallet
   */
  async getWallet(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/shop-owner/payouts/wallet');
      return response.data.data;
    } catch (error) {
      log.error('[payoutApi] getWallet failed:', error);
      throw ApiError.from(error, 'Failed to fetch wallet info');
    }
  },

  /**
   * Update payout settings (UPI/Bank, Cycle).
   * PATCH /shop-owner/payouts/settings
   */
  async updateSettings(payload: {
    payout_mode: 'upi' | 'bank';
    payout_cycle: 'daily' | 'weekly' | 'monthly';
    upi_id?: string;
    bank_details?: {
      account_number: string;
      ifsc: string;
      holder_name: string;
    };
  }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>('/shop-owner/payouts/settings', payload);
      return response.data;
    } catch (error) {
      log.error('[payoutApi] updateSettings failed:', error);
      throw ApiError.from(error, 'Failed to update payout settings');
    }
  },

  /**
   * Request instant payout.
   * POST /shop-owner/payouts/instant
   */
  async getPayoutLogs(): Promise<ApiResponse<PayoutLog[]>> {
    try {
      const response = await apiClient.get<ApiResponse<PayoutLog[]>>('/shop-owner/payouts/logs');
      return response.data;
    } catch (error) {
      log.error('[payoutApi] getPayoutLogs failed:', error);
      throw ApiError.from(error, 'Failed to fetch payout logs');
    }
  },

  /**
   * Request instant payout.
   * POST /shop-owner/payouts/instant
   */
  async requestInstantPayout(amount?: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/payouts/instant');
      return response.data;
    } catch (error) {
      log.error('[payoutApi] requestInstantPayout failed:', error);
      throw ApiError.from(error, 'Failed to request instant payout');
    }
  },
  /**
   * Request bank account verification.
   * POST /shop-owner/payouts/verify/bank
   */
  async verifyBank(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/payouts/verify/bank');
      return response.data;
    } catch (error) {
      log.error('[payoutApi] verifyBank failed:', error);
      throw ApiError.from(error, 'Failed to request bank verification');
    }
  },
  /**
   * Request UPI ID verification.
   * POST /shop-owner/payouts/verify/upi
   */
  async verifyUpi(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/shop-owner/payouts/verify/upi');
      return response.data;
    } catch (error) {
      log.error('[payoutApi] verifyUpi failed:', error);
      throw ApiError.from(error, 'Failed to request UPI verification');
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
