/**
 * Fleet store — manages the shop owner's delivery agents.
 */
import { create } from 'zustand';
import type { DeliveryAgent } from '@/types/domain';
import { apiClient } from '@/api/client';
import { log } from '@/utils/logger';

type FleetState = {
  agents: DeliveryAgent[];
  isFetching: boolean;
  addAgent: (payload: { name: string; phone: string }) => Promise<void>;
  removeAgent: (id: string) => Promise<void>;
  setAgentStatus: (id: string, status: DeliveryAgent['status']) => Promise<void>;
  fetchAgents: () => Promise<void>;
};

export const useFleetStore = create<FleetState>((set, get) => ({
  agents: [],
  isFetching: false,

  addAgent: async (payload) => {
    try {
      const res = await apiClient.post('/shop-owner/fleet', payload);
      if (res.data.status === 1) {
        const dp = res.data.data;
        const newAgent: DeliveryAgent = {
          id: String(dp.id),
          name: dp.User?.name || payload.name,
          phone: dp.User?.phone || payload.phone,
          status: dp.status === 'active' ? 'active' : 'offline',
          assignedOrders: 0,
        };
        set((state) => ({ agents: [...state.agents, newAgent] }));
      }
    } catch (err) {
      log.error('[FleetStore] addAgent failed:', err);
      throw err;
    }
  },

  removeAgent: async (id) => {
    try {
      // For this implementation, removal might be a status update or a hard delete
      // We'll follow the pattern of updating status to 'deleted' or similar if API supports it,
      // or just filter locally if it's a hard delete.
      await apiClient.patch(`/shop-owner/fleet/${id}`, { status: 'inactive' });
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
      }));
    } catch (err) {
      log.error('[FleetStore] removeAgent failed:', err);
    }
  },

  setAgentStatus: async (id, status) => {
    try {
      await apiClient.patch(`/shop-owner/fleet/${id}`, { status: status === 'active' ? 'active' : 'inactive' });
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === id ? { ...a, status } : a,
        ),
      }));
    } catch (err) {
      log.error('[FleetStore] setAgentStatus failed:', err);
    }
  },

  fetchAgents: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });
    try {
      const res = await apiClient.get('/shop-owner/fleet');
      const list: any[] = res.data?.data ?? [];
      const agents: DeliveryAgent[] = list.map((dp: any) => ({
        id: String(dp.id),
        name: dp.User?.name ?? `Agent ${dp.id}`,
        phone: dp.User?.phone ?? '',
        status: dp.status === 'active' ? 'active' : 'offline',
        assignedOrders: 0,
      }));
      set({ agents, isFetching: false });
    } catch (err) {
      log.error('[FleetStore] fetchAgents failed:', err);
      set({ isFetching: false });
    }
  },
}));
