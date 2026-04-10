import { create } from 'zustand';

import { mockProducts, mockShops } from '@/utils/mockData';

type CartState = {
  shopId: string | null;
  items: Record<string, number>;
  note: string;
  scheduledSlot: string | null;
  paymentMethod: 'upi' | 'cod' | 'wallet';
  couponCode: string;
  setShop: (shopId: string) => void;
  setQuantity: (productId: string, quantity: number, shopId: string) => void;
  setNote: (note: string) => void;
  setScheduledSlot: (slot: string | null) => void;
  setPaymentMethod: (method: 'upi' | 'cod' | 'wallet') => void;
  setCouponCode: (code: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
};

const initialState = {
  shopId: null,
  items: { P001: 2 } as Record<string, number>,
  note: '',
  scheduledSlot: null,
  paymentMethod: 'upi' as const,
  couponCode: '',
};

export const useCartStore = create<CartState>((set, get) => ({
  ...initialState,
  setShop: (shopId) => set({ shopId, items: {} }),
  setQuantity: (productId, quantity, shopId) =>
    set((state) => ({
      shopId,
      items: {
        ...state.items,
        [productId]: Math.max(0, quantity),
      },
    })),
  setNote: (note) => set({ note }),
  setScheduledSlot: (scheduledSlot) => set({ scheduledSlot }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCouponCode: (couponCode) => set({ couponCode }),
  clearCart: () => set(initialState),
  getSubtotal: () => {
    const items = get().items;
    return Object.entries(items).reduce((sum, [productId, qty]) => {
      const product = mockProducts.find((item) => item.id === productId);
      return sum + (product?.price ?? 0) * qty;
    }, 0);
  },
  getDeliveryFee: () => {
    const shopId = get().shopId;
    const shop = mockShops.find((item) => item.id === shopId);
    return shop ? (shop.distanceKm > 2 ? 25 : 20) : 20;
  },
  getTotal: () => get().getSubtotal() + get().getDeliveryFee(),
}));
