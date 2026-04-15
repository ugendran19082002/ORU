/**
 * Fleet store — manages the shop owner's delivery agents.
 * Separated from shopStore so shop discovery and fleet management
 * don't mix concerns.
 */
import { create } from 'zustand';
import type { DeliveryAgent } from '@/types/domain';
import { apiClient } from '@/api/client';

type FleetState = {
  agents: DeliveryAgent[];
  isFetching: boolean;
  addAgent: (payload: { name: string; phone: string }) => void;
  removeAgent: (id: string) => void;
  setAgentStatus: (id: string, status: DeliveryAgent['status']) => void;
  fetchAgents: () => Promise<void>;
};

export const useFleetStore = create<FleetState>((set) => ({
  agents: [],
  isFetching: false,

  addAgent: (payload) =>
    set((state) => ({
      agents: [
        ...state.agents,
        {
          id: `da_${Date.now()}`,
          name: payload.name,
          phone: payload.phone,
          status: 'offline',
          assignedOrders: 0,
        },
      ],
    })),

  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
    })),

  setAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, status } : a,
      ),
    })),

  fetchAgents: async () => {
    set({ isFetching: true });
    try {
      const res = await apiClient.get('/delivery/persons');
      const list: any[] = res.data?.data ?? res.data ?? [];
      const agents: DeliveryAgent[] = list.map((dp: any) => ({
        id: String(dp.id),
        name: dp.user?.name ?? `Agent ${dp.id}`,
        phone: dp.user?.phone ?? '',
        status: dp.is_on_duty ? 'active' : 'offline',
        assignedOrders: 0,
      }));
      set({ agents, isFetching: false });
    } catch {
      set({ isFetching: false });
    }
  },
}));
