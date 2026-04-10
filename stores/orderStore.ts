import { create } from 'zustand';

import type { Order, OrderStatus } from '@/types/domain';
import { mockOrders } from '@/utils/mockData';
import { orderApi } from '@/api/orderApi';

type OrderState = {
  orders: Order[];
  activeOrderId: string | null;
  isSubmitting: boolean;
  placeOrder: (payload: Omit<Order, 'id' | 'createdAtLabel' | 'status' | 'deliveryOtp'>) => Promise<Order>;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  setActiveOrder: (orderId: string | null) => void;
};

export const useOrderStore = create<OrderState>((set) => ({
  orders: mockOrders,
  activeOrderId: mockOrders[0]?.id ?? null,
  isSubmitting: false,
  placeOrder: async (payload) => {
    set({ isSubmitting: true });
    try {
      const apiRes = await orderApi.submitOrder(payload);
      const order: Order = {
        ...payload,
        id: apiRes.orderId,
      createdAtLabel: 'Just now',
      status: 'pending',
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
    };
    set((state) => ({
      orders: [order, ...state.orders],
      activeOrderId: order.id,
      isSubmitting: false,
    }));
    return order;
    } catch(e) {
      set({ isSubmitting: false });
      throw e;
    }
  },
  updateStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    })),
  setActiveOrder: (activeOrderId) => set({ activeOrderId }),
}));
