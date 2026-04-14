import { create } from 'zustand';

import type { Shop, DeliveryAgent } from '@/types/domain';
import { shopApi } from '@/api/shopApi';

const DEFAULT_AGENTS: DeliveryAgent[] = [
  { id: 'da_owner', name: 'Store Owner', phone: '9999999999', status: 'active', assignedOrders: 0 },
  { id: 'da_1', name: 'Ravi Kumar', phone: '9876543210', status: 'active', assignedOrders: 2 },
  { id: 'da_2', name: 'Suresh M', phone: '9123456789', status: 'offline', assignedOrders: 0 },
];

type ShopFilters = {
  openNow: boolean;
  topRated: boolean;
  nearest: boolean;
  maxPrice: number | null;
};

type ShopState = {
  shops: Shop[];
  isLoading: boolean;
  error: string | null;
  selectedShopId: string | null;
  filters: ShopFilters;
  loadShops: (params?: { lat: number; lng: number }) => Promise<void>;
  setSelectedShop: (shopId: string | null) => void;
  toggleFilter: (key: keyof Omit<ShopFilters, 'maxPrice'>) => void;
  setMaxPrice: (price: number | null) => void;
  resetFilters: () => void;
  
  // Fleet Management
  deliveryAgents: DeliveryAgent[];
  addDeliveryAgent: (payload: { name: string; phone: string }) => void;
  removeDeliveryAgent: (id: string) => void;
};

const defaultFilters: ShopFilters = {
  openNow: false,
  topRated: false,
  nearest: true,
  maxPrice: null,
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
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch shops', isLoading: false });
    }
  },

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

  deliveryAgents: DEFAULT_AGENTS,
  addDeliveryAgent: (payload) => set((state) => ({
    deliveryAgents: [
      ...state.deliveryAgents,
      {
        id: `da_${Date.now()}`,
        name: payload.name,
        phone: payload.phone,
        status: 'offline',
        assignedOrders: 0,
      }
    ]
  })),
  removeDeliveryAgent: (id) => set((state) => ({
    deliveryAgents: state.deliveryAgents.filter(a => a.id !== id)
  })),
}));
