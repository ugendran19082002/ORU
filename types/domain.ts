import type { AppRole } from '@/types/session';

/** Supported product hero image keys */
export type ProductImage = 'water_can_1' | 'water_can_2' | 'water_can_3';

export type Product = {
  id: string;
  name: string;
  unitLabel: string;
  description: string;
  price: number;
  inStock: boolean;
  stockCount: number;
  image: ProductImage;
};

export type Shop = {
  id: string;
  name: string;
  area: string;
  rating: number;
  distanceKm: number;
  eta: string;
  phone: string;
  deliveryTime?: string;
  isOpen: boolean;
  isBusy: boolean;
  tags: string[];
  verified: boolean;
  pricePerCan: number;
  minOrderValue: number;
  lat: number;
  lng: number;
  accent: string;
  heroImage: ProductImage;
  products: Product[];
};

export type CartItem = {
  shopId: string;
  productId: string;
  quantity: number;
};

export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'picked'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'placed'
  | 'preparing'
  | 'dispatched'
  | 'failed';

export type Order = {
  id: string;
  shopId: string;
  shopName?: string;
  customerName: string;
  customer_name?: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  address: string;
  paymentMethod: 'upi' | 'cod';
  status: OrderStatus;
  eta: string;
  createdAtLabel: string;
  created_at?: string;
  createdAt?: string;
  deliveryOtp: string;
  total: number;
  totalAmount?: number;
  total_amount?: number;
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
  paused?: boolean;    // vacation mode
  cancelled?: boolean; // hard cancel
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
  customerPhone?: string; // for calling customer from delivery nav
  address: string;
  priority: 'Normal' | 'Urgent';
  status: OrderStatus;
  paymentPending: boolean;
  distance: string;
  eta: string;
  cans: number;
  amount: string;
  lat: number;
  lng: number;
};

export type DeliveryAgent = {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'offline';
  assignedOrders: number;
};

export type AppRoleOption = {
  id: AppRole;
  label: string;
};
