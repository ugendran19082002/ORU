/**
 * Fleet store — manages the shop owner's delivery agents.
 * Separated from shopStore so shop discovery and fleet management
 * don't mix concerns.
 */
import { create } from 'zustand';
import type { DeliveryAgent } from '@/types/domain';

const DEFAULT_AGENTS: DeliveryAgent[] = [
  { id: 'da_owner', name: 'Store Owner', phone: '9999999999', status: 'active', assignedOrders: 0 },
  { id: 'da_1', name: 'Ravi Kumar', phone: '9876543210', status: 'active', assignedOrders: 2 },
  { id: 'da_2', name: 'Suresh M', phone: '9123456789', status: 'offline', assignedOrders: 0 },
];

type FleetState = {
  agents: DeliveryAgent[];
  addAgent: (payload: { name: string; phone: string }) => void;
  removeAgent: (id: string) => void;
  setAgentStatus: (id: string, status: DeliveryAgent['status']) => void;
};

export const useFleetStore = create<FleetState>((set) => ({
  agents: DEFAULT_AGENTS,

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
}));
