import { create } from 'zustand';

import type { DeliveryTask } from '@/types/domain';
import { mockDeliveryTasks } from '@/utils/mockData';

type DeliveryState = {
  tasks: DeliveryTask[];
  online: boolean;
  currentTaskId: string | null;
  toggleOnline: () => void;
  assignCurrentTask: (id: string | null) => void;
};

export const useDeliveryStore = create<DeliveryState>((set) => ({
  tasks: mockDeliveryTasks,
  online: true,
  currentTaskId: mockDeliveryTasks[0]?.id ?? null,
  toggleOnline: () => set((state) => ({ online: !state.online })),
  assignCurrentTask: (currentTaskId) => set({ currentTaskId }),
}));
