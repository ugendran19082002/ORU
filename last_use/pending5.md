# PROMPT 5 — Full Production System: Razorpay Integration, Shop Payouts, Queue Architecture & Best Practices

## Context
Reuse existing architecture, components, and APIs wherever possible.
Extend or modify only when necessary. Annotate all new additions inline.

**Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo) | Razorpay | BullMQ / RabbitMQ
**Rules:** ORM migrations only | Idempotent payments | No runtime schema changes | Standard API envelope

---

## 1. ORDER CREATION FLOW

```
User selects product + delivery slot
  → Validate: service area | slot availability | shop open | stock available
  → Apply (optional): coupon → loyalty discount → subscription discount
  → Calculate final price:
      subtotal + delivery_charge + tax - total_discounts + optional_tip
  → Show itemized summary → User confirms
```

---

## 2. PAYMENT FLOW — RAZORPAY INTEGRATION

**COD path:** Order confirmed immediately → status PENDING

**Online payment path:**
```
POST /api/orders/initiate
  → Backend: create Razorpay order via API → store in payment_logs with status CREATED
  → Return razorpay_order_id to frontend
  → Frontend: open Razorpay checkout SDK
  → User completes payment
  → Frontend receives: razorpay_payment_id, razorpay_order_id, razorpay_signature
  → POST /api/payments/verify
      → Backend: verify HMAC signature (razorpay_order_id + "|" + razorpay_payment_id)
      → If valid: update payment_log status to PAID, confirm order
      → If invalid: reject, log tamper attempt
```

**Webhook handler (async events):**
- payment.captured → confirm order if not already confirmed
- payment.failed → mark payment as FAILED, notify user
- Verify webhook signature on every incoming event
- Idempotency: skip processing if event already handled (store event_id)

---

## 3. SHOP AUTO-ASSIGNMENT

```
On order placed:
  → Query shops: within delivery radius of user + open + has stock
  → Sort by: distance ASC, then rating DESC
  → Assign to first match
  → If rejected or timeout: move to next match (max retries = configurable)
  → If all retries exhausted: cancel order, trigger refund, notify user
```

---

## 4. DELIVERY FLOW
```
Delivery person assigned (auto or manual)
  → Push notification sent
  → Accepts → Pickup initiated → Live tracking starts
  → Status progression: ACCEPTED → PICKED → OUT_FOR_DELIVERY → DELIVERED
  → On DELIVERED: upload proof image → timestamp stored
```

---

## 5. ADDRESS LOCK LOGIC
- Editable: while order is in PENDING or ACCEPTED state
- Locked: once status moves to PICKED or beyond
- API returns 400 with reason if edit attempted post-lock

---

## 6. CANCELLATION & REFUND LOGIC

| Stage | Refund |
|---|---|
| Before pickup | 100% |
| After pickup | 50% |
| After delivery attempt | 0% |

**Razorpay refund flow:**
```
POST /api/refunds/initiate
  → Calculate refund amount based on stage
  → Call Razorpay refund API
  → Store: refund_id, razorpay_refund_id, amount, status in refund_logs
  → Webhook: refund.processed → update refund_logs status to COMPLETED
```

**COD abuse:**
- Track cancellations per user
- After N cancels (configurable): block COD, require online payment

---

## 7. REAL-TIME TRACKING
- Technology choice: Socket.io (WebSocket) or Firebase Realtime DB
- Delivery person: push GPS coordinates at configurable interval (e.g., every 5s)
- Coordinates stored in location_logs (order_id, lat, lng, timestamp)
- Customer subscribes to channel: `order:{order_id}:location`
- Admin subscribes to all active delivery channels
- Offline handling: show last known position + "Location unavailable" indicator

---

## 8. FEEDBACK, COMPLAINT & REPLACEMENT
- Refer to Prompt 3 Section 9–11 for full flow
- Replacement orders: linked via replacement_for_order_id with full new order lifecycle

---

## 9. LOYALTY SYSTEM
- Refer to Prompt 3 Sections 11–12 for point rules and level table
- Points credited after DELIVERED status via async queue job (not in request cycle)

---

## 10. SHOP PAYOUT SYSTEM 🔥

