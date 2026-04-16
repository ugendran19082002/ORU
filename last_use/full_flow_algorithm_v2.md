# 📱 Full Application Flow Algorithm — v3

> **Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo) | Razorpay | BullMQ
> **Updated from:** v2 + Subscription Category Logic + Full Ecosystem Audit
> **Delivery Model:** Shop-owned delivery only (no platform delivery person)

---

## 1. 🚀 App Entry & Authentication

```
START
  │
  ▼
[Download App]
  │
  ▼
[Enter Mobile Number]
  │
  ▼
[OTP Verify]
  │  (Rate-limited endpoint | JWT issued with role on success)
  ▼
[Check Existing User?]
  ├── YES (existing user) ──► [Home Screen]
  ├── NO  (new user)      ──► [Role Choose]
  └── ADMIN               ──► [Admin Panel]
```

**Security rules:**

- JWT payload includes role; validated server-side on every protected request
- Never trust client-supplied role claims
- OTP endpoint: rate-limited, max 3 retries before cooldown
- All role transitions logged: user_id | from_role | to_role | timestamp | reason | approved_by

---

## 2. 👤 Role Selection

```
[Role Choose]
  ├──► [Shop Owner]
  ├──► [Customer]
  └──► [Delivery Person]  ← shop-linked only (added/managed by shop owner)
```

**Role switch logic:**

- Role switch requires admin approval + reason log
- On role change: previous role data erased
- Unauthorized switch attempts blocked and flagged
- Users who arrive without knowing their role → shown "role switch" screen → redirected to role selection

**Onboarding state machine (both roles):**

```
PENDING → IN_PROGRESS → COMPLETED
                      ↘ REJECTED (reason message sent to user)
```

---

## 3. 🏪 Shop Owner Flow

### 3a. New Shop — Onboarding

```
[Shop Owner: New]
  │
  ▼
[Onboarding IN_PROGRESS]
  │
  │  Required fields:
  │    • Shop name, owner name, mobile, email
  │    • Address (GPS picker + manual fallback)
  │    • GPS location
  │    • Shop type, brand (optional), experience
  │    • UPI ID (optional) + bank account + IFSC
  │    • ID proof / shop photo (optional KYC upload)
  │    • Delivery config (self-delivery only — see Section 3e)
  │    • Products: category, item type (20L/10L), price, stock
  │
  ▼
[Submit → Status: PENDING_APPROVAL]
  │
  ▼
[Admin Reviews]
  ├── APPROVED ──► [Shop Dashboard UNLOCKED] ──► [Home]
  └── REJECTED ──► [Reason sent] ──► [Back to IN_PROGRESS for re-submission]
```

### 3b. Returning / Old Shop

```
[Shop Owner: Existing]
  │
  ▼
[Dashboard]
  ├──► [Order Management]       — Section 3c
  ├──► [Delivery Management]    — Section 3e  ← SHOP-OWNED ONLY
  ├──► [Product Management]     — Section 3f
  ├──► [Shop Settings]          — Section 3g
  ├──► [Staff Management]       — Section 3h
  ├──► [Payout & Financials]    — Section 3i
  ├──► [Analytics Dashboard]    — Section 3j
  └──► [Shop Subscription]      — Section 3k  ← SHOP SUBSCRIPTION (Features only)
```

### 3c. Order Management

```
[New Order Arrives]
  │  (push notification + in-app alert)
  ▼
[Shop: Accept or Reject?]
  │  Timeout: configurable (e.g., 5 min) → auto-reject if no response
  │
  ├── REJECT (with reason)
  │     └──► Customer notified → reassignment to next eligible shop
  │          (max reassignment retries: configurable)
  │          If all retries exhausted → cancel order + trigger refund
  │
  └── ACCEPT
        │
        ▼
      [Assign to Delivery Person]  ← from shop's own staff roster
        │  Auto-assign: nearest available → highest rated → least recently assigned
        │  Manual-assign: shop owner picks specific person
        │
        ▼
      [Delivery Flow]  — Section 4d
```

**Order status lifecycle:**

```
PENDING → ACCEPTED → ASSIGNED → PICKED → OUT_FOR_DELIVERY → DELIVERED
       ↘ REJECTED
       ↘ CANCELLED
```

Every transition: log actor | timestamp | reason (if rejection/cancel)
Audit log is append-only — no updates, no deletes.

### 3d. Shop Auto-Status & Hours

```
[Business Hours Config]
  ├── Per-day schedule (Mon–Sun): open_time, close_time
  ├── Break times (e.g., lunch 2–3 PM): orders blocked during break
  └── Holiday dates: specific dates with optional message

[Status Machine]
  OPEN ──► CLOSED (auto, outside working hours)
       ──► PAUSED (manual: maintenance)
  CLOSED ──► OPEN (auto-reopen on next scheduled slot)

[Customer Impact]
  CLOSED / PAUSED shops: shown with badge or hidden from listing
  Ordering blocked at API level (not just UI)
```

### 3e. 🚚 Shop Delivery Management (Shop-Owned Only)

> **No platform delivery person. All delivery is managed by the shop.**

#### Delivery Person Roster

```
[Shop Owner manages delivery staff]
  │
  ├── Add Delivery Person
  │     Fields: Name | Phone | Vehicle type | Availability status
  │     Status: ACTIVE | OFF_DUTY | BUSY
  │
  ├── Edit Delivery Person details
  │
  └── Deactivate Delivery Person
```

#### Delivery Assignment Flow

```
[Order ACCEPTED by shop]
  │
  ▼
[Assignment Mode?]
  │
  ├── AUTO-ASSIGN
  │     Priority: nearest available → highest rated → least recently assigned
  │     → Push notification to assigned delivery person
  │     → If delivery person rejects or times out:
  │           → Reassign to next available (max N retries, configurable)
  │           → If all retries fail: escalate to shop owner (manual assign)
  │
  └── MANUAL-ASSIGN
        → Shop owner selects specific delivery person from roster
        → Push notification sent to selected person
```

#### Delivery Person — App Flow

```
[Delivery Person receives assignment notification]
  │
  ▼
[Accept Assignment]
  │
  ▼
[Pickup from Shop]
  │  Status → PICKED
  ▼
[Live GPS tracking starts]
  │  Location pushed every N seconds (configurable)
  │  Stored in location_logs: order_id | lat | lng | timestamp
  ▼
[Out for Delivery]
  │  Status → OUT_FOR_DELIVERY
  ▼
[Delivered to Customer]
  │  Status → DELIVERED
  │  Upload proof image + timestamp
  │
  └── If customer not reachable:
        → Mark DELIVERY_ATTEMPTED
        → Log with proof + timestamp
        → Notify shop + admin
```

#### Delivery Charge Configuration (per shop)

