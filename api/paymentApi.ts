import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

export interface PaymentItem {
  id: number;
  order_id: number;
  amount: string;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  upi_txn_id: string | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
  Order: {
    order_number: string;
    status: string;
  };
}

export const paymentApi = {
  /**
   * Fetch payment history for the logged-in user.
   * role: customer -> their payments
   * role: shop_owner -> payments received
   */
  async getPaymentHistory(params?: { page?: number; limit?: number }): Promise<{
    data: PaymentItem[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        data: PaymentItem[];
        pagination: { total: number; totalPages: number; page: number; limit: number };
      }>>('/payments/history', { params });

      if (response.data.status === 1 && response.data.data) {
        return response.data.data;
      }
      return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 20 } };
    } catch (error) {
      log.error('[paymentApi] getPaymentHistory failed:', error);
      throw ApiError.from(error, 'Failed to fetch payment history');
    }
  },

  /**
   * Verify Razorpay payment signature after checkout success
   */
  async verifyPayment(params: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/payments/razorpay/verify', params);
      return response.data.data;
    } catch (error) {
      log.error('[paymentApi] verifyPayment failed:', error);
      throw ApiError.from(error, 'Payment verification failed');
    }
  },

  /**
   * Reconcile/Verify a payment status with the gateway
   */
  async reconcilePayment(paymentId: number): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/payments/${paymentId}/reconcile`);
      return response.data.data;
    } catch (error) {
      log.error('[paymentApi] reconcilePayment failed:', error);
      throw ApiError.from(error, 'Failed to reconcile payment');
    }
  }
};
