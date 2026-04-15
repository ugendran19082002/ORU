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
  bank_name?: string | null;
  bank_branch?: string | null;
  account_holder_name?: string | null;
  upi_id?: string | null;
};

export type ShopSettings = {
  delivery_radius_km: number;
  min_order_value: number;
  delivery_fee: number;
  auto_accept_orders: boolean;
  busy_mode: boolean;
};

export type ShopToggleResult = {
  is_open: boolean;
  updated_at: string;
};

export type BusyModeResult = {
  busy_mode: boolean;
  updated_at: string;
};

// ─── Order API response shapes ────────────────────────────────────────────────

export type OrderPayload = {
  shop_id: number;
  items: Array<{ product_id: string; quantity: number }>;
  address_id: number;
  payment_method: 'upi' | 'cod';
  slot_id?: number;
  notes?: string;
  coupon_code?: string;
};

export type OrderSubmitResult = {
  orderId: string;
  status: 'pending';
  estimated_delivery: string;
  delivery_otp: string;
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
}>;

export type ShopSettingsPayload = Partial<ShopSettings>;

export type GrowthSettingsPayload = Partial<GrowthSettings>;

export type LoyaltyLevelPayload = Omit<LoyaltyLevel, 'id'>;

/** Payload for creating a coupon — all fields except auto-generated ones are optional */
export type CreateCouponPayload = Partial<Omit<PlatformCoupon, 'id' | 'uses_count'>> & {
  code: string;
  discount_value: number;
};