```
[Delivery Charge Mode — shop selects one]
  ├── FIXED: flat charge regardless of distance (e.g., ₹20 always)
  │
  ├── DISTANCE-BASED: tiered by km range
  │     e.g., 0–3 km → ₹20 | 3–6 km → ₹40 | 6+ km → ₹60
  │
  └── FLOOR-BASED: tiered by order value
        e.g., order < ₹100 → ₹30 delivery | order ≥ ₹100 → Free

[Surge Pricing — optional]
  ├── Enable for configurable peak time windows (e.g., 6–8 PM)
  └── Surge add-on: fixed amount (e.g., +₹10 during peak)
```

#### Delivery Area / Service Zone

```
[Shop configures service zone]
  ├── Delivery radius (km)
  ├── Allowed pincodes / zones (whitelist)
  └── Restricted areas (blacklist override)

[On order placement: API validates]
  └── User address pincode within shop's allowed zones?
        ├── YES → proceed
        └── NO  → "Delivery not available in your area" error
```

#### Delivery Slot Management

```
[Shop configures delivery slots]
  ├── Time windows with capacity limit per slot
  ├── Same-day / instant delivery toggle
  └── Delivery availability schedule (separate from shop working hours)

[Customer selects slot at checkout]
  └── API validates slot capacity before confirming order
```

### 3f. Product Management

```
[Products]
  ├── Add Product
  │     Fields: name | price | quantity | unit (20L/10L) | category | images
  │
  ├── Edit Product (price, stock, details)
  │
  └── Delete Product (soft delete)

[Stock State Machine]
  IN_STOCK → LOW_STOCK → OUT_OF_STOCK
  │
  ├── Inventory alert: notify when stock < N units (configurable threshold)
  └── OUT_OF_STOCK: auto-hidden from customer listing (configurable toggle)

[Stock changes logged: timestamp + actor]
```

### 3g. Shop Settings

```
[Shop Settings Sections]
  │
  ├── Profile: name | owner | mobile (OTP re-verify) | email (OTP re-verify) | images | KYC docs
  │
  ├── Delivery Settings (→ Section 3e)
  │
  ├── Order Settings
  │     ├── Auto-accept toggle (ON → orders confirm without manual approval)
  │     ├── Order preparation time (shown as ETA to customer)
  │     └── Response timeout (configurable, e.g., 5 min)
  │
  ├── Payment Settings
  │     ├── COD: enable / disable
  │     ├── UPI / Online (Razorpay): enable / disable
  │     └── Bank account + IFSC (changes trigger re-verification)
  │
  ├── Coupon Settings (shop-level coupons)
  │     ├── Create: type (FLAT/PERCENT) | min order | max cap | expiry | usage limit
  │     └── View: Active | Expired | Exhausted
  │
  ├── Tax & Billing
  │     ├── GST number + verification status
  │     ├── Tax percentage on product subtotal
  │     └── Auto-generate invoice PDF on order DELIVERED
  │
  ├── Cancellation Policy
  │     ├── Cancellation allowed until: ACCEPTED or PICKED (cutoff configurable)
  │     └── Refund % per stage (cannot exceed system defaults)
  │
  ├── Service Area & Pincodes (→ Section 3e)
  │
  ├── Notification Settings
  │     └── Toggle per type: new order | cancel | payment | low stock | payout | complaint (view)
  │         Channels: Push | SMS | WhatsApp
  │
  └── Fraud & Abuse Control (Shop-level only)
        ├── Block specific users from ordering at this shop
        └── Flag repeated COD no-show users → auto-block COD for that user

[All settings changes audit-logged: actor | field | old value | new value | timestamp]
```

 

### 3i. Payout & Financials

```
[Shop Wallet]
  On each DELIVERED order:
    → Credit: (order_amount - platform_commission) to shop_wallet
    → Platform commission: configurable % per shop or global default
    → If shop has ACTIVE subscription: reduced commission rate applied

[Payout Modes]
  │
  ├── INSTANT PAYOUT (manual trigger by shop owner)
  │     → Validate: minimum payout threshold met
  │     → Call Razorpay Payout API (Razorpay X)
  │     → Deduct platform fee
  │     → Store in payout_logs: payout_id | razorpay_payout_id | amount | fee | status | timestamp
  │     → Webhook: payout.processed / payout.failed → update payout_logs
  │
  └── SCHEDULED PAYOUT (cron: daily or weekly, configurable per shop)
        → Aggregate pending earnings since last settlement
        → Create single batch payout for total
        → Deduct platform commission
        → Trigger Razorpay Payout API
        → Update settlement_logs: period_start | period_end | amount | commission | status

[Read-only view for shop owner]
  Total earnings | Pending settlement | Commission deducted | Payout history
```

### 3j. Shop Analytics Dashboard (Read-only)

```
Metrics:
  ├── Total orders (today / week / month)
  ├── Total revenue
  ├── Top products
  ├── Avg delivery time
  ├── Ratings breakdown
  └── Complaint rate (Read-only)

Export: CSV download (date range selectable)
Note: Analytics access is a SHOP SUBSCRIPTION feature (see Section 3k)
```

### 3k. 🏪 Shop Subscription (Features Only)

> **Shop subscription = feature unlock system. No coupons, discounts, or loyalty.**
> **Current status: First plan is FREE. Future plans will be paid.**

#### Plan Benefits

| Feature          | Detail                                     |
| ---------------- | ------------------------------------------ |
| Priority listing | Shop shown above non-subscribed shops      |
| Instant delivery | Option to offer same-slot instant delivery |
| Lower commission | Reduced platform commission percentage     |
| Analytics access | Full analytics dashboard unlocked          |

#### Shop Subscription State Machine

```
INACTIVE → PENDING_PAYMENT → ACTIVE → PAYMENT_FAILED → (grace) → EXPIRED
                                    → CANCELLED
```

#### Feature Resolution Logic

```javascript
if (shop.subscription_status === "ACTIVE") {
  shop.features = {
    priorityListing: true,
    instantDelivery: true,
    lowCommission: true,
    analyticsAccess: true,
  };
}
```

#### DB Schema (shop_subscriptions)

```sql
id                        BIGINT UNSIGNED PK
shop_id                   BIGINT UNSIGNED FK → shops.id
plan_id                   INT UNSIGNED FK → subscription_plans.id
subscription_type         ENUM('SHOP','CUSTOMER') DEFAULT 'SHOP'
status                    ENUM('INACTIVE','PENDING_PAYMENT','ACTIVE',
                               'PAYMENT_FAILED','EXPIRED','CANCELLED')
razorpay_subscription_id  VARCHAR(100) UNIQUE NULL
start_date                DATE
end_date                  DATE
next_renewal_at           DATE NULL
auto_renew                BOOLEAN DEFAULT TRUE
cancelled_at              DATETIME NULL
cancel_reason             VARCHAR(255) NULL
created_at                DATETIME
updated_at                DATETIME
```

