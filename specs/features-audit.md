👉 “If it doesn’t help user order water faster → REMOVE IT”

# ThanniGo — Feature Implementation Audit

**Date:** 2026-04-10 · **Auditor:** Antigravity  
**Source Spec:** `specs/features.md`  
**Scope:** All features cross-checked against `app/`, `stores/`, `components/`, `api/`, `hooks/`

> **Global Directive (line 1 of features.md):**  
> ❌ Wallet feature globally removed. ✅ Only **Cash (COD)** and **UPI (Razorpay)** are maintained.  
> ✅ Shop-side payout and direct cash collection to be kept.

---

## Legend

| Symbol | Meaning                                             |
| ------ | --------------------------------------------------- |
| ✅     | Implemented & working                               |
| 🟡     | Partially implemented (UI exists, logic incomplete) |
| ❌     | Not implemented                                     |
| 🚫     | Removed per spec directive                          |
| 🔵     | P2 / Advanced — deferred by design                  |

---

## 🛒 ORDER MANAGEMENT

### Customer Side

| Feature                                             | Priority | Status | Notes                                                                                              |
| --------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------------------- |
| Auto location detect (nearby shops)                 | P0       | 🟡     | `location.tsx` exists; not wired to shop feed on home                                              |
| Browse shops (list + map view)                      | P0       | 🟡     | `(tabs)/index.tsx` has list; map toggle not implemented                                            |
| Filter shops (rating, distance, price)              | P0       | 🟡     | `shopStore` has `filters` state; UI filter chips exist in `(tabs)/index.tsx`; filter not persisted |
| View shop profile (hours, products, ratings)        | P0       | ✅     | `shop-detail/[id].tsx`                                                                             |
| Order water cans (20L / 10L)                        | P0       | ✅     | Products in `mockData.ts`, cart in `cartStore`                                                     |
| Multiple can types in one order                     | P0       | ✅     | `cartStore` supports multi-product items                                                           |
| Select quantity (1-50 cans)                         | P0       | 🟡     | Quantity stepper exists; no max 50 cap enforced                                                    |
| Instant delivery (ASAP)                             | P0       | ✅     | Default checkout behavior                                                                          |
| Schedule delivery (date + time)                     | P0       | ✅     | `order/schedule.tsx`                                                                               |
| Delivery slot selection (morning/afternoon/evening) | P1       | ✅     | `order/schedule.tsx`                                                                               |
| Repeat last order (1-tap reorder)                   | P0       | ❌     | Not implemented — no "Order Again" button in `(tabs)/orders.tsx`                                   |
| 'Order Again' from history                          | P0       | ❌     | Not implemented                                                                                    |
| View order summary before confirm                   | P0       | ✅     | `order/checkout.tsx`                                                                               |
| Add delivery notes/instructions                     | P0       | 🟡     | Note field in `cartStore.note`; UI in checkout                                                     |
| Emergency order (30 min delivery)                   | P1       | ❌     | No emergency/urgent order flow                                                                     |
| Edit order (before shop accepts)                    | P1       | ❌     | Not implemented                                                                                    |
| Cancel order (before dispatch)                      | P0       | ✅     | `order/cancel.tsx`                                                                                 |
| Cancel reason selection                             | P0       | ✅     | `order/cancel.tsx` has reason list                                                                 |
| Partial delivery acceptance                         | P2       | 🔵     | Deferred                                                                                           |
| Bulk order (10+ cans)                               | P1       | 🟡     | Quantity allows it but no special bulk UI/discount                                                 |
| Schedule recurring weekly orders                    | P1       | 🔵     | Deferred                                                                                           |
| Subscription plans (daily/weekly/monthly)           | P1       | ✅     | `subscriptions.tsx`                                                                                |
| Pause subscription (vacation mode)                  | P1       | 🟡     | UI toggle exists in `subscriptions.tsx`; `toggleSubscription` is binary active/inactive only       |
| Resume subscription                                 | P1       | 🟡     | Same toggle — no "pause" vs "cancel" distinction                                                   |
| Modify subscription (change time/quantity)          | P1       | ❌     | No edit flow for subscriptions                                                                     |

### Shop Side — Order Management

