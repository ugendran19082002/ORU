import type { AppRole } from '@/types/session';

export type Product = {
  id: string;
  name: string;
  unitLabel: string;
  description: string;
  price: number;
  inStock: boolean;
  stockCount: number;
  image: 'water_can_1' | 'water_can_2' | 'water_can_3';
};

export type Shop = {
  id: string;
  name: string;
  area: string;
  rating: number;
  distanceKm: number;
  eta: string;
  isOpen: boolean;
  tags: string[];
  verified: boolean;
  pricePerCan: number;
  accent: string;
  heroImage: Product['image'];
  products: Product[];
};

export type CartItem = {
  shopId: string;
  productId: string;
  quantity: number;
};

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type Order = {
  id: string;
  shopId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  address: string;
  paymentMethod: 'upi' | 'cod' | 'wallet';
  status: OrderStatus;
  eta: string;
  createdAtLabel: string;
  deliveryOtp: string;
  total: number;
  notes?: string;
  deliveryAgentName?: string;
};

export type NotificationItem = {
  id: string;
  type: 'order' | 'payment' | 'alert' | 'promo';
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  quantity: number;
  price: number;
  perks: string[];
  active: boolean;
};

export type RewardSummary = {
  referralCode: string;
  tier: 'Silver' | 'Gold' | 'Plus';
  points: number;
  vouchers: number;
};

export type DeliveryTask = {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  priority: 'Normal' | 'Urgent';
  paymentPending: boolean;
};

export type AppRoleOption = {
  id: AppRole;
  label: string;
};