---

## 4. 🧑 Customer Role Flow

### 4a. Customer Onboarding

```
[Customer: New]
  │
  ▼
[Onboarding IN_PROGRESS]
  │  Required: Name | Mobile | Email
  │  Optional: UPI ID | Face ID / fingerprint | Saved addresses
  │
  ▼
[Profile completeness score shown]
  │
  ▼
[COMPLETED] ──► [Home]

[Multiple addresses supported]
  ├── Labels: Home | Work | Family | Custom
  ├── One marked as default
  └── Address selector at checkout (can differ from default)
```

### 4b. Customer — Shop Discovery & Browsing

```
[Home Screen opens]
  │
  ▼
[Auto-detect GPS location]
  │  If location denied → prompt + manual city/pincode entry fallback
  ▼
[Show nearest 3–5 shops (quick cards)]
  │
  ▼
[View Modes — toggle]
  ├── LIST VIEW (default): shop cards — name | distance | rating | delivery time | charge | open badge
  ├── MAP VIEW: full-screen map with clustered shop pins
  └── SPLIT VIEW: map top | list bottom

[Priority ordering in list]
  1. Featured shops (admin-flagged)
  2. SHOP SUBSCRIPTION: priority-listed shops (subscribed shops rank higher)
  3. Previously ordered shops (personalized)
  4. Nearest open shops
  5. Closed shops (bottom, greyed out, reopen time shown)

[Search]
  ├── By: shop name | product name | area / pincode / landmark
  ├── Auto-suggestions | recent searches (last 5) | popular searches
  └── Debounce: 300ms

[Filters — quick chips]
  Open Now | Free Delivery | Fast Delivery | High Rated | Nearest | Offers Available

[Advanced Filters — bottom sheet]
  ├── Delivery time range
  ├── Max delivery charge (slider)
  ├── Min rating
  ├── Shop category / type
  └── Distance range (slider)

[Sort Options]
  Nearest (default) | Fastest delivery | Lowest charge | Highest rating | Most popular

[Edge states]
  ├── No shops nearby → "Expand search area" button
  ├── All shops closed → show reopen times
  ├── Network error → Retry button
  └── No search results → clear search suggestion
```

### 4c. Customer — Order Creation Flow

```
[Browse products] ──► [Add to cart + quantity]
  │
  ▼
[View Cart Summary]
  │
  ▼
[Validation before checkout]
  ├── Shop is open and within delivery hours
  ├── Items in stock
  ├── Delivery slot available
  └── Address within shop service radius
  │
  ▼
[Apply Coupon?] ──► validate → show discount
  │
  ▼
[Loyalty Discount auto-applied based on level]
  │
  ▼
[Subscription Discount auto-applied if active]
  │
  ▼
[Discount Priority Order at Checkout]
  1. Subscription free delivery (remove delivery charge if free_deliveries_remaining > 0)
  2. Subscription 2% auto discount (on post-coupon subtotal)
  3. Loyalty level discount (same-shop orders only)
  4. Coupon discount
  [Max total discount cap enforced — configurable globally]
  │
  ▼
[Add Extra Tip? (optional, customer-defined amount)]
  │
  ▼
[Select Delivery Slot]
  │  If shop has ACTIVE subscription + instant delivery enabled → "Instant" slot shown
  ▼
[Choose / Confirm Address]
  │
  ▼
[Choose Payment Method]
  ├── COD
  └── UPI / Online (Razorpay)
  │
  ▼
[Review Itemized Order Summary]
  subtotal + delivery charge + tax − discounts + tip = TOTAL
  │
  ▼
[Confirm & Place Order]
```

**Checkout discount stacking (detailed):**

```
orderSubtotal
  - coupon_discount            (applied first)
  - subscription_discount      (2% on post-coupon subtotal)
  - loyalty_discount           (level-based, same-shop only)
  ─────────────────────────
  = finalSubtotal
  + deliveryCharge             (0 if sub free delivery consumed, else shop's configured charge)
  + tax
  ─────────────────────────
  = grandTotal

[Max total discount cap enforced by admin setting — checked before confirming order]
```

### 4d. Payment Flow

```
[COD Path]
  Order confirmed immediately → Status: PENDING

[UPI / Razorpay Path]
  POST /api/orders/initiate
    → Backend creates Razorpay order → stored in payment_logs (status: CREATED)
    → Returns razorpay_order_id to frontend
    → Frontend opens Razorpay SDK
    → User completes payment
    → Frontend receives: razorpay_payment_id | razorpay_order_id | razorpay_signature
  POST /api/payments/verify
    → Backend: HMAC signature verification
    → VALID   → update payment_log: PAID → confirm order
    → INVALID → reject + log tamper attempt
    → Retry: max 3 attempts, then cancel order

[Webhook handler — async]
  payment.captured → confirm order if not already confirmed
  payment.failed   → mark FAILED, notify user
  [All webhook events: verify signature + idempotency check before processing]
```

### 4e. Order Tracking (Customer View)

```
[Order Placed → Shop Responds]
  │
  ├── REJECTED (with reason)
  │     └── Customer: find another shop or cancel
  │
  └── ACCEPTED
        │
        ▼
      [Delivery Person Assigned by Shop]
        Customer sees: delivery person name | masked phone | ETA
        │
        ▼
      [Live Tracking Map]
        Customer subscribes to: order:{order_id}:location channel
        Status bar: ✅ Confirmed → 🏪 Preparing → 🛵 Picked Up → 🚚 Out for Delivery → ✅ Delivered
        │
        ├── If delivery person goes offline → "Location unavailable" + last known position
        ├── If ETA exceeded → notify customer + admin
        │
        ▼
      [DELIVERED]
        Delivery person uploads proof image → viewable by customer
        │
        ▼
      [Feedback prompt triggered]  — Section 4g
```

### 4f. Address Lock Logic

```
[Address editing]
  PENDING / ACCEPTED  → editable ✅
  PICKED / beyond     → LOCKED ❌ (API returns 400 with reason)
```

### 4g. Feedback & Complaint Flow

```
[After DELIVERED — auto-prompted]
  │
  ▼
[Customer rates: 1–5 stars + optional comment]
  │
  ├── Rating ≥ 3 → stored as positive feedback → done
  │
  └── Rating < 3 → auto-routed to complaint flow
        │
        ▼
      [Select complaint type]
        • Late delivery ⏱️
        • Bad quality 💧
        • Damage / Leak 🧯
        • Extra money asked 💰
        • Wrong item 📦
        │
        ▼
      [Attach proof (image/video) + remarks]
        │
        ▼
      [Submit → enters Admin review queue]
        │
        ▼
      [Admin: APPROVE or REJECT]
        ├── APPROVE
        │     ├── Trigger replacement order (linked via replacement_for_order_id)
        │     └── OR initiate refund → Razorpay refund API
        │
        └── REJECT
              ├── Show rejection reason to customer
              ├── Mark complaint CLOSED
              └── Customer can escalate once (optional)
```

