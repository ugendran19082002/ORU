import { create } from 'zustand';

import type { DeliveryTask } from '@/types/domain';
import { apiClient } from '@/api/client';

const mapOrderStatus = (s: string) => {
  if (s === 'dispatched') return 'picked';
  if (s === 'delivered') return 'delivered';
  if (s === 'cancelled' || s === 'failed') return 'cancelled';
  return 'accepted';
};

type DeliveryState = {
  tasks: DeliveryTask[];
  online: boolean;
  currentTaskId: string | null;
  isFetching: boolean;
  toggleOnline: () => void;
  assignCurrentTask: (id: string | null) => void;
  updateTaskStatus: (taskId: string, status: any) => void;
  removeTask: (taskId: string) => void;
  fetchTasks: () => Promise<void>;
};

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  tasks: [],
  online: true,
  currentTaskId: null,
  isFetching: false,
  toggleOnline: () => set((state) => ({ online: !state.online })),
  assignCurrentTask: (currentTaskId) => set({ currentTaskId }),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      currentTaskId: state.currentTaskId === taskId ? null : state.currentTaskId,
    })),
  fetchTasks: async () => {
    set({ isFetching: true });
    try {
      const res = await apiClient.get('/shop-owner/orders', {
        params: { status: 'accepted,preparing,dispatched' },
      });
      const orders: any[] = res.data?.data ?? res.data ?? [];
      const tasks: DeliveryTask[] = orders.map((o: any) => ({
        id: String(o.order_number || o.id),
        orderId: String(o.id),
        customerName: o.User?.name ?? 'Customer',
        customerPhone: o.User?.phone,
        address: o.Address?.address_line1 ?? o.Address?.address ?? 'N/A',
        priority: o.is_emergency ? 'Urgent' : 'Normal',
        status: mapOrderStatus(o.status) as DeliveryTask['status'],
        paymentPending: o.payment_method === 'cod' && o.payment_status === 'pending',
        distance: o.distance_km ? `${parseFloat(o.distance_km).toFixed(1)} km` : '—',
        eta: '—',
        cans: (o.OrderItems ?? []).reduce((sum: number, i: any) => sum + i.quantity, 0),
        amount: `₹${parseFloat(o.total_amount || 0).toFixed(0)}`,
        lat: parseFloat(o.Address?.latitude ?? '0') || 0,
        lng: parseFloat(o.Address?.longitude ?? '0') || 0,
      }));
      const currentTaskId = get().currentTaskId;
      set({
        tasks,
        isFetching: false,
        currentTaskId: currentTaskId === null && tasks.length > 0 ? tasks[0].id : currentTaskId,
      });
    } catch {
      set({ isFetching: false });
    }
  },
}));
