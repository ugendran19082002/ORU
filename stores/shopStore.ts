import { create } from 'zustand';

import type { Shop } from '@/types/domain';
import { shopApi } from '@/api/shopApi';

type ShopFilters = {
  openNow: boolean;
  topRated: boolean;
  nearest: boolean;
  maxPrice: number | null;
};

const defaultFilters: ShopFilters = {
  openNow: false,
  topRated: false,
  nearest: true,
  maxPrice: null,
};

type ShopState = {
  shops: Shop[];
  isLoading: boolean;
  error: string | null;
  selectedShopId: string | null;
  filters: ShopFilters;
  loadShops: (params?: { lat?: number; lng?: number }) => Promise<void>;
  searchShops: (query: string, lat?: number, lng?: number) => Promise<void>;
  fetchPersonalized: (lat?: number, lng?: number) => Promise<Shop | null>;
  setSelectedShop: (shopId: string | null) => void;
  toggleFilter: (key: keyof Omit<ShopFilters, 'maxPrice'>) => void;
  setMaxPrice: (price: number | null) => void;
  resetFilters: () => void;
};

export const useShopStore = create<ShopState>((set) => ({
  shops: [],
  isLoading: false,
  error: null,
  selectedShopId: null,
  filters: defaultFilters,

  loadShops: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await shopApi.getShops(params);
      set({ shops: data, isLoading: false });
    } catch (err: unknown) {
      set({
        error: (err as { message?: string }).message ?? 'Failed to fetch shops',
        isLoading: false,
      });
    }
  },

  searchShops: async (q, lat, lng) => {
    set({ isLoading: true, error: null });
    try {
      const data = await shopApi.searchShops({ q, lat, lng });
      set({ shops: data, isLoading: false });
    } catch (err: unknown) {
      set({
        error: (err as { message?: string }).message ?? 'Search failed',
        isLoading: false,
      });
    }
  },

  fetchPersonalized: async (lat, lng) => {
    try {
      const data = await shopApi.getPersonalizedShops({ lat, lng, limit: 1 });
      return data[0] || null;
    } catch {
      return null;
    }
  },

  setSelectedShop: (selectedShopId) => set({ selectedShopId }),

  toggleFilter: (key) =>
    set((state) => ({
      filters: { ...state.filters, [key]: !state.filters[key] },
    })),

  setMaxPrice: (maxPrice) =>
    set((state) => ({
      filters: { ...state.filters, maxPrice },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
