import { create } from 'zustand';

import type { NotificationItem, RewardSummary, SubscriptionPlan } from '@/types/domain';
import { mockNotifications, mockRewards, mockSubscriptions } from '@/utils/mockData';

type AppState = {
  notifications: NotificationItem[];
  subscriptions: SubscriptionPlan[];
  rewards: RewardSummary;
  markNotificationRead: (id: string) => void;
  toggleSubscription: (id: string) => void;
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
}));