**Shop wallet logic:**
- On each delivered order: credit (order_amount - platform_commission) to shop_wallet
- Platform commission: configurable percentage per shop or global default

**Payout modes:**

### Instant Payout:
```
Shop requests payout (manual trigger)
  → Validate: minimum payout threshold met
  → Call Razorpay Payout API (via Razorpay X)
  → Deduct platform fee
  → Store: payout_id, razorpay_payout_id, amount, fee, status, timestamp
  → Webhook: payout.processed / payout.failed → update payout_logs
```

### Scheduled Payout (Cron):
```
Cron job runs daily/weekly (configurable per shop)
  → Aggregate pending earnings from shop_wallet since last settlement
  → Batch: create single payout for total amount
  → Deduct platform commission
  → Trigger Razorpay Payout API
  → Update settlement_logs: period_start, period_end, amount, commission, status
```

**Tracking tables:**
- `shop_wallet`: running balance per shop
- `payout_logs`: each payout attempt with status
- `settlement_logs`: periodic settlement records

---

## 11. ASYNC QUEUE ARCHITECTURE (BullMQ / RabbitMQ)

**Queue jobs (never block main request thread):**
| Job | Trigger |
|---|---|
| send_push_notification | Order status change |
| award_loyalty_points | Order DELIVERED |
| process_refund | Cancellation confirmed |
| schedule_payout | Cron trigger |
| reassign_order | Shop reject / timeout |
| send_sms_otp | Auth flow |
| webhook_event_process | Razorpay webhook received |

**Job design rules:**
- Every job is idempotent (safe to retry)
- Failed jobs retry with exponential backoff (max 3–5 retries)
- Dead-letter queue for unrecoverable failures
- All job executions logged with outcome

---

## 12. DATABASE BEST PRACTICES

**Schema management:**
- All changes via Sequelize migrations: `createTable`, `addColumn`, `addIndex`, `changeColumn`
- Never call `sync({ force: true })` or `alter: true` in production
- Version-controlled migration files, run via CI/CD pipeline

**Indexing strategy:**
- Single-column indexes on: user_id, shop_id, order_id, status, created_at (high-query columns)
- Composite indexes on common query patterns:
  - `(shop_id, status)` — shop order dashboard
  - `(user_id, created_at)` — order history
  - `(delivery_person_id, status)` — delivery dashboard
- No duplicate indexes — audit before adding new ones

**Data integrity:**
- Foreign key constraints enforced at DB level
- Soft deletes (`deleted_at`) on: users, shops, products, orders, delivery persons
- Audit log tables: append-only, no UPDATE or DELETE ever
- Sensitive financial records (payments, refunds, payouts): never soft-deleted, only status updates

---

## 13. API DESIGN STANDARDS

**Standard response envelope:**
```json
{ "status": true, "message": "Success", "data": {} }
```

**Error envelope:**
```json
{ "status": false, "message": "Error description", "errors": [] }
```

**HTTP status codes:**
- 200: success
- 201: created
- 400: validation error
- 401: unauthorized
- 403: forbidden (role mismatch)
- 404: not found
- 409: conflict (duplicate/idempotency)
- 422: business logic error
- 500: server error

---

## 14. REACT NATIVE UI REQUIREMENTS

**Screen list:** Home | Shop list (map + filter) | Cart | Checkout | Payment | Order tracking | Order history | Feedback | Profile | Loyalty dashboard | Subscription screen

**UX standards:**
- Skeleton loading on all async screens
- Toast / snackbar for non-blocking feedback
- Retry button on failed network requests
- Real-time order status push without manual refresh
- Optimistic UI for cart updates

---

## 15. EDGE CASES

| Scenario | Resolution |
|---|---|
| Payment success, order creation fails | Auto-refund triggered via queue job |
| Duplicate payment request | Idempotency key prevents double charge |
| Shop times out on order acceptance | Auto-reject, reassign to next shop |
| Payout API fails | Retry via queue, notify admin if max retries hit |
| Delivery person goes offline mid-delivery | Show last location, notify admin |
| Customer not reachable | Mark DELIVERY_ATTEMPTED, log with timestamp |