### 4h. Cancellation & Refund Logic

| Order Stage                              | Refund % | Notes          |
| ---------------------------------------- | -------- | -------------- |
| Before pickup (PENDING / ACCEPTED)       | 100%     | Full refund    |
| After pickup (PICKED / OUT_FOR_DELIVERY) | 50%      | Partial refund |
| After delivery attempt                   | 0%       | No refund      |

```
[Razorpay Refund Flow]
  POST /api/refunds/initiate
    → Calculate refund amount based on stage
    → Call Razorpay refund API
    → Store: refund_id | razorpay_refund_id | amount | status in refund_logs
    → Webhook: refund.processed → update refund_logs to COMPLETED

[COD Abuse Prevention]
  Track cancel count per user
  After N cancellations (configurable): block COD → require online payment
  User notified with reason
```

### 4i. Reorder System

```
[Order History] ──► [Reorder button on past order card]
  │
  ▼
[Pre-fill cart: same items + same shop]
  │
  ▼
[Re-validate: stock | slot | shop open]
  │
  ├── All valid → proceed to checkout
  │     Auto-apply: active coupons + loyalty discount + subscription benefits
  │
  └── Item unavailable → conflict screen → partial reorder option
```

### 4j. Customer Profile & Settings

```
[Customer Settings]
  ├── Profile: name | email | mobile (OTP re-verify)
  ├── Biometrics: Face ID / fingerprint toggle
  ├── Saved addresses: add | edit | delete | set default
  │     Labels: Home | Work | Family | Custom
  ├── UPI ID: add / update
  ├── Notifications: toggle per type
  ├── Security: change phone / email (OTP required)
  └── Account deletion: POST /users/me/delete-account (soft delete)
```

---

## 5. 💰 Loyalty & Points System

### 5a. Points Earning

| Trigger                        | Points               |
| ------------------------------ | -------------------- |
| Per can delivered              | +2 pts               |
| Per ₹10 spent                  | +1 pt (configurable) |
| Referral signup (User A)       | +20 pts              |
| Referral first order (User A)  | +30 pts              |
| Referred user welcome (User B) | +20 pts              |

Points credited after DELIVERED status via async queue job (not in request cycle).

**Loyalty boost (Customer Subscription):** If user has ACTIVE customer subscription, +10% extra points on every order.

```javascript
async function awardLoyaltyPoints(
  userId,
  orderId,
  orderSubtotal,
  cansDelivered,
) {
  const sub = await getUserActiveSub(userId); // status = ACTIVE only
  const boostMultiplier = sub ? 1.1 : 1.0; // +10% if subscribed

  const basePoints = cansDelivered * 2 + Math.floor(orderSubtotal / 10);
  const finalPoints = Math.floor(basePoints * boostMultiplier);

  await creditPoints(userId, orderId, finalPoints);
}
```

### 5b. Level Thresholds

| Level  | Points Range |
| ------ | ------------ |
| 1      | 0–99         |
| 2      | 100–199      |
| 3      | 200–299      |
| 6      | 500+         |
| 11     | 1050+        |
| Higher | Configurable |

### 5c. Level-Based Discounts (same-shop orders)

| Level Range | Discount      |
| ----------- | ------------- |
| 1–2         | 0%            |
| 3–5         | 2%            |
| 6–10        | 5%            |
| 11–20       | 8%            |
| 20+         | 10% (max cap) |

Points history screen: earned | redeemed | expired entries per order.

---

## 6. 🎁 Referral System

### 6a. Customer → Customer Referral

```
User A shares referral code
  → User B signs up using code
  → On signup:      User A +20 pts | User B +20 pts (welcome)
  → On B's 1st completed DELIVERED order: User A +30 pts

Validation:
  ├── Self-referral blocked (same phone / device fingerprint)
  ├── Code is single-use per new user
  └── Points only after DELIVERED (not just placed)
```

### 6b. Customer → Shop Referral

```
User A refers a shop owner (shares referral link)
  → Shop registers with referral code
  → On shop APPROVED by admin: User A +50 pts
  → After shop's first 5 DELIVERED orders: User A +100 pts

Tracking: referrer_id | referred_id | referral_type | status | reward_stage
Reward stages: SIGNED_UP | FIRST_ORDER | SHOP_APPROVED | SHOP_5_ORDERS
```

### 6c. Referral Reward Summary

| Event                        | Who Gets Points  | Amount | Stage Key     |
| ---------------------------- | ---------------- | ------ | ------------- |
| User B signs up              | User A           | +20    | SIGNED_UP     |
| User B signs up              | User B (welcome) | +20    | WELCOME       |
| User B's 1st delivered order | User A           | +30    | FIRST_ORDER   |
| Shop approved                | User A           | +50    | SHOP_APPROVED |
| Shop's 5th delivered order   | User A           | +100   | SHOP_5_ORDERS |

> All points awarded **after DELIVERED status only** — never on order placed or accepted.

---

## 7. 💳 Subscription Plans

> **Two distinct subscription types exist in the system:**

### Summary Table

| Type                  | Priority Listing | Instant Delivery | Lower Commission | Analytics | Free Delivery | Coupons | Discount | Loyalty Boost |
| --------------------- | :--------------: | :--------------: | :--------------: | :-------: | :-----------: | :-----: | :------: | :-----------: |
| SHOP subscription     |        ✅        |        ✅        |        ✅        |    ✅     |      ❌       |   ❌    |    ❌    |      ❌       |
| CUSTOMER subscription |        ❌        |        ❌        |        ❌        |    ❌     |      ✅       |   ✅    |    ✅    |      ✅       |

> **Simple rule:** Shop subscription = Grow business. Customer subscription = Save money + rewards.

---

### 7A. 🏪 Shop Subscription (Features Only)

> Covered in Section 3k. First plan is **FREE**; future plans will be paid.

---

### 7B. 👤 Customer Subscription (₹99/month)

| Feature         | Detail                                                      |
| --------------- | ----------------------------------------------------------- |
| Plan cost       | ₹99/month                                                   |
| Free delivery   | Up to 99 deliveries/month                                   |
| Auto discount   | 2% off every order subtotal                                 |
| Monthly coupons | 3 × ₹20 OFF coupons, issued to wallet on activation/renewal |
| Loyalty boost   | +10% extra points on every order                            |

**Subscription states:**

```
INACTIVE → PENDING_PAYMENT → ACTIVE → PAYMENT_FAILED → (grace 3d) → EXPIRED
                                    → PAUSED → ACTIVE
                                    → CANCELLED
```

