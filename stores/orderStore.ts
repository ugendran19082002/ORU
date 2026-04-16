import { create } from 'zustand';
import dayjs from 'dayjs';

import type { Order, OrderStatus } from '@/types/domain';
import { orderApi } from '@/api/orderApi';
import type { OrderPayload, OrderSubmitResult } from '@/types/api';
import { log } from '@/utils/logger';

type OrderState = {
  orders: Order[];
  activeOrderId: string | null;
  isSubmitting: boolean;
  isFetching: boolean;
  /** Populated when placeOrder fails so callers can surface it in UI */
  submitError: string | null;
  placeOrder: (payload: OrderPayload) => Promise<OrderSubmitResult>;
  fetchOrders: (params?: { status?: string }) => Promise<void>;
  updateStatus: (orderId: string, status: OrderStatus) => void;
  assignDelivery: (orderId: string, agentId: number) => Promise<void>;
  setActiveOrder: (orderId: string | null) => void;
  clearSubmitError: () => void;
};

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  activeOrderId: null,
  isSubmitting: false,
  isFetching: false,
  submitError: null,

  fetchOrders: async (params) => {
    set({ isFetching: true });
    try {
      const mapStatus = (s: string): OrderStatus => {
        const map: Record<string, OrderStatus> = {
          placed: 'pending', accepted: 'accepted', preparing: 'accepted',
          dispatched: 'picked', delivered: 'delivered', completed: 'completed',
          cancelled: 'cancelled', failed: 'cancelled', assigned: 'assigned',
        };
        return map[s] ?? 'pending';
      };

      const result = await orderApi.getMyOrders(params);
      const mapped: Order[] = (result.data ?? []).map((o: any) => ({
        id: String(o.order_number || o.id),
        shopId: String(o.shop_id),
        shopName: o.Shop?.name,
        customerName: o.User?.name ?? '',
        customerPhone: o.User?.phone ?? '',
        items: (o.OrderItems ?? []).map((i: any) => ({ productId: String(i.product_id), quantity: i.quantity })),
        address: o.Address?.address_line1 ?? '',
        paymentMethod: (o.payment_method === 'cod' ? 'cod' : 'upi') as 'cod' | 'upi',
        status: mapStatus(o.status),
        eta: '—',
        createdAtLabel: dayjs(o.created_at).format('D MMM, h:mm A'),
        deliveryOtp: o.delivery_otp ?? '—',
        total: parseFloat(String(o.total_amount)) || 0,
        notes: o.delivery_notes,
      }));

      set({ orders: mapped, isFetching: false });
    } catch {
      set({ isFetching: false });
    }
  },

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
        deliveryOtp: apiRes.data.delivery_otp ?? '—',
        total: 0,
        notes: payload.notes,
      };

      set((state) => ({
        orders: [order, ...state.orders],
        activeOrderId: order.id,
        isSubmitting: false,
      }));

      return apiRes.data;
    } catch (err: unknown) {
      const message =
        (err as { message?: string }).message ?? 'Failed to place order';
      set({ isSubmitting: false, submitError: message });
      throw err;
    }
  },

  updateStatus: async (orderId, status, reason?: string) => {
    try {
      const apiStatusMap: Record<string, string> = {
        pending: 'placed', accepted: 'accepted', picked: 'dispatched',
        delivered: 'delivered', completed: 'completed', cancelled: 'cancelled'
      };
      await orderApi.updateStatus(orderId, apiStatusMap[status] || status);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      }));
    } catch (err) {
      log.error('[orderStore] updateStatus failed:', err);
    }
  },

  assignDelivery: async (orderId: string, agentId: number) => {
    try {
      await orderApi.assignDelivery(orderId, agentId);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, status: 'assigned' } : order,
        ),
      }));
    } catch (err) {
      log.error('[orderStore] assignDelivery failed:', err);
      throw err;
    }
  },

  setActiveOrder: (activeOrderId) => set({ activeOrderId }),

  clearSubmitError: () => set({ submitError: null }),
}));
