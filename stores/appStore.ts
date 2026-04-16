import { create } from 'zustand';
import type { NotificationItem, RewardSummary, SubscriptionPlan } from '@/types/domain';
import { notificationApi, loyaltyApi } from '@/api/engagementApi';
import { platformSubscriptionApi } from '@/api/platformSubscriptionApi';
import { log } from '@/utils/logger';

type AppState = {
  notifications: NotificationItem[];
  unreadCount: number;
  subscriptions: SubscriptionPlan[];
  rewards: RewardSummary;
  isLoadingNotifications: boolean;
  markNotificationRead: (id: string) => void;
  toggleSubscription: (id: string) => void;
  pauseSubscription: (id: string) => void;
  resumeSubscription: (id: string) => void;
  cancelSubscription: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
};

const DEFAULT_REWARDS: RewardSummary = {
  referralCode: '—',
  tier: 'Silver',
  points: 0,
  vouchers: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  subscriptions: [],
  rewards: DEFAULT_REWARDS,
  isLoadingNotifications: false,

  markNotificationRead: (id) => {
    notificationApi.markRead(id).catch(() => {});
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

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

  fetchNotifications: async () => {
    set({ isLoadingNotifications: true });
    try {
      const result = await notificationApi.getNotifications({ limit: 50 });
      const mapped: NotificationItem[] = (result.data ?? []).map((n: any) => ({
        id: String(n.id),
        type: (['order', 'payment', 'alert', 'promo'].includes(n.type) ? n.type : 'alert') as NotificationItem['type'],
        title: n.title,
        body: n.body,
        read: n.is_read,
        timestamp: n.created_at,
      }));
      set({ notifications: mapped, unreadCount: result.unread_count ?? 0, isLoadingNotifications: false });
    } catch (err) {
      log.error('[appStore] fetchNotifications failed:', err);
      set({ isLoadingNotifications: false });
    }
  },

  fetchRewards: async () => {
    try {
      const ledger = await loyaltyApi.getLedger({ limit: 1 });
      set((state) => ({
        rewards: {
          ...state.rewards,
          points: ledger.total_points ?? 0,
        },
      }));
    } catch (err) {
      log.error('[appStore] fetchRewards failed:', err);
    }
  },

  fetchSubscriptions: async () => {
    try {
      const sub = await platformSubscriptionApi.getMySubscription().catch(() => null);
      if (!sub) return;
      const plan = sub.plan;
      if (!plan) return;
      const mapped: SubscriptionPlan = {
        id: String(sub.id),
        name: plan.name,
        cadence: sub.billing_cycle === 'yearly' ? 'monthly' : sub.billing_cycle as any,
        quantity: 1,
        price: sub.amount_paid,
        perks: [],
        active: sub.status === 'active',
        paused: sub.status === 'paused',
        cancelled: sub.status === 'cancelled',
      };
      set({ subscriptions: [mapped] });
    } catch (err) {
      log.error('[appStore] fetchSubscriptions failed:', err);
    }
  },
}));