| State           | Benefits                        | Billing                |
| --------------- | ------------------------------- | ---------------------- |
| INACTIVE        | None                            | None                   |
| PENDING_PAYMENT | None                            | Awaiting first payment |
| ACTIVE          | All active                      | Mandate running        |
| PAYMENT_FAILED  | Preserved for grace period (3d) | Retry attempted        |
| PAUSED          | Frozen                          | Frozen                 |
| EXPIRED         | Removed immediately             | Stopped                |
| CANCELLED       | Removed immediately             | Stopped                |

#### 7B-1. Activation Flow

```
POST /api/subscriptions/initiate
  │
  ├── Guard: check no existing ACTIVE sub for this user
  ├── Call Razorpay Subscriptions API → get razorpay_subscription_id
  ├── INSERT into user_subscriptions (status = PENDING_PAYMENT)
  └── Return razorpay_subscription_id → Frontend opens Razorpay SDK

Webhook: subscription.charged (first payment)
  ├── Verify HMAC signature + idempotency check
  ├── UPDATE user_subscriptions
  │     status = ACTIVE | start_date = TODAY | end_date = TODAY+30d
  │     next_renewal_at = TODAY+30d | free_deliveries_remaining = 99
  ├── Issue 3 × ₹20 coupons → user_coupons (BullMQ job)
  └── Push: "You're subscribed!"

Webhook: payment.failed (initial)
  ├── UPDATE status = INACTIVE  ← no grace on first activation
  └── Notify user to retry
```

#### 7B-2. Auto-Renewal Logic

```
Every 30 days — Razorpay auto-charges mandate:

Success path (subscription.charged):
  ├── end_date += 30d | next_renewal_at += 30d
  ├── free_deliveries_remaining = 99  ← reset
  ├── Issue 3 × ₹20 coupons (new batch, BullMQ)
  └── Push: "Subscription renewed"

Failed path (subscription.halted):
  ├── status = PAYMENT_FAILED
  ├── grace_expires_at = NOW + 3 days
  ├── Benefits PRESERVED during grace
  ├── Daily reminder push (Day 1, 2, 3)
  └── Day 3 cron:
        still unpaid? → status = EXPIRED
                      → free_deliveries_remaining = 0
                      → all benefits OFF
```

#### 7B-3. Manual Retry (during grace period)

```
POST /api/subscriptions/retry-payment
  ├── Confirm status = PAYMENT_FAILED + within grace window
  ├── Call Razorpay retry charge
  └── On success → treat same as renewal success path
```

#### 7B-4. Cancellation

```
POST /api/subscriptions/cancel
  ├── Confirm sub is ACTIVE or PAUSED
  ├── Call Razorpay cancel subscription API
  ├── status = CANCELLED | benefits removed immediately
  └── Already-issued coupons remain valid until their own expiry
        ← Do NOT revoke already-issued coupons
```

#### 7B-5. Pause Flow

```
POST /api/subscriptions/pause
  Body: { pause_start, pause_end, reason }
  ├── Validate: pause_start >= today, pause_end > pause_start
  ├── INSERT into subscription_pauses
  ├── Call Razorpay pause subscription API
  └── status = PAUSED

Resume (cron, on pause_end):
  duration = pause_end - pause_start (days)
  next_renewal_at += duration | end_date += duration
  status = ACTIVE
  Call Razorpay resume subscription API
```

#### 7B-6. Benefits Resolution at Checkout

```javascript
async function resolveSubscriptionBenefits(
  userId,
  orderSubtotal,
  deliveryCharge,
) {
  const sub = await getUserActiveSub(userId); // ACTIVE only
  if (!sub) return { deliveryOverride: null, subscriptionDiscount: 0 };

  let deliveryOverride = null;
  if (sub.free_deliveries_remaining > 0) {
    deliveryOverride = 0;
    await queue.add("decrement_free_delivery", { subscriptionId: sub.id });
  }

  const subscriptionDiscount = parseFloat((orderSubtotal * 0.02).toFixed(2));
  return { deliveryOverride, subscriptionDiscount };
}

// Graceful degradation — never crash checkout
const benefits = await getSubscriptionBenefits(userId).catch(() => ({
  deliveryOverride: null,
  subscriptionDiscount: 0,
}));
```

#### 7B-7. Customer Subscription UI States

| State           | UI                                                                                |
| --------------- | --------------------------------------------------------------------------------- |
| INACTIVE        | "Subscribe for ₹99/mo" CTA, benefits listed                                       |
| PENDING_PAYMENT | Spinner, "Processing payment…"                                                    |
| ACTIVE          | Green badge, benefits usage (X/99 deliveries), renewal date, cancel/pause buttons |
| PAYMENT_FAILED  | Red banner "Payment failed", retry button, days remaining in grace                |
| PAUSED          | Amber badge, "Paused until DD/MM", resume button                                  |
| EXPIRED         | "Subscription expired" + renew CTA                                                |
| CANCELLED       | "Subscribe again" CTA                                                             |

---

## 8. 🔧 Admin Panel Flow

```
[Admin Panel]
  │
  ├── [Shop Management]
  │     ├── View all shops: PENDING | ACTIVE | SUSPENDED
  │     ├── Approve / Reject onboarding (with reason)
  │     ├── Suspend active shops
  │     └── View shop metrics: orders | ratings | complaints
  │
  ├── [Order Monitoring]
  │     ├── All active orders
  │     ├── Force accept / force reassign
  │     └── Refunds pending queue
  │
  ├── [Coupon Management]
  │     ├── Create: code | type (FLAT/PERCENT) | value | min_order | expiry | usage_limit | per_user_limit
  │     ├── Assign: all users | specific users | subscribers | referral rewards
  │     └── Types: Global | Shop-specific | Subscription | Referral
  │
  ├── [Product Category Management]
  │     ├── Create categories & subcategories
  │     ├── Assign category → shops add products under it
  │     └── Monitor / control product listings
  │
  ├── [Complaint Management]
  │     ├── View open complaints with proof attachments
  │     ├── APPROVE → trigger replacement or refund
  │     └── REJECT  → close with reason, notify customer
  │
  ├── [Feedback Management]
  │     ├── Negative feedback queue (rating < 3)
  │     ├── APPROVE → flag shop/delivery person for action
  │     └── REJECT  → dismiss, mark reviewed
  │
  ├── [Subscription Management]
  │     ├── View active CUSTOMER subscriptions
  │     ├── View active SHOP subscriptions
  │     ├── Auto-renew logic oversight (Razorpay webhook monitoring)
  │     └── First shop subscription plan is FREE — admin manages plan activation
  │
  ├── [Delivery Monitoring]
  │     ├── All active delivery tracking map
  │     ├── Reassign delivery if escalated
  │     └── Override decisions (force assign)
  │
  ├── [User Management]
  │     ├── Role change approvals
  │     ├── Ban/Suspend user toggles (PATCH /users/:id/status)
  │     ├── Platform-level COD block after abuse
  │     └── Flagged accounts review
  │
  └── [System Settings]
        ├── Retry limits | timeout durations | refund rules
        ├── Platform commission percentage (default + per-shop overrides)
        ├── Max total discount cap
        └── COD cancellation limit threshold
```

