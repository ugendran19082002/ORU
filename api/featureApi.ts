import { apiClient } from './client';
import { ApiError } from './apiError';
import { log } from '@/utils/logger';
import type { ApiResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeatureMap = Record<string, boolean>;

// ─── API ──────────────────────────────────────────────────────────────────────

export const featureApi = {
  /**
   * Fetch the current user's feature access flags.
   * GET /features/my-access
   */
  async getMyFeatureAccess(): Promise<FeatureMap> {
    try {
      const response = await apiClient.get<ApiResponse<FeatureMap>>('/features/my-access');
      if (response.data.status === 1) return response.data.data;
      throw new ApiError('FETCH_FAILED', response.status ?? 400, response.data.message || 'Failed to fetch feature access');
    } catch (error) {
      log.error('[featureApi] getMyFeatureAccess failed:', error);
      throw ApiError.from(error, 'Failed to fetch feature access');
    }
  },
};
