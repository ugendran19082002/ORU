import { create } from 'zustand';

import type { NotificationItem, RewardSummary, SubscriptionPlan } from '@/types/domain';
import { mockNotifications, mockRewards, mockSubscriptions } from '@/utils/mockData';

type AppState = {
  notifications: NotificationItem[];
  subscriptions: SubscriptionPlan[];
  rewards: RewardSummary;
  markNotificationRead: (id: string) => void;
  toggleSubscription: (id: string) => void;  // legacy: keeps active flag
  pauseSubscription: (id: string) => void;   // P1: pause (vacation mode)
  resumeSubscription: (id: string) => void;  // P1: resume from pause
  cancelSubscription: (id: string) => void;  // P1: hard cancel
};

export const useAppStore = create<AppState>((set) => ({
  notifications: mockNotifications,
  subscriptions: mockSubscriptions,
  rewards: mockRewards,
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      ),
    })),
  toggleSubscription: (id) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((plan) =>
        plan.id === id ? { ...plan, active: !plan.active } : plan
      ),
    })),
  pauseSubscription: (id) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((plan) =>
        plan.id === id ? { ...plan, active: false, paused: true } : plan
      ),
    })),
  resumeSubscription: (id) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((plan) =>
        plan.id === id ? { ...plan, active: true, paused: false } : plan
      ),
    })),
  cancelSubscription: (id) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((plan) =>
        plan.id === id ? { ...plan, active: false, paused: false, cancelled: true } : plan
      ),
    })),
}));