---

## 9. 🆘 SOS Feature

```
[SOS Button — available in Home / main navigation]
  │
  ▼
[Emergency alert triggered]
  └── Delivery safety use case | escalated to admin
```

---

## 10. ⚙️ Async Queue Architecture (BullMQ)

All heavy operations run as queue jobs — never block the main request thread.

| Job                           | Trigger                                   |
| ----------------------------- | ----------------------------------------- |
| send_push_notification        | Order status change                       |
| award_loyalty_points          | Order DELIVERED                           |
| process_refund                | Cancellation confirmed                    |
| schedule_payout               | Cron trigger (daily/weekly)               |
| reassign_order                | Shop reject / timeout                     |
| send_sms_otp                  | Auth flow                                 |
| webhook_event_process         | Razorpay webhook received                 |
| issue_subscription_coupons    | Customer sub activation / renewal success |
| decrement_free_delivery       | Order placed with sub free delivery       |
| subscription_renewal_reminder | Cron: 3d before next_renewal_at           |
| subscription_grace_check      | Cron: daily — PAYMENT_FAILED past grace   |
| subscription_pause_resume     | Cron: daily — check pause_end reached     |
| award_referral_points         | Order DELIVERED / shop approved           |

**Job rules:** Idempotent | Exponential backoff retry (max 3–5) | Dead-letter queue for unrecoverable failures | All executions logged with outcome.

---

## 11. 🗄️ Database & API Standards

### Schema Rules

- All changes via Sequelize migrations only: `createTable` | `addColumn` | `addIndex`
- Never call `sync({ force: true })` or `alter: true` in production
- Foreign key constraints enforced at DB level
- Soft deletes (`deleted_at`) on: users | shops | products | orders | delivery persons
- Audit log tables: append-only, no UPDATE or DELETE ever
- Financial records (payments, refunds, payouts): never soft-deleted, status-update only

### Key DB Tables

#### user_subscriptions

```sql
id                        BIGINT UNSIGNED PK
user_id                   BIGINT UNSIGNED FK → users.id
plan_id                   INT UNSIGNED FK → subscription_plans.id
subscription_type         ENUM('CUSTOMER') DEFAULT 'CUSTOMER'
status                    ENUM('INACTIVE','PENDING_PAYMENT','ACTIVE',
                               'PAYMENT_FAILED','PAUSED','EXPIRED','CANCELLED')
razorpay_subscription_id  VARCHAR(100) UNIQUE
start_date                DATE
end_date                  DATE
next_renewal_at           DATE
auto_renew                BOOLEAN DEFAULT TRUE
free_deliveries_remaining SMALLINT DEFAULT 0
grace_expires_at          DATETIME NULL
cancelled_at              DATETIME NULL
cancel_reason             VARCHAR(255) NULL
created_at                DATETIME
updated_at                DATETIME
```

#### subscription_plans

```sql
id                    INT UNSIGNED PK
name                  VARCHAR(100)
subscription_type     ENUM('SHOP','CUSTOMER')
price                 DECIMAL(8,2)             -- 0.00 for free plans
billing_cycle         INT DEFAULT 30           -- days
-- CUSTOMER-only fields
free_delivery_limit   INT DEFAULT 99
discount_pct          DECIMAL(4,2) DEFAULT 2.00
loyalty_boost_pct     DECIMAL(4,2) DEFAULT 10.00
monthly_coupon_count  INT DEFAULT 3
monthly_coupon_value  DECIMAL(8,2) DEFAULT 20.00
-- SHOP-only fields
priority_listing      BOOLEAN DEFAULT FALSE
instant_delivery      BOOLEAN DEFAULT FALSE
low_commission        BOOLEAN DEFAULT FALSE
analytics_access      BOOLEAN DEFAULT FALSE
commission_rate_pct   DECIMAL(4,2) DEFAULT NULL  -- NULL = use global default
is_active             BOOLEAN DEFAULT TRUE
created_at            DATETIME
updated_at            DATETIME
```

#### subscription_payments

```sql
id                      BIGINT UNSIGNED PK
subscription_id         BIGINT UNSIGNED FK → user_subscriptions.id
razorpay_payment_id     VARCHAR(100) UNIQUE
amount                  DECIMAL(8,2)
currency                VARCHAR(5) DEFAULT 'INR'
status                  ENUM('CREATED','PAID','FAILED','REFUNDED')
billing_period_start    DATE
billing_period_end      DATE
paid_at                 DATETIME NULL
created_at              DATETIME
```

#### subscription_pauses

```sql
id              BIGINT UNSIGNED PK
subscription_id BIGINT UNSIGNED FK → user_subscriptions.id
pause_start     DATE
pause_end       DATE
reason          VARCHAR(100) NULL
created_by      BIGINT UNSIGNED FK → users.id NULL
created_at      DATETIME
```

#### referrals

```sql
id            BIGINT UNSIGNED PK
referrer_id   BIGINT UNSIGNED FK → users.id
referred_id   BIGINT UNSIGNED      -- user_id or shop_id depending on type
referral_type ENUM('CUSTOMER_TO_CUSTOMER','CUSTOMER_TO_SHOP')
status        ENUM('SIGNED_UP','FIRST_ORDER_COMPLETE','SHOP_APPROVED','SHOP_5_ORDERS')
referral_code VARCHAR(20)
reward_paid_signup        BOOLEAN DEFAULT FALSE
reward_paid_first_order   BOOLEAN DEFAULT FALSE
reward_paid_shop_approved BOOLEAN DEFAULT FALSE
reward_paid_shop_5orders  BOOLEAN DEFAULT FALSE
created_at    DATETIME
updated_at    DATETIME

INDEX (referrer_id)
INDEX (referral_code)
UNIQUE (referred_id, referral_type)
```

### Indexing Strategy

- Composite indexes: `(shop_id, status)` | `(user_id, created_at)` | `(delivery_person_id, status)`
- Spatial index on shops table: `(lat, lng)` — MySQL POINT column + SPATIAL INDEX
- FULLTEXT index on: shop name | product name (for search)
- No duplicate indexes — audit before adding new ones

### API Response Envelope

```json
// Success
{ "status": true, "message": "Success", "data": {} }

// Error
{ "status": false, "message": "Validation error", "errors": [] }
```

