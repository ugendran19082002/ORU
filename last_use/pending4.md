# PROMPT 4 — Subscription System, Referral Engine, Admin Control & Coupon Management

## Context
Reuse existing architecture, components, and APIs wherever possible.
Extend or modify only when necessary. Annotate all new additions inline.

**Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo) | Razorpay
**Rules:** Migration-only schema changes | Idempotent payment handling | No duplicate indexes

---

## 1. SUBSCRIPTION SYSTEM

**Plan:** ₹99/month

**Benefits applied automatically:**
| Benefit | Detail |
|---|---|
| Free delivery | Up to 99 deliveries/month |
| Auto discount | 2% off every order |
| Monthly coupons | 3 coupons × ₹20 OFF each, added to user wallet on renewal |
| Loyalty boost | +10% extra points on every order |

**Subscription states:** `INACTIVE → ACTIVE → EXPIRED → CANCELLED`

**Benefit application logic:**
- At checkout: check if user has active subscription
- Apply free delivery if delivery count for month < 99
- Apply 2% discount before other discounts
- Coupons issued to user wallet on subscription activation and each renewal
- Loyalty boost applied when calculating points after delivery

---

## 2. AUTO-RENEWAL LOGIC

```
On subscription expiry date (every 30 days):
  → IF auto_renew = ON:
      → Trigger Razorpay recurring/auto-debit charge
      → If payment SUCCESS: renew for 30 days, reset monthly benefits
      → If payment FAILED: notify user, set status to PAYMENT_FAILED, grace period (e.g., 3 days)
  → IF auto_renew = OFF:
      → Set status to EXPIRED on expiry date
      → Remove active benefits
      → Notify user to renew manually
```

**Implementation notes:**
- Use Razorpay Subscriptions API or e-mandate for auto-debit
- Store: subscription_id, razorpay_subscription_id, status, current_period_start, current_period_end, auto_renew flag
- Webhook handler for payment events (subscription.charged, subscription.halted, subscription.cancelled)
- Idempotency: check subscription period before renewing to prevent double-charge

---

## 3. REFERRAL SYSTEM

### 3.1 Customer → Customer Referral

```
User A shares referral code
  → User B signs up using User A's code
  → On B's signup:
      → User A: +20 points
      → User B: +20 points (welcome bonus)
  → On B's first completed order:
      → User A: +30 points
```

**Validation rules:**
- Self-referral blocked (same phone/device fingerprint)
- Referral code single-use per new user
- Points awarded only after order is DELIVERED (not just placed)

### 3.2 Customer → Shop Referral

```
User A refers a shop owner (shares referral link)
  → Shop registers using referral code
  → On shop APPROVED by admin:
      → User A: +50 points
  → After shop's first 5 completed orders:
      → User A: +100 points
```

**Tracking:**
- Store referral records: referrer_id, referred_id, referral_type (CUSTOMER | SHOP), status, reward_stage
- Reward stages: SIGNED_UP | FIRST_ORDER | SHOP_APPROVED | SHOP_5_ORDERS
- Points credited only when trigger event is confirmed

---

## 4. ADMIN CONTROL PANEL

**Shop management:**
- View all shops (pending, active, suspended)
- Approve or reject shop onboarding with reason
- Suspend active shops
- View shop metrics: order count, ratings, complaints

**Complaint management:**
- View all open complaints with proof attachments
- APPROVE → trigger replacement or refund flow
- REJECT → close with reason, notify customer

**Feedback management:**
- View negative feedback (rating < 3) queue
- APPROVE → flag for action (warning to shop/delivery person)
- REJECT → dismiss, mark reviewed

---

## 5. COUPON MANAGEMENT

**Admin coupon controls:**
- Create coupons: code, type (FLAT | PERCENT), value, min_order_value, max_discount_cap
- Set expiry date and total usage limit
- Set per-user usage limit
- Assign coupons to: all users | specific users | subscription users | referral rewards

**Coupon validation at checkout:**
```
Check: active + not expired + usage < limit + per-user usage < limit + order meets min_order
  → Valid: apply discount, increment usage counter
  → Invalid: return specific error message (expired / limit reached / min order not met)
```

**Coupon types:**
- Global (any user, any shop)
- Shop-specific (only for orders from a specific shop)
- Subscription (auto-issued to subscribers monthly)
- Referral (issued as referral reward)

---

## 6. PRODUCT CATEGORY MANAGEMENT (ADMIN)

**Admin controls:**
- Create and manage categories (e.g., Water Cans, Beverages, Groceries)
- Create subcategories under categories
- Assign category to products (shops select from admin-defined categories)

**Shop controls:**
- Add products under assigned category
- Set price and stock per product

**Category hierarchy:** Category → SubCategory → Product

---

## 7. SUBSCRIPTION DISCOUNT INTERACTION WITH OTHER DISCOUNTS

**Priority order at checkout:**
1. Subscription free delivery (apply first, remove delivery charge)
2. Subscription 2% auto discount
3. Loyalty level discount (Section 12 in Prompt 3)
4. Coupon discount

**Max total discount cap:** Configurable globally (e.g., never exceed 25% of order value)

---

## 8. EDGE CASES

| Scenario | Handling |
|---|---|
| Subscription payment fails on renewal | Grace period → notify user → expire if not resolved |
| Referral user cancels first order before delivery | Points NOT awarded until order DELIVERED |
| Same user tries multiple referral codes | Only first valid code accepted |
| Coupon applied then order cancelled | Usage counter decremented on cancellation |
| Subscription purchased but benefits not applied | Auto-fix on next checkout; log discrepancy |