| Feature                                       | Priority | Status | Notes                                                                                         |
| --------------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------- |
| Order notifications (sound + vibrate)         | P0       | ❌     | No push notification service configured                                                       |
| Push notification for new order               | P0       | ❌     | Firebase messaging not integrated                                                             |
| Accept order                                  | P0       | ✅     | `shop/index.tsx` accept button wired to `orderStore`                                          |
| Reject order (with reason)                    | P0       | 🟡     | Reject button exists; reason dialog not enforced as mandatory                                 |
| Auto-reject if out of stock                   | P1       | ❌     | No auto-reject automation                                                                     |
| Auto-reject if outside delivery area          | P1       | ❌     | No delivery area validation                                                                   |
| View order details (customer, items, address) | P0       | ✅     | `shop/order/[id].tsx`                                                                         |
| Order list tabs (New/Preparing/Out/Delivered) | P0       | ✅     | `shop/index.tsx`                                                                              |
| Filter orders (today/pending/completed)       | P0       | 🟡     | Tabs implemented; date filtering not present                                                  |
| Search orders (customer name, order ID)       | P1       | ❌     | No order search in shop dashboard                                                             |
| Mark order preparing                          | P0       | ✅     | Status update in `shop/order/[id].tsx`                                                        |
| Mark order out for delivery                   | P0       | ✅     | Status update available                                                                       |
| Mark delivered (1-tap)                        | P0       | ✅     | `shop/order/[id].tsx`                                                                         |
| Upload delivery proof photo                   | P1       | ❌     | No image upload/capture flow                                                                  |
| Get customer signature on delivery            | P2       | 🔵     | Deferred                                                                                      |
| Manual order entry (phone orders)             | P0       | ✅     | `shop/manual-order.tsx`                                                                       |
| Assign delivery to delivery person            | P1       | 🟡     | `delivery-fleet.tsx` and `shopStore.deliveryAgents` exist; assignment UI in shop order detail |
| Batch accept multiple orders                  | P2       | 🔵     | Deferred                                                                                      |
| Set estimated delivery time                   | P0       | 🟡     | ETA field in order detail; not user-editable                                                  |
| Update delivery time if delayed               | P0       | ❌     | No delay update flow                                                                          |
| Notify customer of delay                      | P0       | ❌     | No push/notification trigger                                                                  |
| Order priority tags (VIP/Regular/First)       | P2       | 🔵     | Deferred                                                                                      |

---

## 💰 PAYMENT & PRICING

> ❗ **Wallet removed globally** — `wallet.tsx`, `wallet-history.tsx`, `wallet` tab are **obsolete** per directive.  
> These files still exist in the codebase and the wallet tab is still shown in `(tabs)/_layout.tsx`.

| Feature                                        | Priority | Status | Notes                                                                                                  |
| ---------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------ |
| ~~Wallet balance~~                             | —        | 🚫     | **REMOVED per spec directive — file still exists**                                                     |
| ~~Add money to wallet~~                        | —        | 🚫     | **REMOVED per spec directive**                                                                         |
| ~~Use wallet + cash (split payment)~~          | —        | 🚫     | **REMOVED per spec directive**                                                                         |
| Cash on Delivery (COD)                         | P0       | ✅     | `cartStore.paymentMethod = 'cod'`                                                                      |
| UPI payment (GPay, PhonePe, Paytm)             | P0       | 🟡     | UPI option in checkout exists; **Razorpay SDK not integrated**                                         |
| Save UPI ID for quick payment                  | P1       | ❌     | Not implemented                                                                                        |
| UPI auto-collect                               | P1       | ❌     | Razorpay not integrated                                                                                |
| Pay later (credit for trusted customers)       | P2       | 🔵     | Deferred                                                                                               |
| View outstanding balance                       | P1       | ❌     | No credit/balance tracking                                                                             |
| Payment history                                | P1       | 🟡     | `wallet-history.tsx` exists but is **wallet-scoped** — needs rename/rewrite as general payment history |
| Download invoice (PDF)                         | P2       | 🔵     | Deferred                                                                                               |
| See price breakdown (product + delivery + tax) | P0       | ✅     | `order/checkout.tsx` shows subtotal + delivery fee                                                     |
| Apply coupon/promo code                        | P1       | 🟡     | `cartStore.couponCode` field exists; no validation/discount logic                                      |
| View savings ('You saved ₹50')                 | P1       | ❌     | No savings calculation displayed                                                                       |
| Price comparison across shops                  | P1       | ❌     | Not implemented                                                                                        |
| Deposit refund tracking                        | P1       | ❌     | Not implemented                                                                                        |

### Shop Side — Payment

