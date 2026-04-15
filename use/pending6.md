# PROMPT 6 — Shop Side Settings: Complete Module Design

## Context
Reuse existing architecture, components, and APIs wherever possible.
Extend or modify only when necessary. Annotate all new additions inline.

**Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo)
**Rules:** Migration-only schema changes | All settings changes must be audit-logged | No runtime ALTER

---

## 1. SHOP PROFILE SETTINGS

**Editable fields:**
- Shop name | Owner name | Mobile | Email
- Address (GPS-enabled picker + manual fallback)
- Shop images / logo (upload to cloud storage)
- KYC / verification documents (upload + status: PENDING | VERIFIED | REJECTED)
- Optional: Face ID / biometric for critical actions

**Rules:**
- Mobile and email changes require OTP re-verification
- KYC re-upload triggers admin review again
- Profile changes (non-KYC) take effect immediately

---

## 2. SHOP STATUS CONTROL

**Toggle states:** OPEN | CLOSED | PAUSED (maintenance)

**Auto-behavior:**
- Auto-close when current time is outside configured working hours
- Auto-reopen based on next scheduled working hour slot
- Manual override always available

**Customer-facing impact:**
- CLOSED / PAUSED shops: hidden from active listings or shown with "Closed" badge
- Ordering blocked at API level (not just UI)

---

## 3. BUSINESS HOURS & HOLIDAY SETTINGS

**Configuration:**
- Working hours per day (Mon–Sun): open_time, close_time, or mark as closed
- Break times (e.g., lunch 2–3 PM): orders blocked during break
- Holiday dates: specific dates with optional message ("Closed for Diwali")

**System behavior:**
- Cron checks shop schedule every minute (or on-demand at order attempt)
- Status auto-updated based on schedule
- Holiday takes priority over regular working hours

---

## 4. DELIVERY SETTINGS

**Basic:**
- Delivery radius (km)
- Delivery slots: time windows with capacity limit per slot
- Same-day / instant delivery toggle

**Advanced:**
- Minimum order value for delivery eligibility
- Delivery availability schedule (separate from shop working hours)
- Reopen time configuration (for delivery pause scenarios)

---

## 5. SERVICE AREA / PINCODE CONTROL

**Configuration:**
- Allowed pincodes / zones (whitelist)
- Restricted areas (blacklist override)

**System behavior:**
- On order placement: validate user address pincode against shop's allowed zones
- If outside: return error "Delivery not available in your area"
- Map-based zone drawing (optional advanced feature)

---

## 6. DELIVERY CHARGE SETTINGS

**Pricing modes (select one per shop):**
- **Fixed:** flat charge regardless of distance
- **Distance-based:** tiered by km range (e.g., 0–3 km → ₹20, 3–6 km → ₹40)
- **Floor-based:** tier by order value (e.g., order < ₹100 → ₹30 delivery)

**Surge pricing:**
- Enable surge during peak hours (configurable time windows)
- Surge amount: fixed add-on (e.g., +₹10 during 6–8 PM)

---

## 7. PRODUCT SETTINGS

**Operations:** Add | Edit | Delete (soft delete) products

**Fields per product:** Name | Price | Quantity | Unit (20L / 10L / etc.) | Category (from admin-defined list) | Images

**Stock control:**
- Manual update: IN_STOCK | LOW_STOCK | OUT_OF_STOCK
- Inventory alert threshold: notify when stock < N units
- Auto-hide out-of-stock products from customer listing (configurable toggle)

---

## 8. COUPON SETTINGS (SHOP-LEVEL)

**Shop can create own coupons:**
- Type: FLAT or PERCENT discount
- Min order value | Max discount cap | Expiry date | Total usage limit | Per-user limit

**Coupon visibility:** Active | Expired | Exhausted (tracked separately)

---

## 9. ORDER SETTINGS

**Controls:**
- Auto-accept toggle: if ON, orders auto-confirmed without manual approval
- Order preparation time: shown to customer as part of ETA
- Response timeout: configurable (e.g., 5 min) — auto-reject if exceeded

---

## 10. DELIVERY PERSON SETTINGS

**Operations:** Add | Edit | Deactivate delivery staff

**Fields:** Name | Phone | Vehicle type | Availability status (ACTIVE | OFF_DUTY | BUSY)

**Assignment modes:**
- Auto-assign: system selects based on availability + proximity
- Manual assign: shop owner assigns specific person per order

**Failover:** If assigned person rejects or is unavailable → auto-reassign to next available

---

## 11. MINIMUM ORDER & SURGE SETTINGS

