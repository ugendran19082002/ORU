import { create } from 'zustand';

import type { Shop } from '@/types/domain';
import { mockShops } from '@/utils/mockData';

type ShopFilters = {
  openNow: boolean;
  topRated: boolean;
  nearest: boolean;
  maxPrice: number | null;
};

type ShopState = {
  shops: Shop[];
  selectedShopId: string | null;
  filters: ShopFilters;
  setSelectedShop: (shopId: string | null) => void;
  toggleFilter: (key: keyof Omit<ShopFilters, 'maxPrice'>) => void;
  setMaxPrice: (price: number | null) => void;
  resetFilters: () => void;
};

const defaultFilters: ShopFilters = {
  openNow: false,
  topRated: false,
  nearest: true,
  maxPrice: null,
};

export const useShopStore = create<ShopState>((set) => ({
  shops: mockShops,
  selectedShopId: mockShops[0]?.id ?? null,
  filters: defaultFilters,
  setSelectedShop: (selectedShopId) => set({ selectedShopId }),
  toggleFilter: (key) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: !state.filters[key],
      },
    })),
  setMaxPrice: (maxPrice) =>
    set((state) => ({
      filters: {
        ...state.filters,
        maxPrice,
      },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
