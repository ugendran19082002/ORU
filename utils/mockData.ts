export type UserRole = 'customer' | 'shop' | 'delivery' | 'admin';

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'upi' | 'cod' | 'wallet';
export type DeliveryType = 'instant' | 'scheduled';

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string;
  note: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface ShopInventoryItem {
  id: string;
  name: string;
  volume: string;
  price: number;
  stock: number;
  description?: string;
}

export interface OrderLineItem {
  itemId: string;
  name: string;
  volume: string;
  quantity: number;
  pricePerUnit: number;
}

export interface Shop {
  id: string;
  name: string;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
  description: string;
  status: 'open' | 'busy' | 'closed';
  tags: string[];
  phone: string;
  area: string;
  certifications: string[];
  latitude: number;
  longitude: number;
  inventory: ShopInventoryItem[];
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  title: string;
  subtitle: string;
  amount: number;
  createdAt: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
}

export interface RatingReview {
  stars: number;
  comment: string;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  customerName: string;
  addressId: string;
  items: OrderLineItem[];
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  scheduledFor?: string;
  notes: string;
  status: OrderStatus;
  etaLabel: string;
  createdAt: string;
  cancelReason?: string;
  otp: string;
  deliveryPartner?: DeliveryPartner;
  ratingReview?: RatingReview;
}

export interface ShopCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  tag: 'VIP' | 'Regular' | 'New';
}

export const deliveryPartner: DeliveryPartner = {
  id: 'del-1',
  name: 'Raju Kumar',
  phone: '+91 98765 43210',
  vehicle: 'TVS XL',
  rating: 4.8,
};

export const mockUser = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul@thannigo.app',
};

export const mockAddresses: Address[] = [
  {
    id: 'addr-home',
    label: 'Home',
    line1: 'Flat 402, Ocean Breeze Residency',
    line2: 'Koramangala, Bengaluru',
    note: 'Ring bell twice, gate code 1144',
    latitude: 12.9352,
    longitude: 77.6245,
    isDefault: true,
  },
  {
    id: 'addr-office',
    label: 'Office',
    line1: '5th Floor, Tech Square',
    line2: 'HSR Layout, Bengaluru',
    note: 'Security desk at lobby',
    latitude: 12.9133,
    longitude: 77.6401,
    isDefault: false,
  },
];

export const mockShops: Shop[] = [
  {
    id: 'shop-1',
    name: 'Blue Spring Aquatics',
    rating: 4.8,
    distanceKm: 1.4,
    etaMinutes: 18,
    description: 'Low-TDS drinking water with reusable 20L can exchange.',
    status: 'open',
    tags: ['Open now', 'BIS certified', 'Fast delivery'],
    phone: '+91 98765 44321',
    area: 'Koramangala',
    certifications: ['BIS Certified', 'FSSAI Listed', 'Reusable Can Exchange'],
    latitude: 12.9346,
    longitude: 77.6268,
    inventory: [
      {
        id: 'inv-1',
        name: 'Mineral Water Can',
        volume: '20L',
        price: 45,
        stock: 24,
        description: 'Everyday drinking water can with same-hour refill support.',
      },
      {
        id: 'inv-2',
        name: 'Family Pack',
        volume: '10L',
        price: 28,
        stock: 0,
        description: 'Compact refill pack for apartments and office pantries.',
      },
    ],
  },
  {
    id: 'shop-2',
    name: 'Aqua Pure Hub',
    rating: 4.6,
    distanceKm: 2.1,
    etaMinutes: 24,
    description: 'RO + UV water cans with same-day scheduled delivery slots.',
    status: 'closed',
    tags: ['Closed now', 'Schedule later', 'Wallet offers'],
    phone: '+91 98765 55432',
    area: 'HSR Layout',
    certifications: ['RO + UV', 'Quality Checked'],
    latitude: 12.9304,
    longitude: 77.6188,
    inventory: [
      {
        id: 'inv-3',
        name: 'Mineral Water Can',
        volume: '20L',
        price: 48,
        stock: 8,
        description: 'RO purified cans intended for scheduled neighborhood drops.',
      },
      {
        id: 'inv-4',
        name: 'Copper Water Can',
        volume: '20L',
        price: 56,
        stock: 2,
        description: 'Premium copper-conditioned cans with limited same-day stock.',
      },
    ],
  },
  {
    id: 'shop-3',
    name: 'Crystal Flow Water',
    rating: 4.9,
    distanceKm: 2.8,
    etaMinutes: 30,
    description: 'Premium alkaline water and bulk office delivery plans.',
    status: 'open',
    tags: ['Top rated', 'Subscriptions'],
    phone: '+91 98765 66543',
    area: 'Indiranagar',
    certifications: ['Alkaline', 'Premium Source', 'Office Plans'],
    latitude: 12.9394,
    longitude: 77.6328,
    inventory: [
      {
        id: 'inv-5',
        name: 'Alkaline Water Can',
        volume: '20L',
        price: 54,
        stock: 14,
        description: 'High-demand alkaline cans for homes and small offices.',
      },
      {
        id: 'inv-6',
        name: 'Purified Water',
        volume: '5L',
        price: 20,
        stock: 40,
        description: 'Smaller format bottles for guests, events, and reception desks.',
      },
    ],
  },
];

