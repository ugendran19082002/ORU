import { apiClient } from './client';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * ThanniGo Centralized API Service
 * 
 * Provides a unified interface for all HTTP operations.
 * Automatically utilizes the interceptors in apiClient for:
 * - Bearer Token attachment
 * - Silent token refresh on 401
 * - Standardized logging
 * - Global error handling via DeviceEventEmitter
 */

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiService {
  /**
   * Perform a GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, config);
    return response.data;
  }

  /**
   * Perform a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, config);
    return response.data;
  }

  /**
   * Perform a PUT request (Full resource replacement)
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, config);
    return response.data;
  }

  /**
   * Perform a PATCH request (Partial update)
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data, config);
    return response.data;
  }

  /**
   * Perform a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, config);
    return response.data;
  }

  /**
   * Handle generic data fetching with error wrapping
   * Useful for hooks/stores to keep them clean.
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient(config);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
