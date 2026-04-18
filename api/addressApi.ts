import { apiClient } from "./client";

export const addressApi = {
  /**
   * Get all active addresses for the current user
   */
  getAddresses: () => apiClient.get("/users/me/addresses"),

  /**
   * Add a new delivery address
   */
  addAddress: (data: {
    label: string;
    recipient_name?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
    floor_number?: number;
    is_floor?: boolean;
    no_of_floor?: number;
    gate_code?: string;
    delivery_instructions?: string;
    is_default?: boolean;
  }) => apiClient.post("/users/me/addresses", data),

  /**
   * Update an existing address
   */
  updateAddress: (id: string | number, data: Partial<{
    label: string;
    recipient_name?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
    floor_number?: number;
    is_floor?: boolean;
    no_of_floor?: number;
    gate_code?: string;
    delivery_instructions?: string;
    is_default?: boolean;
  }>) => apiClient.patch(`/users/me/addresses/${id}`, data),

  /**
   * Delete an address (soft delete)
   */
  deleteAddress: (id: string | number) => apiClient.delete(`/users/me/addresses/${id}`),

  /**
   * Set an address as the default delivery point
   */
  setDefault: (id: string | number) => apiClient.post(`/users/me/addresses/${id}/set-default`),
};