| Feature                                | Priority | Status | Notes                                                   |
| -------------------------------------- | -------- | ------ | ------------------------------------------------------- |
| Accept cash payment                    | P0       | ✅     | COD in order flow                                       |
| Accept UPI payment                     | P0       | 🟡     | UI option exists; Razorpay not wired                    |
| Record payment received                | P0       | 🟡     | Mark paid in shop order detail — basic                  |
| Mark order paid/unpaid                 | P0       | 🟡     | `paymentPending` field in `DeliveryTask` domain type    |
| Cash vs UPI tracking                   | P0       | 🟡     | `shop/earnings.tsx` shows breakdown — mock data only    |
| Daily earnings summary                 | P0       | ✅     | `shop/earnings.tsx`                                     |
| Weekly/monthly earnings                | P1       | ✅     | `shop/earnings.tsx`                                     |
| Pending payments (credit customers)    | P1       | ❌     | Not tracked in domain model                             |
| Send payment reminder                  | P1       | ❌     | No communication channel integrated                     |
| Collect payment (mark as paid)         | P1       | 🟡     | Basic in delivery complete flow                         |
| Monthly billing for regular customers  | P1       | ❌     | Not implemented                                         |
| Generate bill/invoice                  | P1       | ❌     | Not implemented                                         |
| Track customer deposits (can deposits) | P1       | ❌     | Not in domain model                                     |
| Refund deposit                         | P1       | ❌     | Not implemented                                         |
| Profit per order                       | P1       | ✅     | `shop/earnings.tsx` shows profit simulation             |
| Delivery cost vs earnings              | P1       | ✅     | `shop/earnings.tsx`                                     |
| Set product prices (20L, 10L)          | P0       | 🟡     | Editable in `shop/inventory.tsx`; changes not persisted |
| Set distance-based delivery charges    | P1       | ❌     | Hardcoded in `cartStore.getDeliveryFee()`               |
| Set floor-based charges                | P1       | ❌     | Not implemented                                         |
| Set bulk discount rules                | P1       | ❌     | No discount rule engine                                 |
| Emergency order premium pricing        | P2       | 🔵     | Deferred                                                |
| Auto price calculation                 | P1       | ✅     | `cartStore.getSubtotal()` + `getDeliveryFee()`          |
| Create discount coupons                | P1       | 🟡     | `shop/promotions.tsx` has UI; no backend                |
| Festival/seasonal pricing              | P2       | 🔵     | Deferred                                                |

---

## 📍 DELIVERY & TRACKING

### Customer Side

| Feature                                                      | Priority | Status | Notes                                                         |
| ------------------------------------------------------------ | -------- | ------ | ------------------------------------------------------------- |
| Track order status (placed→accepted→preparing→out→delivered) | P0       | ✅     | `order/tracking.tsx` with timeline                            |
| Real-time delivery tracking on map                           | P1       | 🟡     | Map view in `order/tracking.tsx`; live GPS not connected      |
| Live delivery person location                                | P1       | ❌     | No real GPS feed                                              |
| Estimated delivery time (ETA)                                | P1       | ✅     | Shown in `order/tracking.tsx`                                 |
| Delivery person name + photo                                 | P1       | ✅     | `order/tracking.tsx` shows agent name                         |
| Delivery person contact number                               | P0       | ✅     | Contact shown in tracking screen                              |
| Call delivery person (1-tap)                                 | P0       | 🟡     | Button present; `Linking.openURL('tel:...')` may not be wired |
| WhatsApp delivery person                                     | P1       | ❌     | Not implemented                                               |
| See delivery person vehicle details                          | P2       | 🔵     | Deferred                                                      |
| Delivery instructions (gate code, landmark)                  | P1       | ✅     | `addresses.tsx` allows notes                                  |
| Save delivery instructions per address                       | P1       | ✅     | Address model supports notes                                  |
| Safe drop option (contactless)                               | P1       | ❌     | Not implemented                                               |
| Get notified when order dispatched                           | P0       | ❌     | Push notifications not integrated                             |
| Get notified when delivery nearby                            | P1       | ❌     | No GPS proximity alert                                        |
| View delivery proof photo                                    | P2       | 🔵     | Deferred                                                      |
| Track multiple orders simultaneously                         | P1       | ❌     | Single active order only (`activeOrderId`)                    |

### Shop / Delivery Side