- Minimum order value: block checkout if cart value below threshold
- Surge pricing: time-window based delivery charge add-on
- Both configurable per shop, with audit log on every change

---

## 12. AUTO ACCEPT / AUTO ASSIGN LOGIC

**Auto accept:**
- Toggle in order settings
- When ON: order confirmed immediately, notification sent to delivery

**Auto assign delivery:**
- Priority: nearest available → highest rated → least recently assigned
- Failover: if first assignee rejects within timeout → reassign, max N retries

---

## 13. PAYMENT SETTINGS

**Enable / disable per method:** COD | UPI / Online (Razorpay)

**Bank / payout details:**
- Bank account number + IFSC
- UPI ID for receiving payments
- Changes trigger re-verification before payouts enabled

---

## 14. PAYOUT SETTINGS

**Modes:**
- **Instant:** manual trigger by shop owner, real-time transfer via Razorpay X
- **Scheduled:** daily or weekly automated settlement via cron

**Configuration:** Settlement cycle (daily/weekly) | Minimum payout threshold | Bank account

**Tracking (read-only view):**
- Total earnings | Pending settlement | Platform commission deducted | Payout history

---

## 15. CANCELLATION POLICY SETTINGS

**Configurable per shop:**
- Cancellation allowed until: ACCEPTED | PICKED (cutoff stage)
- Refund percentages per stage (defaults from system, shop can restrict but not exceed system defaults)
- Return / replacement: eligible product categories + complaint time window (e.g., within 2 hrs of delivery)

---

## 16. TAX & BILLING SETTINGS

- GST number input + verification status
- Tax percentage (applied on product subtotal)
- Invoice generation: auto-generate on order DELIVERED, downloadable PDF
- Billing details shown on invoice: shop name, GST, order items, tax breakdown

---

## 17. STAFF ROLE MANAGEMENT

**Roles within shop:** Manager | Staff | Delivery Person

**Permissions matrix:**
| Action | Manager | Staff | Delivery |
|---|---|---|---|
| View orders | ✅ | ✅ | Own only |
| Edit products | ✅ | ✅ | ❌ |
| Manage settings | ✅ | ❌ | ❌ |
| Assign delivery | ✅ | ❌ | ❌ |
| View financials | ✅ | ❌ | ❌ |

---

## 18. NOTIFICATION SETTINGS

**Alert types (toggle per type):**
- New order received | Order cancelled | Payment received | Low stock alert | Payout completed | Complaint raised

**Channels:** Push notification | SMS | WhatsApp (via API integration)

---

## 19. CUSTOMER VISIBILITY SETTINGS

- Show / hide shop in customer listing (manual toggle)
- Feature flag: mark as Featured shop (admin approves, shop requests)
- Visibility radius override (limit shop appearance to smaller radius temporarily)

---

## 20. ANALYTICS & DASHBOARD (READ-ONLY)

**Metrics displayed:**
- Total orders (today / week / month) | Total revenue | Top products | Avg delivery time | Ratings breakdown | Complaint rate

**Export:** CSV download for order reports (date range selectable)

---

## 21. FRAUD & ABUSE CONTROL

**Detection rules (configurable):**
- User with N+ cancellations in M days → flag
- Same address, multiple accounts → flag for review
- Repeated COD no-show → auto-block COD for that user at this shop

**Actions:**
- Block specific users from ordering at this shop
- Report to admin for platform-level action

---

## 22. DATA LOGGING & AUDIT

**All settings changes logged with:**
- actor (who changed) | field changed | old value | new value | timestamp

**Audit log is:**
- Append-only (no updates, no deletes)
- Viewable by shop owner and admin
- Retained for minimum 1 year

---

## 23. API INTEGRATION SETTINGS

**External services shop can configure:**
- Payment gateway: Razorpay credentials (admin-managed, shop view-only)
- SMS provider: API key (for custom SMS alerts)
- WhatsApp notifications: phone number linking
- Webhook endpoint: shop can register external webhook for order events

---

## 24. FEATURE FLAGS (ADVANCED)

**Per-shop toggleable features:**
- Split orders | Instant delivery | Surge pricing | Auto-accept | Multi-branch mode

**Admin controls:** Enable / disable any flag globally or per shop

---

## 25. REACT NATIVE UI — SETTINGS SCREENS

**Section navigation:** Profile | Delivery | Products | Orders | Payments | Payouts | Staff | Analytics | Security | Notifications | Advanced

**UX standards:**
- Toggle switches for on/off settings
- Dropdowns for mode selection
- Save button with validation + confirmation dialog for critical changes
- Inline error messages on invalid input
- Audit log viewer screen (read-only, filterable by date)
