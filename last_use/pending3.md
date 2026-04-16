# PROMPT 3 — Customer-Side App: Complete Flow Design

## Context
Reuse existing architecture, components, and APIs wherever possible.
Extend or modify only when necessary. Annotate all new additions inline.

**Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo)
**Rules:** Migration-only schema changes | Standard API envelope | Role-based access enforced

---

## 1. CUSTOMER PROFILE SETUP

**Required fields:** Name | Mobile number | Email

**Optional fields:** UPI ID | Face ID / fingerprint auth | Multiple saved addresses (label: Home, Work, Family, etc.)

**Behavior:**
- Profile completeness score shown during onboarding
- All fields updatable anytime from settings
- Multiple addresses supported; one marked as default
- Address selection at checkout (can differ from default)

---

## 2. PRODUCT & SHOP BROWSING

**Default view on app open:**
- Auto-detect user location
- Show nearest 3 shops with quick-view cards
- Option: "View more shops" loads full list with filters

**Browse modes:**
- List view (default): shop cards with name, distance, rating, delivery time, charge, open/closed badge
- Map view: pin-based with bottom sheet shop cards
- Split view: map top, list bottom

**Search:**
- By shop name | product name | area/pincode
- Auto-suggestions | recent searches | popular searches

---

## 3. ORDER CREATION FLOW

```
Browse products → Add to cart (select quantity)
  → View cart summary
  → Optional: Apply coupon (validate → show discount)
  → Optional: Add extra tip (customer-defined amount)
  → Select delivery slot (show available windows)
  → Choose address (default or alternate)
  → Choose payment: COD or UPI/Online
  → Review order summary (itemized: subtotal + delivery + tax - discount + tip)
  → Confirm & Place Order
```

**Validation before placement:**
- Shop is open and within delivery hours
- Items in stock
- Delivery slot is available
- Address within shop service radius

---

## 4. ORDER PROCESSING & SHOP RESPONSE

```
Order placed → Sent to assigned shop
  → Shop: ACCEPT or REJECT (with timeout auto-reject)
  → Customer notified of acceptance or rejection
  → On rejection: show reason + option to find another shop or cancel
```

---

## 5. DELIVERY FLOW (CUSTOMER VIEW)

```
Order accepted → Delivery person assigned
  → Customer sees: delivery person name, phone (masked), ETA
  → Live tracking map active
  → Status bar updates:
      ✅ Order Confirmed → 🏪 Preparing → 🛵 Picked Up → 🚚 Out for Delivery → ✅ Delivered
  → On delivery: proof image viewable by customer
```

---

## 6. ISSUE / SOS SYSTEM

**Customer can raise issue at any point post-dispatch:**

| Issue Type | Description |
|---|---|
| Late delivery | ETA exceeded significantly |
| Bad quality | Product condition issue |
| Damage / Leak | Physical damage on arrival |
| Extra money asked | Delivery person overcharged |
| Wrong item | Received different product |

**Flow:**
```
Customer selects issue type → "No Issue" or "Raise Complaint"
  → If complaint: attach proof (image/video) + remarks
  → Submit → enters complaint review queue
```

---

## 7. COMPLAINT HANDLING FLOW

```
Complaint submitted
  → Auto-triage: flag for admin review
  → Admin: APPROVE or REJECT
    → APPROVED:
        → Trigger replacement order OR initiate refund
        → Notify customer of outcome
    → REJECTED:
        → Show rejection reason
        → Mark complaint as CLOSED
        → Customer can escalate (optional: one escalation allowed)
```

---

## 8. REFUND LOGIC

| Order Stage | Refund |
|---|---|
| Before pickup | 100% |
| After pickup | 50% |
| After delivery attempt | 0% |

**COD cancellation limits:**
- Track per-user COD cancel count
- After limit exceeded: block COD for that user (configurable threshold)
- User notified with reason

---

## 9. FEEDBACK SYSTEM

**Triggered automatically after DELIVERED status:**
```
Customer rates: 1–5 stars + optional text comment
  → Rating ≥ 3: stored as positive feedback, no further action
  → Rating < 3: auto-routed to complaint flow (Section 7)
```

- Feedback stored with: order_id, delivery_person_id, shop_id, rating, comment, timestamp
- Shown in shop and delivery person analytics

---

## 10. REORDER SYSTEM

- "Reorder" button available on past order cards in order history
- One-tap reorder: pre-fills cart with same items and shop
- System re-validates before confirming: stock, slot, shop open status
- Auto-applies: active coupons, loyalty level discount
- If items unavailable: show conflict screen with partial reorder option

---

## 11. LOYALTY POINT SYSTEM

**Points earning:**
| Trigger | Points |
|---|---|
| Per can delivered | +2 pts |
| Per ₹10 spent | +1 pt (configurable) |
| Referral signup | +20 pts |
| Referral first order | +30 pts |

**Level thresholds:**
| Level | Points |
|---|---|
| 1 | 0–99 |
| 2 | 100–199 |
| 3 | 200–299 |
| 6 | 500+ |
| 11 | 1050+ |

- Levels are calculated dynamically from cumulative points
- Points history screen: earned | redeemed | expired entries

---

## 12. DISCOUNT SYSTEM

**Level-based discounts (same-shop orders):**
| Level Range | Discount |
|---|---|
| 1–2 | 0% |
| 3–5 | 2% |
| 6–10 | 5% |
| 11–20 | 8% |
| 20+ | 10% (maximum cap) |

- Discount applied automatically at checkout based on current level
- Stackable with coupons (apply loyalty discount first, then coupon, or configure priority)
- Max total discount cap enforced (configurable)

---

## 13. REACT NATIVE UI — CUSTOMER SCREENS

**Core screens:**
- Splash / Onboarding → Phone entry → OTP → Role select
- Home (shop discovery: list + map + filters)
- Shop detail + Product listing
- Cart + Checkout + Coupon apply
- Payment (Razorpay SDK / COD confirm)
- Order tracking (live map + status bar)
- Order history + Reorder
- Feedback & Complaint submission
- Profile & Settings (addresses, UPI, notifications)
- Loyalty dashboard (points, level, discount preview)

**UX requirements:**
- Skeleton loaders on all data-fetch screens
- Toast notifications for status updates
- Real-time order status push (WebSocket or Firebase)
- Retry UI on network failures
- Address picker with GPS + manual entry fallback
