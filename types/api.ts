/**
 * Shared API response envelopes and domain-level response types.
 * All API modules should use these instead of `any`.
 */

// ─── Generic envelope ────────────────────────────────────────────────────────

/** Standard backend envelope: { status: 1, message: '...', data: T } */
export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

/** Paginated list wrapper used by list endpoints */
export type PaginatedData<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
};

// ─── Admin API response shapes ────────────────────────────────────────────────

export type AdminShop = {
  id: number;
  uuid: string;
  name: string;
  phone?: string;
  shop_type?: string;
  status: string;
  delivery_radius_km?: string;
  gstin?: string | null;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
  is_verified?: boolean;
  admin_notes?: string | null;
  city?: string | null;
  created_at: string;
  onboarding_status?: string | null;
  owner?: {
    name: string;
    phone: string;
    email: string | null;
  };
};

export type ShopApprovalResult = {
  shop_id: number;
  status: 'approved' | 'rejected';
  approved_at?: string;
  rejected_at?: string;
  admin_notes?: string | null;
};

export type OnboardingStepReviewResult = {
  step_id: number;
  shop_id: number;
  status: 'completed' | 'rejected';
  reviewed_at: string;
};

export type GrowthSettings = {
  loyalty_enabled: boolean;
  referral_enabled: boolean;
  points_per_order: number;
  referral_bonus_points: number;
  referral_referred_bonus: number;
};

export type LoyaltyLevel = {
  id: number;
  name: string;
  min_points: number;
  discount_percent: number;
  perks: string[];
};

export type PlatformCoupon = {
  id: number;
  code: string;
  /** Coupon category (e.g. 'promo', 'referral', 'seasonal') */
  type?: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  min_order_value: number;
  max_uses: number;
  uses_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
};

export type OnboardingStep = {
  id: number;
  step_key: string;
  title: string;
  status: 'pending' | 'submitted' | 'completed' | 'rejected';
  document_urls?: string[];
  admin_notes?: string | null;
};

// ─── Shop API response shapes ─────────────────────────────────────────────────

export type ShopProfileRaw = {
  id: number;
  name: string;
  phone: string;
  shop_type: string;
  city: string | null;
  latitude: string;
  longitude: string;
  delivery_radius_km: string;
  gstin: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  status: 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'active';
  is_open: boolean;
  busy_mode: boolean;
  avg_rating: string;
  min_price: string;
  distance_km: string;
  onboarding_status: string;
  admin_notes: string | null;
  // Extended profile fields (returned by /shop-owner/shops/me)
  owner_name?: string;
  fssai_no?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  pan_no?: string | null;
  aadhar_no?: string | null;
  alternate_phone?: string | null;
  email?: string | null;
  email_verified?: boolean;
  bank_name?: string | null;
  bank_branch?: string | null;
  account_holder_name?: string | null;
  upi_id?: string | null;
  Products?: any[];
};

export type ShopSettings = {
  delivery_radius_km: number;
  min_order_amount: number;
  base_delivery_charge: number;
  auto_accept_orders: boolean;
  busy_mode: boolean;
  delivery_charge_per_km: number;
  free_delivery_upto_km: number;
  delivery_limit_per_km: number;
  floor_charge_per_floor: number;
  free_delivery_upto_floor: number;
  invoice_prefix?: string;
  enable_instant_delivery?: boolean;
  allow_cod?: boolean;
};

export type ShopToggleResult = {
  is_open: boolean;
  is_manual_open: boolean;
  busy_mode: boolean;
  schedule_open: boolean;
  effective_open: boolean;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
};

export type BusyModeResult = {
  busy_mode: boolean;
  is_open: boolean;
};

export type ShopOpenStatus = ShopToggleResult & { is_holiday: boolean };

// ─── Order API response shapes ────────────────────────────────────────────────

export type OrderPayload = {
  shop_id?: number;
  items: Array<{ product_id: string; quantity: number }>;
  address_id: number;
  payment_method: 'upi' | 'cod';
  slot_id?: number;
  notes?: string;
  coupon_code?: string;
  use_loyalty_points?: boolean;
  distance_km?: number;
  delivery_type?: 'instant' | 'scheduled';
  scheduled_for?: string | null;
};

export type OrderSubmitResult = {
  orderId: string;
  status: 'pending' | 'placed' | 'unpaid';
  estimated_delivery?: string;
  delivery_otp?: string;
  razorpay_order_id?: string;
  amount?: number;
  currency?: string;
  razorpay_key?: string;
};

export type AvailableSlot = {
  id: number;
  date?: string;
  start_time: string;
  end_time: string;
  /** true when slot capacity is exhausted */
  is_full: boolean;
  /** Human-readable display label e.g. "9:00 AM – 11:00 AM" */
  label: string;
};

export type SlotStatus = 'available' | 'full' | 'closed' | 'out_of_range';

/** Shape returned by GET /slots */
export type SlotsData = {
  slots: AvailableSlot[];
  status: SlotStatus | null;
};