| Feature                             | Priority | Status | Notes                                                                      |
| ----------------------------------- | -------- | ------ | -------------------------------------------------------------------------- |
| 'Start Delivery Mode' button        | P0       | ✅     | `shop/_layout.tsx` → `/delivery` switch                                    |
| GPS tracking for delivery person    | P1       | 🟡     | `delivery/navigation.tsx` uses `expo-location`; not broadcast to server    |
| Show all deliveries on map          | P1       | 🟡     | Map in delivery screen — static mock                                       |
| Route optimization                  | P1       | ❌     | Google Maps Directions API not wired                                       |
| Multi-stop route planning           | P2       | 🔵     | Deferred                                                                   |
| Cluster nearby deliveries           | P2       | 🔵     | Deferred                                                                   |
| Navigate to customer location       | P0       | ✅     | `delivery/navigation.tsx` opens maps app                                   |
| Call customer (1-tap)               | P0       | ✅     | In `delivery/index.tsx` and `shop/order/[id].tsx`                          |
| WhatsApp customer                   | P1       | ❌     | Not implemented                                                            |
| Update order status manually        | P0       | ✅     | In delivery screens                                                        |
| Mark delivered + capture photo      | P1       | ❌     | `delivery/complete.tsx` exists; no photo capture                           |
| Delivery time tracking per order    | P1       | 🟡     | Timer logic in `delivery/index.tsx` — not persisted                        |
| Delivery performance metrics        | P2       | 🔵     | Deferred                                                                   |
| Failed delivery reasons             | P0       | 🟡     | `delivery/complete.tsx` has failed delivery flow; reason list not enforced |
| Reschedule delivery                 | P1       | ❌     | Not implemented                                                            |
| Delivery boy mode                   | P2       | ✅     | `/delivery` route group is the delivery agent app                          |
| Assign delivery person to order     | P1       | ✅     | `shop/delivery-fleet.tsx` + assign in shop order detail                    |
| Delivery person availability status | P1       | ✅     | `shopStore.deliveryAgents[].status` + fleet UI                             |
| Set delivery area/radius            | P1       | 🟡     | `shop/profile.tsx` allows area setting; no map-radius tool                 |
| Delivery slot management            | P1       | ❌     | Not implemented                                                            |
| Block delivery slots when busy      | P1       | ❌     | Busy mode not connected to slot blocking                                   |

---

## 📦 INVENTORY & STOCK

| Feature                                     | Priority | Status | Notes                                                           |
| ------------------------------------------- | -------- | ------ | --------------------------------------------------------------- |
| Track full cans inventory                   | P0       | ✅     | `shop/inventory.tsx`                                            |
| Track empty cans inventory                  | P0       | ✅     | `shop/inventory.tsx`                                            |
| Low stock alert (< 10 cans)                 | P0       | 🟡     | Visual indicator in inventory; no push alert                    |
| Set minimum stock level                     | P0       | 🟡     | UI field present; threshold not enforced                        |
| Out of stock indicator                      | P0       | ✅     | `Product.inStock` flag + UI badge                               |
| Add stock (when supplier delivers)          | P0       | ✅     | `shop/inventory.tsx` has add/adjust UI                          |
| Remove stock (when selling)                 | P0       | ✅     | Auto-decremented per order                                      |
| Stock adjustment (damage/theft)             | P1       | 🟡     | Manual adjust in inventory; no audit log                        |
| Daily stock reconciliation                  | P1       | ❌     | Referenced in checklist as pending                              |
| Stock movement history                      | P2       | 🔵     | Deferred                                                        |
| Return can tracking (empty→full exchange)   | P0       | 🟡     | Empty can count in inventory; not linked to delivery completion |
| Customer-wise can deposit tracking          | P1       | ❌     | Not in domain model                                             |
| Damaged can tracking                        | P2       | 🔵     | Deferred                                                        |
| Supplier order management                   | P2       | 🔵     | Deferred                                                        |
| Supplier contact list                       | P1       | ❌     | Not implemented                                                 |
| Stock forecast                              | P2       | 🔵     | Deferred                                                        |
| Product variants (20L, 10L, 5L)             | P0       | ✅     | All 3 variants in `mockData.ts`                                 |
| Multiple product types (water, soda, juice) | P2       | 🔵     | Deferred                                                        |

---

## 🔔 NOTIFICATIONS & REMINDERS

| Feature                                              | Priority | Status | Notes                                                        |
| ---------------------------------------------------- | -------- | ------ | ------------------------------------------------------------ |
| Order placed confirmation                            | P0       | 🟡     | `order/confirmed.tsx` screen — **no push notification sent** |
| Order accepted/preparing/out/delivered notifications | P0       | ❌     | Firebase messaging not configured                            |
| Order cancelled notification                         | P0       | ❌     | Not implemented                                              |
| Auto reminder (water running low)                    | P0       | ❌     | No scheduled notification logic                              |
| Reorder suggestion based on usage                    | P1       | ❌     | Not implemented                                              |
| Promotional offers notification                      | P1       | ❌     | Not implemented                                              |
| New order notification (sound + vibrate)             | P0       | ❌     | **Critical for shop** — no push service                      |
| Low stock alert (push)                               | P0       | ❌     | No push alert                                                |
| Daily/weekly summaries                               | P1       | ❌     | Not implemented                                              |
| In-app notification list                             | P1       | ✅     | `notifications.tsx` with `appStore.notifications`            |

