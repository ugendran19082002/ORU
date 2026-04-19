import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type PendingItem = {
  productId: string;
  quantity: number;
  shopId: string;
  itemData: { name: string; price: number };
};

type CartState = {
  shopId: string | null;
  items: Record<string, CartItem>;
  note: string;
  scheduledSlot: string | null;
  paymentMethod: 'upi' | 'cod';
  couponCode: string;
  couponDiscount: number;
  pendingItem: PendingItem | null;
  setShop: (shopId: string) => void;
  // Returns true if added, false if shop-switch confirmation needed
  setQuantity: (productId: string, quantity: number, shopId: string, itemData?: { name: string; price: number }) => boolean;
  confirmSwitchShop: () => void;
  cancelSwitchShop: () => void;
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
  pendingItem: null,
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setShop: (shopId) => set({ shopId, items: {}, couponCode: '', couponDiscount: 0 }),

      setQuantity: (productId, quantity, shopId, itemData) => {
        const state = get();
        const newQty = Math.min(50, Math.max(0, quantity));

        // Different shop with items in cart → require confirmation before switching
        if (state.shopId && state.shopId !== shopId && Object.keys(state.items).length > 0) {
          if (newQty > 0) {
            set({ pendingItem: { productId, quantity: newQty, shopId, itemData: itemData ?? { name: 'Water Can', price: 30 } } });
            return false;
          }
          return true;
        }

        set((s) => {
          const existing = s.items[productId];
          const newItems = { ...s.items };
          if (newQty === 0) {
            delete newItems[productId];
          } else {
            newItems[productId] = {
              productId,
              quantity: newQty,
              name: itemData?.name ?? existing?.name ?? 'Water Can',
              price: itemData?.price ?? existing?.price ?? 30,
            };
          }
          return { shopId, items: newItems };
        });
        return true;
      },

      confirmSwitchShop: () => {
        const { pendingItem } = get();
        if (!pendingItem) return;
        const { productId, quantity, shopId, itemData } = pendingItem;
        set({
          shopId,
          items: { [productId]: { productId, quantity, name: itemData.name, price: itemData.price } },
          couponCode: '',
          couponDiscount: 0,
          note: '',
          scheduledSlot: null,
          pendingItem: null,
        });
      },

      cancelSwitchShop: () => set({ pendingItem: null }),
      setNote: (note) => set({ note }),
      setScheduledSlot: (scheduledSlot) => set({ scheduledSlot }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setCouponCode: (couponCode) => set({ couponCode }),
      applyCoupon: (couponCode, couponDiscount) => set({ couponCode, couponDiscount }),
      clearCart: () => set(initialState),

      getSubtotal: () => {
        const items = get().items;
        return Object.values(items).reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      getDeliveryFee: () => 25,
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().couponDiscount;
        const delivery = get().getDeliveryFee();
        return Math.max(subtotal - discount, 0) + delivery;
      },
    }),
    {
      name: 'thannigo_cart_v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the data fields — never persist pendingItem (transient UI state)
      partialize: (state) => ({
        shopId: state.shopId,
        items: state.items,
        note: state.note,
        scheduledSlot: state.scheduledSlot,
        paymentMethod: state.paymentMethod,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    },
  ),
);
