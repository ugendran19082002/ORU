import { create } from 'zustand';
import dayjs from 'dayjs';

import type { Order, OrderStatus } from '@/types/domain';
import { mockOrders } from '@/utils/mockData';
import { orderApi } from '@/api/orderApi';
import type { OrderPayload } from '@/types/api';

type OrderState = {
  orders: Order[];
  activeOrderId: string | null;
  isSubmitting: boolean;
  /** Populated when placeOrder fails so callers can surface it in UI */
  submitError: string | null;
  placeOrder: (payload: OrderPayload) => Promise<Order>;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  setActiveOrder: (orderId: string | null) => void;
  clearSubmitError: () => void;
};

export const useOrderStore = create<OrderState>((set) => ({
  orders: mockOrders,
  activeOrderId: mockOrders[0]?.id ?? null,
  isSubmitting: false,
  submitError: null,

  placeOrder: async (payload) => {
    set({ isSubmitting: true, submitError: null });
    try {
      const apiRes = await orderApi.submitOrder(payload);
      const order: Order = {
        id: apiRes.data.orderId,
        shopId: String(payload.shop_id),
        customerName: '',
        customerPhone: '',
        items: payload.items.map((i) => ({
          productId: i.product_id,
          quantity: i.quantity,
        })),
        address: String(payload.address_id),
        paymentMethod: payload.payment_method,
        status: 'pending',
        eta: apiRes.data.estimated_delivery ?? '30 mins',
        createdAtLabel: dayjs().format('D MMM, h:mm A'),
        deliveryOtp: apiRes.data.delivery_otp,
        total: 0,
        notes: payload.notes,
      };

      set((state) => ({
        orders: [order, ...state.orders],
        activeOrderId: order.id,
        isSubmitting: false,
      }));

      return order;
    } catch (err: unknown) {
      const message =
        (err as { message?: string }).message ?? 'Failed to place order';
      set({ isSubmitting: false, submitError: message });
      throw err;
    }
  },

  updateStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    })),

  setActiveOrder: (activeOrderId) => set({ activeOrderId }),

  clearSubmitError: () => set({ submitError: null }),
}));