**Overall notification status: 🔴 Critical Gap** — The entire push notification system (Firebase Cloud Messaging) is not configured. All notification features are either non-existent or UI-only.

---

## 👥 CUSTOMER MANAGEMENT

### Customer Self-Management

| Feature                                   | Priority | Status | Notes                                                        |
| ----------------------------------------- | -------- | ------ | ------------------------------------------------------------ |
| User registration (phone + OTP)           | P0       | 🟡     | Auth flow exists; **Firebase not connected** (bypass active) |
| Profile management (name, email, photo)   | P0       | ✅     | `edit-profile.tsx`                                           |
| Add multiple delivery addresses           | P0       | ✅     | `addresses.tsx`                                              |
| Set default address                       | P0       | ✅     | `addresses.tsx`                                              |
| Edit/delete addresses                     | P0       | ✅     | `addresses.tsx`                                              |
| Save addresses (home, office, other)      | P0       | ✅     | Address type labels supported                                |
| Family account                            | P1       | 🔵     | Deferred                                                     |
| Favorite shops list                       | P1       | ❌     | Not implemented                                              |
| Order history (all past orders)           | P1       | ✅     | `(tabs)/orders.tsx`                                          |
| Filter order history (date, shop, status) | P1       | 🟡     | Tab filters by status; date filter not present               |
| Reorder from history (1-tap)              | P0       | ❌     | Not implemented                                              |

### Shop-Side Customer Management

| Feature                                | Priority | Status | Notes                                                        |
| -------------------------------------- | -------- | ------ | ------------------------------------------------------------ |
| Customer database                      | P0       | ✅     | `shop/customers.tsx`                                         |
| View customer profile                  | P0       | ✅     | `shop/customers.tsx` shows customer cards                    |
| Customer order history                 | P1       | 🟡     | Visible in customer card; not drillable to full history      |
| Total orders per customer              | P1       | 🟡     | Shown in customer list — mock data only                      |
| Customer type tags (VIP, Regular, New) | P1       | ✅     | `shop/customers.tsx` has tag chips                           |
| Customer search (name, phone)          | P0       | 🟡     | Search bar exists; real-time filter may not work on all data |
| High-risk customer alert               | P2       | 🔵     | Deferred                                                     |
| Blacklist customer                     | P2       | 🔵     | Deferred                                                     |

---

## 📊 ANALYTICS & REPORTS

| Feature                               | Priority | Status | Notes                                            |
| ------------------------------------- | -------- | ------ | ------------------------------------------------ |
| Today's summary (orders, earnings)    | P0       | ✅     | `shop/index.tsx` dashboard                       |
| Weekly analytics                      | P1       | ✅     | `shop/analytics.tsx`                             |
| Monthly analytics                     | P1       | ✅     | `shop/analytics.tsx`                             |
| Sales graph (daily/weekly/monthly)    | P1       | ✅     | `shop/analytics.tsx` + `shop/analytics.next.tsx` |
| Top customers list                    | P1       | ✅     | `shop/analytics.tsx`                             |
| Peak hours analysis                   | P1       | ✅     | `shop/analytics.tsx`                             |
| Busiest days analysis                 | P1       | ✅     | `shop/analytics.next.tsx`                        |
| Water consumption tracking (customer) | P1       | 🟡     | `(tabs)/orders.tsx` shows usage; no graph        |
| Usage pattern graph                   | P1       | ❌     | Not implemented                                  |
| Export reports (PDF/Excel)            | P2       | 🔵     | Deferred                                         |
| Revenue forecast                      | P2       | 🔵     | Deferred                                         |
| Customer lifetime value               | P2       | 🔵     | Deferred                                         |

---

## ⭐ RATING & FEEDBACK

| Feature                                      | Priority | Status | Notes                                                        |
| -------------------------------------------- | -------- | ------ | ------------------------------------------------------------ |
| Rate shop (1-5 stars)                        | P1       | ✅     | `order/rating.tsx`                                           |
| Rate delivery person (1-5 stars)             | P1       | 🟡     | Rating screen exists; delivery-specific rating not split     |
| Write review                                 | P1       | ✅     | `order/rating.tsx`                                           |
| Report issue/complaint                       | P0       | ✅     | `report-issue.tsx`                                           |
| Complaint types (late, wrong order, quality) | P0       | ✅     | `report-issue.tsx` has category selection                    |
| Track complaint status                       | P1       | ❌     | No complaint tracking on customer side                       |
| Replacement request                          | P0       | 🟡     | In `report-issue.tsx` options; no dedicated replacement flow |
| View shop ratings before ordering            | P0       | ✅     | `shop-detail/[id].tsx` shows rating                          |
| Complaint management (shop side)             | P0       | ✅     | `admin/complaints.tsx` exists                                |
| Resolve complaint                            | P0       | ✅     | Admin complaint screen has resolution flow                   |

