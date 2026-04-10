import { create } from 'zustand';

import type { DeliveryTask } from '@/types/domain';
import { mockDeliveryTasks } from '@/utils/mockData';

type DeliveryState = {
  tasks: DeliveryTask[];
  online: boolean;
  currentTaskId: string | null;
  toggleOnline: () => void;
  assignCurrentTask: (id: string | null) => void;
  updateTaskStatus: (taskId: string, status: any) => void;
  removeTask: (taskId: string) => void;
};

export const useDeliveryStore = create<DeliveryState>((set) => ({
  tasks: mockDeliveryTasks,
  online: true,
  currentTaskId: mockDeliveryTasks[0]?.id ?? null,
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
}));