// ─── Update payload types used in shop/user APIs ─────────────────────────────

export type ShopUpdatePayload = Partial<{
  name: string;
  phone: string;
  city: string;
  delivery_radius_km: number;
  gstin: string;
  bank_account_no: string;
  bank_ifsc: string;
  owner_name: string;
  fssai_no: string;
  address_line1: string;
  address_line2: string;
  pan_no: string;
  aadhar_no: string;
  alternate_phone: string;
  email: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  upi_id: string;
  latitude: number;
  longitude: number;
}>;

export type ShopSettingsPayload = Partial<ShopSettings>;

export type GrowthSettingsPayload = Partial<GrowthSettings>;

export type LoyaltyLevelPayload = Omit<LoyaltyLevel, 'id'>;

/** Payload for creating a coupon — all fields except auto-generated ones are optional */
export type CreateCouponPayload = Partial<Omit<PlatformCoupon, 'id' | 'uses_count'>> & {
  code: string;
  discount_value: number;
};

// ─── Payout API types ─────────────────────────────────────────────────────────

export type ShopWallet = {
  id: number;
  shop_id: number;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_paid_out: number;
  total_commission: number;
  payout_mode: 'instant' | 'scheduled';
  payout_cycle: 'daily' | 'weekly' | 'monthly';
  bank_account_verified: boolean;
  razorpay_fund_account_id: string | null;
  last_payout_at: string | null;
};

export type PayoutLog = {
  id: number;
  type: 'credit' | 'debit' | 'refund_debit' | 'commission';
  amount: number;
  commission_amount: number;
  net_amount: number;
  balance_after: number;
  order_id: number | null;
  payout_status: 'pending' | 'processing' | 'paid' | 'failed' | null;
  description: string | null;
  failed_reason: string | null;
  scheduled_for: string | null;
  processed_at: string | null;
  created_at: string;
};

// ─── Platform Subscription API types ─────────────────────────────────────────

export type PlatformPlan = {
  id: number;
  name: string;
  slug: string;
  category: 'customer' | 'shop';
  price_monthly: number;
  price_yearly: number | null;
  // Customer Benefits
  free_delivery_count: number;
  auto_discount_pct: number;
  monthly_coupon_count: number;
  monthly_coupon_value: number;
  loyalty_boost_pct: number;
  // Shop Benefits
  commission_rate: number | null;
  is_priority_listing: boolean;
  is_active: boolean;
  role?: string;
  description: string | null;
};

export type PlatformSubscription = {
  id: number;
  plan_id: number;
  status: 'active' | 'expired' | 'cancelled' | 'paused' | 'grace_period' | 'pending_payment';
  billing_cycle: 'monthly' | 'yearly';
  amount_paid: number;
  auto_renew: boolean;
  started_at: string;
  expires_at: string;
  next_billing_at: string | null;
  free_deliveries_used: number;
  coupons_issued_this_cycle: number;
  plan?: PlatformPlan;
};

export type CheckoutBenefits = {
  has_subscription: boolean;
  plan_name?: string;
  free_delivery: boolean;
  auto_discount_pct: number;
  loyalty_boost_pct: number;
};

// ─── Feature API types ────────────────────────────────────────────────────────

export type FeatureMap = Record<string, boolean>;

// ─── Complaint API types ──────────────────────────────────────────────────────

export type Complaint = {
  id: number;
  order_id: number;
  customer_id: number;
  shop_id: number;
  type: string;
  issue_type: string | null;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'normal' | 'urgent';
  is_sos: boolean;
  admin_action: 'pending_review' | 'approved' | 'rejected' | 'escalated' | null;
  admin_notes: string | null;
  resolution_type: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string | null;
  Order?: { order_number: string; status: string; total_amount: number };
  Shop?: { id: number; name: string };
};

// ─── Analytics API types ──────────────────────────────────────────────────────

export type ShopAnalytics = {
  period: string;
  orders: {
    total: number;
    delivered: number;
    cancelled: number;
    avg_order_value: number;
  };
  revenue: {
    gross: number;
    net: number;
    commission: number;
  };
  daily_revenue: Array<{ date: string; revenue: number; orders: number }>;
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_qty: number;
    revenue: number;
  }>;
  delivery: {
    avg_delivery_time_mins: number;
    on_time_rate: number;
  };
  rating: {
    avg: number;
    count: number;
  };
  peak_hours: Array<{ hour: number; orders: number }>;
};

export type AdminDashboard = {
  period: string;
  orders: {
    total: number;
    delivered: number;
    cancelled: number;
    total_revenue: number;
  };
  users: {
    total: number;
    new_this_period: number;
  };
  shops: {
    total: number;
    active: number;
    pending: number;
  };
  top_shops: Array<{
    shop_id: number;
    shop_name: string;
    total_orders: number;
    revenue: number;
  }>;
  complaints: {
    total: number;
    open: number;
    sos: number;
  };
  refunds: {
    total: number;
    total_amount: number;
  };
};
