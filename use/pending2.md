# PROMPT 2 — End-to-End Delivery Flow: Order → Payment → Tracking → Feedback → Loyalty

## Context
Reuse existing project architecture, components, APIs, and code wherever possible.
Extend or modify only when necessary. Annotate all new additions inline.

**Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo)
**Rules:** Migration-only schema changes | Idempotent payment handling | No duplicate indexes

---

## 1. ORDER CREATION FLOW
```
User selects product
  → Check delivery slot availability (by shop + time window)
  → Validate service area (user address within shop delivery radius)
  → Validate shop is open and has stock
  → Optional: Apply coupon (validate → apply discount)
  → Optional: Apply loyalty discount (based on user level)
  → Calculate final price: product_price + delivery_charge + tax - discounts
  → Show order summary → User confirms
```

---

## 2. PAYMENT FLOW

**Methods:** COD | UPI / Online (Razorpay)

**COD Path:**
```
User selects COD → Order confirmed → Status: PENDING
```

**Razorpay (Online) Path:**
```
Backend creates Razorpay order → Returns order_id to frontend
  → User completes payment on Razorpay SDK
  → Backend verifies payment signature (HMAC validation)
  → If SUCCESS: mark order PAID, proceed
  → If FAILED: allow retry (max 3) or cancel order
```

**Payment hygiene:**
- Store payment_logs with: razorpay_order_id, razorpay_payment_id, amount, status, created_at
- Idempotency: check for existing payment record before creating new one
- Webhook handler for async payment status updates (verify webhook signature)

---

## 3. ORDER ASSIGNMENT
```
Auto-assign shop:
  → Filter shops by: user location within delivery radius + shop is open + has stock
  → Sort by: distance (nearest first)
  → Assign to top match
  → If no match: notify user "No shops available"
```

---

## 4. SHOP RESPONSE
```
Shop receives order notification (push + in-app)
  → ACCEPT → proceed to delivery assignment
  → REJECT (with reason) → trigger reassignment to next eligible shop
  → Timeout (configurable, e.g., 5 min) → auto-reject, trigger reassignment
  → Max retries exceeded → notify user, cancel order, trigger refund if paid
```

---

## 5. DELIVERY FLOW
```
Delivery person assigned
  → Notified via push
  → ACCEPT assignment → Pickup initiated
  → Live tracking enabled (location push every N seconds)
  → Status updates:
      ACCEPTED → PICKED → OUT_FOR_DELIVERY → DELIVERED
  → On DELIVERED: upload proof image + timestamp
```

---

## 6. ADDRESS HANDLING
- Address editable: only while order is in PENDING or ACCEPTED state
- Address locked: once order moves to PICKED or beyond
- Lock enforced at API level — return error if edit attempted post-lock

---

## 7. CANCELLATION & REFUND LOGIC

| Stage | Refund % | Notes |
|---|---|---|
| Before pickup (PENDING/ACCEPTED) | 100% | Full refund |
| After pickup (PICKED/OUT_FOR_DELIVERY) | 50% | Partial refund |
| After delivery attempt | 0% | No refund |

**COD abuse prevention:**
- Track cancel count per user
- After N cancellations (configurable): restrict COD, require online payment

**Razorpay Refund Flow:**
```
Trigger Razorpay refund API → Store refund_id + status in refund_logs
  → Poll or webhook for refund completion
  → Update order refund_status on confirmation
```

---

## 8. REAL-TIME TRACKING SYSTEM
- Technology: WebSocket (Socket.io) or Firebase Realtime DB
- Delivery person pushes GPS coordinates at regular intervals
- Customer and Admin subscribe to order-specific tracking channel
- Handle edge cases: delivery person goes offline → show last known location + "location unavailable" UI
- Delivery delay detection: if estimated time exceeded → notify customer + admin

---

## 9. DELIVERY COMPLETION
- Delivery person marks DELIVERED
- Uploads proof image (stored in cloud storage, URL saved to order record)
- Timestamp recorded
- Customer notified → feedback prompt triggered

---

## 10. FEEDBACK SYSTEM
```
Customer submits rating (1–5) + optional comment
  → Rating ≥ 3: stored, no action
  → Rating < 3: flagged → enters complaint flow (see Section 11)
```

---

## 11. COMPLAINT / SOS FLOW
```
Customer submits complaint:
  → Type: Late | Bad quality | Damage | Wrong item | Extra charge
  → Attach proof (image/video) + remarks

Admin reviews:
  → APPROVE complaint → trigger replacement order or refund
  → REJECT complaint → mark as CLOSED, notify customer with reason
```

---

## 12. REFUND & REPLACEMENT
- Refund: trigger Razorpay refund API based on cancellation stage rules
- Replacement: create new linked order (replacement_for_order_id reference)
- Maintain: refund_logs | replacement_order_id | audit_trail entries

---

## 13. LOYALTY POINT SYSTEM

**Points earning:**
- Points awarded on order completion based on order value
- Example rule: 1 can = 2 points | ₹10 spent = 1 point (configurable)

**Level thresholds:**
| Level | Points Range |
|---|---|
| 1 | 0–99 |
| 2 | 100–199 |
| 3 | 200–499 |
| 4+ | Configurable higher tiers |

**Level-based discounts:**
| Level | Discount |
|---|---|
| 1–2 | 0% |
| 3–5 | 2% |
| 6–10 | 5% |
| 11–20 | 8% |
| 20+ | 10% (max) |

- Discount applies to same-shop orders
- Points and level updated immediately after order DELIVERED status
- Points history logged (earned, redeemed, expired)

---

## 14. REORDER FEATURE
- User can reorder from order history in one tap
- System re-validates: slot availability, stock, shop open status
- Auto-applies: active coupons, loyalty discount
- If any item unavailable: notify user, allow partial reorder

---

## 15. ADMIN MONITORING
- Dashboard views: active orders | refunds pending | open complaints | delivery tracking map
- Override actions: force approve refund | assign replacement | reassign delivery

---

## 16. EDGE CASES & SYSTEM BEHAVIOR

| Edge Case | Handling |
|---|---|
| Payment success but order creation fails | Rollback order, trigger auto-refund, log incident |
| Shop rejects after multiple reassignments | Cancel order, full refund, notify customer |
| Delivery person unreachable | Mark status, auto-reassign or escalate |
| Customer not home | Delivery person marks "Attempted", log with proof |
| Duplicate order submission | Idempotency key prevents duplicate creation |

- All edge case events produce an audit_log entry with full context