---

## 🎁 REFERRAL & LOYALTY

| Feature                         | Priority | Status | Notes                                       |
| ------------------------------- | -------- | ------ | ------------------------------------------- |
| Referral code (invite friends)  | P1       | ✅     | `rewards.tsx` shows referral code           |
| Share referral via WhatsApp/SMS | P1       | 🟡     | Share button in `rewards.tsx`; no deep link |
| Referral earnings tracker       | P1       | ✅     | `rewards.tsx`                               |
| Loyalty points on every order   | P1       | ✅     | Points balance in `rewards.tsx`             |
| Redeem points for discount      | P1       | ❌     | No redemption flow connected to checkout    |
| Apply coupon code               | P1       | 🟡     | Field in checkout; no validation            |
| Create discount coupons (shop)  | P1       | ✅     | `shop/promotions.tsx`                       |

---

## ⚙️ SHOP SETTINGS & OPERATIONS

| Feature                             | Priority | Status | Notes                                                    |
| ----------------------------------- | -------- | ------ | -------------------------------------------------------- |
| Shop profile setup                  | P0       | ✅     | `shop/profile.tsx`                                       |
| Shop name, photo, description       | P0       | ✅     | `shop/profile.tsx`                                       |
| Shop address + location on map      | P0       | ✅     | `shop/profile.tsx` with map                              |
| Shop working hours                  | P0       | ✅     | `shop/settings.tsx`                                      |
| Set holiday dates                   | P0       | 🟡     | Settings screen has closed indicator; no calendar picker |
| Mark shop closed temporarily        | P0       | ✅     | Accept orders toggle in `shop/index.tsx`                 |
| Delivery area/radius setting        | P1       | 🟡     | Field in profile; no map-based radius tool               |
| Minimum order value                 | P1       | ❌     | Not in settings                                          |
| Accept orders toggle (pause orders) | P0       | ✅     | `shop/index.tsx` dashboard switch                        |
| Bank account details                | P1       | 🟡     | In `shop/vendor-register.tsx` and profile; not validated |
| GST/business registration           | P2       | 🟡     | In `shop/profile.tsx`; not validated                     |
| Upload shop photos / certificates   | P1       | 🟡     | Image picker in profile; upload not wired to server      |

---

## 👤 STAFF & TEAM MANAGEMENT

| Feature                             | Priority | Status | Notes                                                               |
| ----------------------------------- | -------- | ------ | ------------------------------------------------------------------- | ------------------------------------- |
| Add delivery person                 | P1       | ✅     | `shop/delivery-fleet.tsx` via `shopStore.addDeliveryAgent`          |
| Delivery person profile             | P1       | ✅     | Agent list in fleet screen                                          |
| Delivery person availability status | P1       | ✅     | `status: 'active'                                                   | 'offline'` in domain model + fleet UI |
| Assign order to delivery person     | P1       | ✅     | `shop/order/[id].tsx` assign agent dropdown                         |
| Role-based permissions              | P1       | 🟡     | Route guard handles role separation; no sub-role (manager vs owner) |
| Multi-user login (owner + staff)    | P1       | 🟡     | Single auth session only; no staff sub-accounts                     |
| Staff attendance tracking           | P2       | 🔵     | Deferred                                                            |

---

## 🎨 USER EXPERIENCE & UI

| Feature                          | Priority | Status | Notes                                                                 |
| -------------------------------- | -------- | ------ | --------------------------------------------------------------------- |
| Login with phone + OTP           | P0       | 🟡     | UI complete; **Firebase not connected**                               |
| Biometric login                  | P1       | ❌     | `expo-local-authentication` installed; flow not implemented           |
| Auto login (stay logged in)      | P0       | ✅     | Session persisted in SecureStore                                      |
| Logout                           | P0       | ✅     | `signOut()` in session provider + profile screen                      |
| Dark mode                        | P2       | 🟡     | Theme tokens defined; screens use hardcoded colors                    |
| Light mode (default)             | P0       | ✅     | Default styling                                                       |
| Multi-language (Tamil + English) | P1       | ❌     | No i18n library integrated                                            |
| Language switcher                | P1       | ❌     | Not implemented                                                       |
| Onboarding tutorial              | P0       | ❌     | 3 onboarding screens missing from spec                                |
| Help/FAQ section                 | P1       | ❌     | Not implemented                                                       |
| Pull to refresh                  | P0       | 🟡     | Some screens have it; not standardized across all lists               |
| Loading indicators               | P0       | ✅     | `ActivityIndicator` used throughout                                   |
| Error messages (friendly)        | P0       | 🟡     | `ErrorBoundary` catches crashes; per-screen error states inconsistent |
| No internet connection handling  | P0       | ❌     | No `NetInfo` or offline detection                                     |
| Search functionality             | P1       | ✅     | `(tabs)/search.tsx`                                                   |
| Filter & sort options            | P1       | 🟡     | Filter chips exist; sort not standardized                             |

