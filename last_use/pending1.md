# PROMPT 1 — Multi-Role Delivery Platform: System Architecture & Role Management

## Context
Reuse existing project architecture, components, APIs, and code wherever possible.
Extend or modify only when necessary without breaking current functionality.
Clearly annotate every new addition, modification, or replacement inline.

**Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo)
**Rules:** ORM-only schema changes via migrations | No runtime ALTER | No duplicate indexes | REST API with standard response envelope

---

## 1. USER ROLES

**Roles:** Customer | Shop Owner | Delivery Person | Admin

**Role Management Logic:**
- Each user has a primary role assigned at onboarding
- Role switching is allowed only via validated request with admin approval
- All role transitions must be logged with: user_id, from_role, to_role, timestamp, reason, approved_by
- Unauthorized role change attempts must be blocked and flagged

**Access Control:**
- Enforce role-based middleware on every protected route
- JWT payload must include role; validate server-side on every request
- Never trust client-supplied role claims

---

## 2. CUSTOMER ONBOARDING

**Registration fields:** Email or Phone | Default delivery address | Optional UPI ID

**Onboarding state machine:**
```
PENDING → IN_PROGRESS → COMPLETED
                      ↘ REJECTED
```

- State transitions must be logged
- Rejected users receive a reason message
- Completed onboarding unlocks full app access
- In-progress users get limited access (browse only)

---

## 3. SHOP MANAGEMENT

### 3.1 Shop Creation Flow
```
New Shop:
  → Submit profile (name, address, owner details, shop images, KYC docs)
  → Status: PENDING_APPROVAL
  → Admin reviews → APPROVED or REJECTED
  → On approval: shop dashboard unlocked

Existing Shop:
  → Direct dashboard access
  → Order management enabled
```

### 3.2 Product Management
- Add / Edit / Delete products: name, quantity, price, unit, category
- Stock state machine: `IN_STOCK → LOW_STOCK → OUT_OF_STOCK`
- Out-of-stock products auto-hidden from customer listing
- Stock changes must be logged with timestamp and actor

### 3.3 Coupon Management
- Admin creates global coupons; Shop creates shop-level coupons
- Coupon fields: code, type (flat/percent), value, min_order, expiry, usage_limit, per_user_limit
- Validate at checkout: active, not expired, usage not exceeded, min_order met
- Apply coupon → recalculate final price before order confirmation

### 3.4 Shop Operational Settings
- Delivery charge modes: Fixed | Distance-based tiers | Floor-based pricing
- Delivery rules: max radius (km) | minimum order value | open/close toggle | delivery slots (time windows) | reopen time config
- Business hours: per-day schedule (Mon–Sun) | break times | holiday/leave dates
- Auto-close shop when outside working hours; auto-reopen on schedule

---

## 4. ORDER MANAGEMENT

### 4.1 Order Flow
```
Customer places order
  → Assigned to nearest available shop
  → Shop receives notification
  → Shop: ACCEPT or REJECT (with timeout auto-reject)
  → If REJECTED: notify customer, trigger reassignment to next shop
  → Max reassignment retries: configurable per system settings
```

### 4.2 Order Assignment Strategy
- **Default:** Assign full order to single delivery person
- **Advanced (split orders):** Split across multiple delivery persons based on item availability or shop location
- Assignment priority: availability → proximity → rating → last assigned time

---

## 5. DELIVERY SYSTEM

### 5.1 Delivery Person Setup
- Default delivery person can be linked to a shop
- Shop owner can add/edit/remove delivery staff
- Each delivery person has a profile: name, phone, vehicle, availability status

### 5.2 Delivery Dashboard
- Delivery person sees: assigned orders, pickup details, delivery address, order status
- Actions: Accept assignment | Mark Picked | Mark Out for Delivery | Mark Delivered | Upload proof

### 5.3 Live Tracking
- Real-time location push via WebSocket or Firebase Realtime DB
- Location updates stored at configurable intervals
- Tracking visible to: Customer (their active order only) | Admin (all active deliveries)

---

## 6. ORDER STATUS LIFECYCLE
```
PENDING → ACCEPTED → ASSIGNED → PICKED → OUT_FOR_DELIVERY → DELIVERED
       ↘ REJECTED
       ↘ CANCELLED
```
- Every status transition: log actor, timestamp, reason (if rejection/cancel)
- Immutable audit log — no updates, only inserts

---

## 7. CANCELLATION & ERROR HANDLING

| Scenario | Action |
|---|---|
| Order rejected by shop | Notify customer, auto-reassign or allow cancel |
| Delivery person unavailable | Reassign or escalate to admin |
| Customer cancellation | Apply refund rules based on current order stage |
| No delivery response | Auto-escalate after timeout |

- All failures must produce an error log entry with context

---

## 8. ADMIN CONTROL

**Monitoring:** All shops | All orders | All delivery personnel | All products | All complaints

**Actions:**
- Approve / reject shop onboarding
- Override order decisions (force accept, force reassign)
- Manage system-wide settings (retry limits, timeout durations, refund rules)
- Review and act on negative feedback / complaints

---

## 9. SECURITY & VALIDATION

- JWT-based auth with role claim validation on every request
- Rate limiting on auth endpoints
- Input validation at controller layer (not just DB layer)
- Soft delete pattern for all critical entities (users, shops, products, orders)
- Sensitive operations (role change, refund, payout) require additional auth or admin approval

---

## 10. API RESPONSE ENVELOPE (STANDARD)
```json
{
  "status": true,
  "message": "Success",
  "data": {}
}
```
Error format:
```json
{
  "status": false,
  "message": "Validation error",
  "errors": []
}
```

---

## 11. DATABASE BEST PRACTICES
- All schema changes via Sequelize migrations only
- Use `addColumn`, `createTable`, `addIndex` — never raw ALTER in application code
- Foreign key constraints enforced at DB level
- Composite indexes on high-query columns (e.g., shop_id + status, user_id + created_at)
- Soft deletes on all user-facing entities (`deleted_at` column)
- Audit log tables are append-only (no UPDATE, no DELETE)
