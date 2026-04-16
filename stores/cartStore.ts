import { create } from 'zustand';

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  shopId: string | null;
  items: Record<string, CartItem>;
  note: string;
  scheduledSlot: string | null;
  paymentMethod: 'upi' | 'cod';
  couponCode: string;
  couponDiscount: number;
  setShop: (shopId: string) => void;
  setQuantity: (productId: string, quantity: number, shopId: string, itemData?: { name: string, price: number }) => void;
  setNote: (note: string) => void;
  setScheduledSlot: (slot: string | null) => void;
  setPaymentMethod: (method: 'upi' | 'cod') => void;
  setCouponCode: (code: string) => void;
  applyCoupon: (code: string, discount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
};

const initialState = {
  shopId: null,
  items: {} as Record<string, CartItem>,
  note: '',
  scheduledSlot: null,
  paymentMethod: 'cod' as const,
  couponCode: '',
  couponDiscount: 0,
};

export const useCartStore = create<CartState>((set, get) => ({
  ...initialState,
  setShop: (shopId) => set({ shopId, items: {} }),
  setQuantity: (productId, quantity, shopId, itemData) =>
    set((state) => {
      const existing = state.items[productId];
      const newQty = Math.min(50, Math.max(0, quantity));
      
      const newItems = { ...state.items };
      if (newQty === 0) {
        delete newItems[productId];
      } else {
        newItems[productId] = {
          productId,
          quantity: newQty,
          name: itemData?.name || existing?.name || 'Water Can',
          price: itemData?.price || existing?.price || 30,
        };
      }

      return {
        shopId,
        items: newItems,
      };
    }),
  setNote: (note) => set({ note }),
  setScheduledSlot: (scheduledSlot) => set({ scheduledSlot }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCouponCode: (couponCode) => set({ couponCode }),
  applyCoupon: (couponCode, couponDiscount) => set({ couponCode, couponDiscount }),
  clearCart: () => set(initialState),
  getSubtotal: () => {
    const items = get().items;
    return Object.values(items).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  getDeliveryFee: () => {
    // Dynamic fallback: Base delivery fee
    return 25;
  },
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().couponDiscount;
    const delivery = get().getDeliveryFee();
    return Math.max(subtotal - discount, 0) + delivery;
  },
}));
