import { create } from 'zustand';

import type { Order, OrderStatus } from '@/types/domain';
import { mockOrders } from '@/utils/mockData';

type OrderState = {
  orders: Order[];
  activeOrderId: string | null;
  placeOrder: (payload: Omit<Order, 'id' | 'createdAtLabel' | 'status' | 'deliveryOtp'>) => Order;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  setActiveOrder: (orderId: string | null) => void;
};

export const useOrderStore = create<OrderState>((set) => ({
  orders: mockOrders,
  activeOrderId: mockOrders[0]?.id ?? null,
  placeOrder: (payload) => {
    const order: Order = {
      ...payload,
      id: `TNG-${Date.now()}`,
      createdAtLabel: 'Just now',
      status: 'pending',
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
    };
    set((state) => ({
      orders: [order, ...state.orders],
      activeOrderId: order.id,
    }));
    return order;
  },
  updateStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    })),
  setActiveOrder: (activeOrderId) => set({ activeOrderId }),
}));