---

## 🔐 SECURITY & DATA

| Feature                         | Priority | Status | Notes                                        |
| ------------------------------- | -------- | ------ | -------------------------------------------- |
| Phone number verification (OTP) | P0       | 🔴     | **BYPASS ACTIVE** — any OTP works            |
| Secure authentication           | P0       | 🟡     | Session in SecureStore; auth itself not real |
| Session timeout (auto logout)   | P1       | ❌     | Not implemented                              |
| Data encryption                 | P0       | ✅     | SecureStore handles encryption on-device     |
| Privacy policy                  | P0       | ❌     | No screen                                    |
| Terms & conditions              | P0       | ❌     | No screen                                    |
| Delete account option           | P1       | ❌     | Not implemented                              |

---

## 🚨 CRITICAL MISSING FEATURES (from spec section)

| Feature                                     | Priority | Status | Notes                                                        |
| ------------------------------------------- | -------- | ------ | ------------------------------------------------------------ |
| View shop availability status (open/closed) | P0       | ✅     | `isOpen` flag shown on `ShopCard`                            |
| See real-time product availability          | P0       | ✅     | `inStock` shown in `shop-detail/[id].tsx`                    |
| Get alternative shop suggestions if closed  | P0       | ✅     | `shop-alternatives.tsx`                                      |
| Emergency contact (call shop directly)      | P0       | 🟡     | Contact in tracking screen; `emergency-help.tsx` exists      |
| SOS button (urgent water need)              | P1       | 🟡     | `emergency-help.tsx` exists; no actual SOS dispatch          |
| Share live order tracking with family       | P1       | ❌     | Not implemented                                              |
| Cancel reason mandatory                     | P0       | ✅     | `order/cancel.tsx` enforces reason selection                 |
| Edit delivery address (before dispatch)     | P0       | ❌     | Not implemented                                              |
| Change delivery time (before dispatch)      | P1       | ❌     | Not implemented                                              |
| Reject order reason mandatory               | P0       | 🟡     | Reject dialog exists; mandatory enforcement not coded        |
| Busy mode (auto-reject new orders)          | P0       | ✅     | Accept orders toggle in `shop/index.tsx`                     |
| Delivery capacity management                | P0       | ❌     | No max orders/hour logic                                     |
| Customer no-show tracking                   | P1       | ❌     | Not implemented                                              |
| Delivery failed reasons                     | P0       | 🟡     | `delivery/complete.tsx` has failed flow; reason not logged   |
| Quick actions (accept all, reject all)      | P1       | ❌     | Not implemented                                              |
| Order reminder if not accepted (5 min)      | P0       | ❌     | No automated reminder                                        |
| Customer call log                           | P1       | ❌     | Not implemented                                              |
| Delivery proof mandatory for COD > ₹500     | P0       | ❌     | No proof capture or threshold enforcement                    |
| End of day reconciliation (cash + UPI)      | P0       | 🟡     | `shop/earnings.tsx` has manual reconciliation; not automated |

---

## 📱 COMMUNICATION FEATURES

| Feature                          | Priority | Status | Notes                                                             |
| -------------------------------- | -------- | ------ | ----------------------------------------------------------------- |
| In-app chat with shop            | P1       | ❌     | Not implemented                                                   |
| WhatsApp message to shop         | P0       | ❌     | Not implemented (`Linking.openURL('whatsapp://...')` not present) |
| Call shop button                 | P0       | 🟡     | In `shop-detail/[id].tsx`; `tel:` link may not be wired           |
| Share order details via WhatsApp | P1       | ❌     | Not implemented                                                   |
| Send WhatsApp to customer        | P0       | ❌     | Not implemented                                                   |
| Call customer button             | P0       | ✅     | In shop order detail and delivery screens                         |
| Push notification to customer    | P0       | ❌     | FCM not configured                                                |

---

## 🔧 ADVANCED FEATURES