**HTTP codes:** 200 success | 201 created | 400 validation | 401 unauthorized | 403 forbidden | 404 not found | 409 conflict | 422 business logic | 500 server error

---

## 12. 📡 API Endpoints Reference

### Auth

| Method | Path                   | Auth   | Description           |
| ------ | ---------------------- | ------ | --------------------- |
| POST   | /auth/send-otp         | Public | Send OTP to mobile    |
| POST   | /auth/verify-otp       | Public | Verify OTP, issue JWT |
| GET    | /auth/me               | Any    | Current user info     |
| POST   | /auth/refresh          | Any    | Refresh JWT           |
| POST   | /auth/enable-pin       | Any    | Set PIN security      |
| POST   | /auth/enable-biometric | Any    | Enable biometric auth |

### Customer Subscriptions

| Method | Path                             | Auth     | Description                    |
| ------ | -------------------------------- | -------- | ------------------------------ |
| POST   | /subscriptions/initiate          | Customer | Create Razorpay sub + DB row   |
| POST   | /subscriptions/cancel            | Customer | Cancel active subscription     |
| POST   | /subscriptions/pause             | Customer | Pause subscription             |
| POST   | /subscriptions/resume            | Customer | Manual resume before pause_end |
| POST   | /subscriptions/retry-payment     | Customer | Retry failed payment in grace  |
| GET    | /subscriptions/status            | Customer | Current sub details + benefits |
| GET    | /subscriptions/plans             | Public   | Available plans listing        |
| GET    | /subscriptions/platform/mine     | Customer | My subscription                |
| GET    | /subscriptions/platform/benefits | Customer | Active benefits summary        |

### Shop Subscriptions

| Method | Path                              | Auth       | Description              |
| ------ | --------------------------------- | ---------- | ------------------------ |
| GET    | /shop-owner/subscription          | Shop Owner | Current shop sub status  |
| POST   | /shop-owner/subscription/activate | Shop Owner | Activate free/paid plan  |
| POST   | /shop-owner/subscription/cancel   | Shop Owner | Cancel shop subscription |

### Webhooks

| Method | Path               | Auth     | Description                                                                                     |
| ------ | ------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| POST   | /webhooks/razorpay | Internal | payment.captured, subscription.charged, subscription.halted, refund.processed, payout.processed |

### Shop Owner

| Method | Path                          | Auth       | Description                      |
| ------ | ----------------------------- | ---------- | -------------------------------- |
| GET    | /shop-owner/fleet             | Shop Owner | Delivery staff roster            |
| POST   | /shop-owner/fleet             | Shop Owner | Add delivery person              |
| PATCH  | /shop-owner/fleet/:id         | Shop Owner | Edit delivery person             |
| GET    | /staff                        | Shop Owner | Staff list                       |
| GET    | /shop-owner/complaints        | Shop Owner | Shop complaints list (Read-only) |
| GET    | /shop-owner/products          | Shop Owner | Product list                     |
| POST   | /shop-owner/products          | Shop Owner | Add product                      |
| POST   | /inventory/update             | Shop Owner | Update stock                     |
| PATCH  | /shop-owner/shops/me/settings | Shop Owner | Save shop settings               |

### Admin

| Method | Path                           | Auth  | Description        |
| ------ | ------------------------------ | ----- | ------------------ |
| GET    | /admin/users                   | Admin | All users          |
| PATCH  | /users/:id/status              | Admin | Ban/Suspend user   |
| GET    | /admin/analytics/dashboard     | Admin | Platform analytics |
| GET    | /refunds                       | Admin | Refunds list       |
| POST   | /payments/:paymentId/reconcile | Admin | Reconcile payment  |

### System

| Method | Path               | Auth   | Description                  |
| ------ | ------------------ | ------ | ---------------------------- |
| GET    | /system/distance   | Any    | Haversine/Maps distance calc |
| GET    | /system/categories | Public | Product categories           |

---

## 13. 📱 React Native Screen Map

| Screen                                              | Role            | Status              |
| --------------------------------------------------- | --------------- | ------------------- |
| Splash / Onboarding / OTP / Role Select             | All             | ✅ Dynamic          |
| Home — shop discovery (list + map + filter)         | Customer        | ✅ Dynamic          |
| Shop detail + product listing                       | Customer        | ✅ Dynamic          |
| Cart + checkout + coupon apply                      | Customer        | ✅ Dynamic          |
| Payment (Razorpay SDK / COD)                        | Customer        | ✅ Dynamic          |
| Order tracking (live map + status bar)              | Customer        | ✅ Dynamic          |
| Order history + reorder                             | Customer        | ✅ Dynamic          |
| Feedback & complaint submission                     | Customer        | ✅ Dynamic          |
| Profile & settings (addresses, UPI, notifications)  | Customer        | ✅ Dynamic          |
| Loyalty dashboard (points, level, discount preview) | Customer        | ✅ Dynamic          |
| Subscription screen (customer)                      | Customer        | ✅ Dynamic          |
| Shop dashboard                                      | Shop Owner      | ✅ Dynamic          |
| Order management (accept/reject)                    | Shop Owner      | ✅ Dynamic          |
| Delivery management (roster, assign, track)         | Shop Owner      | ⚠️ Needs wire       |
| Product management / inventory                      | Shop Owner      | ⚠️ Needs wire       |
| Shop settings (all sections)                        | Shop Owner      | ⚠️ Needs wire       |
| Shop promotions                                     | Shop Owner      | ⚠️ Needs wire       |
| Shop subscription screen                            | Shop Owner      | ⚠️ Build            |
| Staff management                                    | Shop Owner      | ⚠️ Needs wire       |
| Analytics & payout screen                           | Shop Owner      | ✅ Dynamic          |
| Delivery assignments list                           | Delivery Person | ✅ Dynamic          |
| Live tracking upload screen                         | Delivery Person | ✅ Dynamic          |
| Admin dashboard                                     | Admin           | ⚠️ Partially static |
| Admin users (ban/suspend)                           | Admin           | ⚠️ Needs wire       |
| Admin refunds + reconciliation                      | Admin           | ⚠️ Needs wire       |

**UX standards:** Skeleton loaders on all async screens | Toast/snackbar for non-blocking feedback | Retry button on network failures | Real-time order status push (WebSocket / Firebase) | Optimistic UI for cart updates | Offline handling for tracking screen.

---

## 14. 🔌 Frontend-Backend Integration Status

### ✅ Fully Connected