export const mockWalletTransactions: WalletTransaction[] = [
  {
    id: 'txn-1',
    type: 'debit',
    title: 'Order THN-1041',
    subtitle: 'Blue Spring Aquatics via UPI',
    amount: 110,
    createdAt: 'Today, 10:40 AM',
  },
  {
    id: 'txn-2',
    type: 'credit',
    title: 'Wallet Top-up',
    subtitle: 'Added from GPay',
    amount: 500,
    createdAt: 'Yesterday, 7:30 PM',
  },
  {
    id: 'txn-3',
    type: 'debit',
    title: 'Order THN-1034',
    subtitle: 'Crystal Flow Water via wallet',
    amount: 98,
    createdAt: 'Apr 7, 9:10 AM',
  },
];

export const mockOrders: Order[] = [
  {
    id: 'THN-1041',
    shopId: 'shop-1',
    shopName: 'Blue Spring Aquatics',
    customerName: mockUser.name,
    addressId: 'addr-home',
    items: [
      {
        itemId: 'inv-1',
        name: 'Mineral Water Can',
        volume: '20L',
        quantity: 2,
        pricePerUnit: 45,
      },
    ],
    itemName: 'Mineral Water Can',
    quantity: 2,
    pricePerUnit: 45,
    deliveryFee: 20,
    total: 110,
    paymentMethod: 'upi',
    deliveryType: 'instant',
    notes: 'Call on arrival',
    status: 'out_for_delivery',
    etaLabel: 'Arriving in 8 mins',
    createdAt: 'Today, 10:32 AM',
    otp: '483921',
    deliveryPartner,
  },
  {
    id: 'THN-1034',
    shopId: 'shop-3',
    shopName: 'Crystal Flow Water',
    customerName: mockUser.name,
    addressId: 'addr-office',
    items: [
      {
        itemId: 'inv-5',
        name: 'Alkaline Water Can',
        volume: '20L',
        quantity: 1,
        pricePerUnit: 54,
      },
    ],
    itemName: 'Alkaline Water Can',
    quantity: 1,
    pricePerUnit: 54,
    deliveryFee: 20,
    total: 74,
    paymentMethod: 'wallet',
    deliveryType: 'scheduled',
    scheduledFor: 'Tomorrow, 7:00 AM - 8:00 AM',
    notes: 'Leave at reception',
    status: 'delivered',
    etaLabel: 'Delivered',
    createdAt: 'Apr 7, 8:05 AM',
    otp: '512274',
    deliveryPartner,
    ratingReview: {
      stars: 5,
      comment: 'On time and neatly handled.',
    },
  },
  {
    id: 'THN-1028',
    shopId: 'shop-2',
    shopName: 'Aqua Pure Hub',
    customerName: mockUser.name,
    addressId: 'addr-home',
    items: [
      {
        itemId: 'inv-3',
        name: 'Mineral Water Can',
        volume: '20L',
        quantity: 3,
        pricePerUnit: 48,
      },
    ],
    itemName: 'Mineral Water Can',
    quantity: 3,
    pricePerUnit: 48,
    deliveryFee: 25,
    total: 169,
    paymentMethod: 'cod',
    deliveryType: 'instant',
    notes: 'Bring change for cash payment',
    status: 'cancelled',
    etaLabel: 'Cancelled',
    createdAt: 'Apr 5, 5:45 PM',
    otp: '880223',
    cancelReason: 'Shop capacity full',
  },
];

export const mockShopCustomers: ShopCustomer[] = [
  {
    id: 'cust-1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    address: 'Ocean Breeze Residency, Koramangala',
    totalOrders: 18,
    totalSpent: 2180,
    tag: 'VIP',
  },
  {
    id: 'cust-2',
    name: 'Meera Nair',
    phone: '+91 99887 77665',
    address: 'HSR Layout, Sector 2',
    totalOrders: 6,
    totalSpent: 690,
    tag: 'Regular',
  },
  {
    id: 'cust-3',
    name: 'Rohan Menon',
    phone: '+91 91234 44455',
    address: 'Indiranagar 100 Ft Road',
    totalOrders: 2,
    totalSpent: 220,
    tag: 'New',
  },
];