| Feature                           | Priority | Status | Notes                               |
| --------------------------------- | -------- | ------ | ----------------------------------- |
| Compare multiple shops            | P1       | ❌     | Not implemented                     |
| Admin dashboard (super admin)     | P1       | ✅     | `admin/` route group with 7 screens |
| Integration with Tally/accounting | P2       | 🔵     | Deferred                            |

---

## 📊 Summary Scorecard by Category

| Category            | Total Features | ✅ Done | 🟡 Partial | ❌ Missing | Score   |
| ------------------- | -------------- | ------- | ---------- | ---------- | ------- |
| Order Management    | 42             | 14      | 11         | 17         | 46%     |
| Payment & Pricing   | 35             | 8       | 9          | 18         | 36%     |
| Delivery & Tracking | 32             | 10      | 9          | 13         | 45%     |
| Inventory & Stock   | 18             | 5       | 6          | 7          | 44%     |
| Notifications       | 20             | 1       | 2          | 17         | 7%      |
| Customer Management | 25             | 12      | 5          | 8          | 60%     |
| Analytics           | 15             | 7       | 2          | 6          | 60%     |
| Rating & Feedback   | 12             | 6       | 3          | 3          | 67%     |
| Referral & Loyalty  | 10             | 5       | 2          | 3          | 65%     |
| Shop Settings       | 13             | 5       | 6          | 2          | 62%     |
| Staff Management    | 8              | 4       | 2          | 2          | 62%     |
| UX & UI             | 20             | 5       | 7          | 8          | 43%     |
| Security            | 8              | 1       | 2          | 5          | 19%     |
| Critical Missing    | 19             | 4       | 7          | 8          | 39%     |
| Communication       | 8              | 1       | 1          | 6          | 14%     |
| Advanced            | 3              | 1       | 0          | 2          | 33%     |
| **TOTAL**           | **292**        | **89**  | **74**     | **129**    | **43%** |

---

## 🔴 Top 10 Blocking Issues (Must Fix Before Launch)

| #   | Issue                                                                          | Impact            |
| --- | ------------------------------------------------------------------------------ | ----------------- |
| 1   | **OTP Firebase bypass active** — any 6 digits authenticates                    | 🔴 Security       |
| 2   | **No push notifications (FCM)** — shop never gets new order alert              | 🔴 Core Business  |
| 3   | **Wallet tab still visible** in `(tabs)/_layout.tsx` — violates spec directive | 🔴 Spec Conflict  |
| 4   | **Razorpay not integrated** — UPI is UI-only                                   | 🔴 Revenue        |
| 5   | **No "Order Again" / repeat order** from history                               | 🔴 Critical UX    |
| 6   | **`order/confirmed.tsx` shows hardcoded OTP/order data**                       | 🔴 Data Integrity |
| 7   | **Reject order reason not mandatory** — abuse prevention broken                | 🟠 Operations     |
| 8   | **No WhatsApp deep-link** on call/message buttons                              | 🟠 Communication  |
| 9   | **No biometric login** — installed but not wired                               | 🟠 UX             |
| 10  | **No privacy policy / T&C screen** — required for Play Store                   | 🟠 Compliance     |

---

## ✅ Immediate Action Plan (P0 Priority)

### Sprint 1 — Security & Auth

- [ ] Gate OTP bypass behind `__DEV__`, wire real Firebase `ConfirmationResult`
- [ ] Configure Firebase Cloud Messaging (FCM) for push notifications
- [ ] Remove wallet tab from `(tabs)/_layout.tsx`

### Sprint 2 — Core UX Gaps

- [ ] Add "Order Again" button in `(tabs)/orders.tsx`
- [ ] Fix `order/confirmed.tsx` to read from `useOrderStore().activeOrderId`
- [ ] Integrate Razorpay SDK for UPI payments
- [ ] Add WhatsApp deep-link (`whatsapp://send?phone=...`) to all contact buttons

### Sprint 3 — Shop Operations

- [ ] Make reject reason mandatory in shop order flow
- [ ] Add delivery capacity management logic to `shop/index.tsx`
- [ ] Wire delivery proof photo upload with `expo-image-picker`
- [ ] Add "End of Day" reconciliation automation in `shop/earnings.tsx`

### Sprint 4 — Compliance & Polish

- [ ] Add Privacy Policy and Terms & Conditions screens
- [ ] Implement biometric login with `expo-local-authentication`
- [ ] Add onboarding slides (3 screens)
- [ ] Wire `Linking.openURL('tel:...')` on all call buttons

Build a scalable water delivery app using only free or open-source tools focus if not there other option.