- Auth: `/auth/send-otp`, `/auth/verify-otp`, `/auth/me`, `/auth/refresh`, `/auth/enable-pin`, `/auth/enable-biometric`, `/users/me/security/verify`
- Customer browsing: `/shops`, `/shops/personalized`, `/shops/search`, `/shops/:id`
- Orders: `/orders` (placement, cancel, history), `/orders/slots`
- Promotions: `/promotion/coupons/validate`, `/promotion/loyalty/*`, `/promotion/referrals/*`
- Customer subscriptions: `/subscriptions/plans`, `/subscriptions/platform/benefits`, `/subscriptions/platform/mine`
- Delivery: `/delivery/upload-pod`, `/delivery/complete`, `/delivery/location`, `/delivery/history`, `/delivery/earnings`
- Engagement: `/complaints`, `/complaints/sos`, `/engagement/ratings`
- User: `/users/me`, `/users/me/addresses`
- System: `/system/categories`

### ⚠️ Backend Exists — Frontend Not Yet Wired

| Screen / Feature                         | Missing Connection                                                |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `app/shop/delivery-fleet.tsx`            | `GET/POST /shop-owner/fleet` not called — static list             |
| `app/shop/(tabs)/inventory.tsx`          | `POST /shop-owner/products` add form not connected to API         |
| `app/shop/(tabs)/settings.tsx`           | `PATCH /shop-owner/shops/me/settings` toggles not wired           |
| `app/shop/(tabs)/promotions.tsx`         | Coupon creation/list APIs not connected                           |
| Shop complaint view (Read-only)          | `GET /shop-owner/complaints` (Resolution by Admin)                |
| `app/admin/refunds.tsx`                  | `POST /payments/:paymentId/reconcile` not triggered from UI       |
| `app/admin/users.tsx`                    | `PATCH /users/:id/status` ban/suspend buttons not wired           |
| `app/admin/master.tsx` + `analytics.tsx` | Charts using static props instead of `/admin/analytics/dashboard` |
| Customer account deletion                | `POST /users/me/delete-account` button missing in settings        |

### ❌ Backend API Missing — Needs to be Built

| Feature                     | Required Endpoint                        | Notes                                        |
| --------------------------- | ---------------------------------------- | -------------------------------------------- |
| Delivery charge calculation | `GET /system/distance?shop=...&user=...` | `checkout.tsx` hardcodes 1.2 km — fix needed |
| Razorpay webhooks           | `POST /webhooks/razorpay`                | payment.captured, subscription.charged, etc. |
| Shop subscription           | `GET/POST /shop-owner/subscription`      | Full CRUD for shop plan management           |

---

## 15. 🔄 Complete Flow Summary

```
Download App
  └─► Enter Mobile Number
        └─► OTP Verify (rate-limited, JWT issued)
              └─► Check Existing User
                    │
                    ├─► EXISTING ──► Home
                    │
                    ├─► NEW ──► Role Choose
                    │             │
                    │             ├─► SHOP OWNER
                    │             │     └─► Onboarding (IN_PROGRESS)
                    │             │           └─► PENDING_APPROVAL
                    │             │                 ├─► Admin APPROVED ──► Dashboard
                    │             │                 │     ├─► Orders ──► Accept/Reject ──► Assign Delivery Person
                    │             │                 │     ├─► Delivery Management (shop-owned staff)
                    │             │                 │     ├─► Products | Settings | Staff | Payouts
                    │             │                 │     ├─► Analytics (unlocked by shop subscription)
                    │             │                 │     └─► Shop Subscription (features unlock)
                    │             │                 └─► Admin REJECTED ──► Resubmit
                    │             │
                    │             ├─► CUSTOMER
                    │             │     └─► Onboarding (name, email, address)
                    │             │           └─► Home
                    │             │                 └─► Browse Shops (list/map/filter)
                    │             │                       └─► Cart ──► Discounts ──► Slot ──► Payment
                    │             │                             └─► Track Order (live map)
                    │             │                                   └─► Delivered ──► Feedback/Complaint
                    │             │                                         └─► Loyalty Points Awarded
                    │             │                                               (+ 10% boost if subscribed)
                    │             │
                    │             └─► DELIVERY PERSON (shop-linked)
                    │                   └─► Managed by shop owner (not independent platform role)
                    │                         └─► Receives assignment ──► Pickup ──► Deliver ──► Upload proof
                    │
                    └─► ADMIN ──► Admin Panel
                                    ├─► Shop approvals | Complaint review | Feedback review
                                    ├─► Coupon & category management
                                    ├─► Subscription oversight (both SHOP + CUSTOMER)
                                    └─► System settings & monitoring
```

---

## 16. ⚠️ Edge Cases & System Behavior

| Scenario                                          | Resolution                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Payment success, order creation fails             | Auto-refund triggered via queue job                                    |
| Duplicate payment request                         | Idempotency key prevents double charge                                 |
| Shop times out on order acceptance                | Auto-reject → reassign to next eligible shop                           |
| All shop retries exhausted                        | Cancel order + full refund + notify customer                           |
| Delivery person rejects assignment                | Reassign to next available; escalate to shop owner if all retries fail |
| Delivery person goes offline mid-delivery         | Show last known location + "Location unavailable" indicator            |
| Customer not reachable on delivery                | Mark DELIVERY_ATTEMPTED + log with proof + notify shop                 |
| Referral user cancels first order before delivery | Points NOT awarded (only after DELIVERED)                              |
| Coupon applied then order cancelled               | Usage counter decremented on cancellation                              |
| Subscription payment fails on renewal             | Grace period → notify user → expire if unresolved                      |
| Address edit attempted after PICKED               | API returns 400 error                                                  |
| Payout API fails                                  | Retry via queue; notify admin if max retries hit                       |
| Duplicate order submission                        | Idempotency key prevents duplicate creation                            |
| COD abuse (N+ cancellations)                      | Auto-block COD for user; require online payment                        |
| User subscribes twice (customer)                  | Guard on initiate: 409 if ACTIVE sub exists                            |
| Webhook received twice                            | Idempotency check on razorpay_subscription_id + payment_id             |
| Coupon issue fails (BullMQ)                       | Retry; admin notified on dead-letter                                   |
| Pause requested while PAYMENT_FAILED              | Reject 422: "Resolve payment issue first"                              |
| free_deliveries_remaining goes negative           | Floor at 0; decrement job is idempotent                                |
| Referral self-referral via secondary phone        | Block on device fingerprint + flag for review                          |
| Shop referral but shop rejected                   | No points awarded; only SHOP_APPROVED triggers reward                  |
| User cancels, re-subscribes same day              | New row; new 30-day period; new coupon batch                           |
| Subscription expires mid-order                    | Benefits applied at order placement time; do not revoke mid-flow       |
| Shop sub: first plan is free, future paid         | Admin manages plan activation; pricing column in subscription_plans    |

---

_Sources: draw.io diagram + Prompts 1–7 + Subscription Category Logic + Full Ecosystem Audit_
_Delivery model: Shop-owned delivery only. Platform delivery person role removed._
_Version: v3 — Updated with dual subscription types, integration audit, and complete API reference._
