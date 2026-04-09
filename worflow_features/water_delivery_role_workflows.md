# 💧 Water Delivery App — Role-Wise Workflows

> **Complete step-by-step workflows for every role in the app.**
> Based on full feature list • P0 = Must Have • P1 = Important • P2 = Future

---

## 👤 Roles Overview

| Role | App | Purpose |
|------|-----|---------|
| **Customer** | Customer App | Orders water, tracks delivery, manages account |
| **Shop Owner** | Shop App | Accepts orders, manages stock, runs business |
| **Delivery Person** | Shop App (Delivery Mode) | Picks up & delivers orders to customers |
| **Shop Staff / Manager** | Shop App | Assists owner, handles order operations |

---

## 🛒 ROLE 1 — CUSTOMER

### Workflow 1.1 — First Time Setup
> **Goal:** Get the app ready to place first order

1. Download app → Open → **Login with phone number + OTP** *(P0 · Free · New)*
2. Complete **onboarding tutorial** *(P0 · Free · New)*
3. **Set up profile** (name, email, photo) *(P0 · Free · New)*
4. **Add delivery address** (home / office / other) *(P0 · Free · New)*
5. **Set default address** *(P0 · Free · New)*
6. App **auto-detects location** → shows nearby shops *(P0 · Free · Existing)*

---

### Workflow 1.2 — Placing an Order
> **Goal:** Order water cans quickly and confirm delivery

1. Open app → **Browse shops** (list + map view) *(P0 · Free · New)*
2. **Filter shops** by rating, distance, price *(P0 · Free · New)*
3. **View shop ratings** from other customers before ordering *(P0 · Free · New)*
4. Tap shop → **View shop profile** (hours, products, ratings) *(P0 · Free · New)*
5. Check **shop is open** (real-time availability status) *(P0 · Free · Critical)*
6. Check **product availability** (20L / 10L in stock) *(P0 · Free · Critical)*
7. **Select product + quantity** (1–50 cans) *(P0 · Free · New)*
8. **View order summary** before confirming *(P0 · Free · New)*
9. **Add delivery notes** (gate code, landmark, floor) *(P0 · Free · New)*
10. Choose delivery type:
    - **Instant delivery (ASAP)** *(P0 · Free · Existing)*
    - **Schedule delivery** (date + time slot) *(P0 · Free · Existing)*
11. **See price breakdown** (product + delivery + tax) *(P0 · Free · New)*
12. Choose payment: **COD** or **UPI (GPay/PhonePe/Paytm)** *(P0 · Free · Existing)*
13. Confirm order → **Receive order placed notification** *(P0 · Free · New)*

---

### Workflow 1.3 — Tracking an Order
> **Goal:** Know exactly where the order is at all times

1. **Receive: Order accepted by shop** notification *(P0 · Free · New)*
2. **Receive: Order preparing** notification *(P0 · Free · New)*
3. **Receive: Out for delivery** notification *(P0 · Free · New)*
4. **Track order status** (Placed → Accepted → Preparing → Out → Delivered) *(P0 · Free · Existing)*
5. View **delivery person name + photo + contact number** *(P0 · Free · New)*
6. **Call delivery person** (1-tap) if needed *(P0 · Free · Existing — Critical)*
7. **WhatsApp delivery person** *(P1 · Free · New)*
8. **Receive: Delivered** notification *(P0 · Free · New)*
9. Confirm delivery with **OTP verification** *(P0 · Free · Critical)*

---

### Workflow 1.4 — Modifying or Cancelling an Order
> **Goal:** Make changes before the order is dispatched

1. **Edit order** (before shop accepts) *(P1 · Free · New)*
2. **Edit delivery address** (before dispatch) *(P0 · Free · Critical)*
3. **Change delivery time** (before dispatch) *(P1 · Free · Critical)*
4. **Cancel order** (before dispatch) *(P0 · Free · New)*
5. **Select cancel reason** (mandatory, prevents abuse) *(P0 · Free · Critical)*

---

### Workflow 1.5 — Reordering (Returning Customer)
> **Goal:** Reorder in as few taps as possible

1. Open app → Go to **Order History** *(P1 · Free · Existing)*
2. Find previous order → Tap **"Order Again"** (1-tap reorder) *(P0 · Free · New)*
3. Confirm address + payment → Place order
4. OR use **"Repeat Last Order"** from home screen *(P0 · Free · Existing — Critical)*

---

### Workflow 1.6 — Subscription Setup
> **Goal:** Set up recurring water deliveries

1. Browse shop → Choose **subscription plan** (daily / weekly / monthly) *(P1 · Paid · Existing)*
2. Set preferred **delivery time slot** *(P1 · Free · Existing)*
3. Choose **quantity per delivery** *(P1 · Paid · New)*
4. Set **payment method** (UPI auto-collect / wallet) *(P1 · Paid · Existing)*
5. Activate subscription → **Receive subscription confirmation**
6. **Modify subscription** anytime (change time / quantity) *(P1 · Paid · New)*
7. **Pause subscription** (vacation mode) *(P1 · Paid · Existing)*
8. **Resume subscription** with 1 tap *(P1 · Paid · New)*
9. **Receive: Subscription renewal reminder** *(P1 · Paid · New)*

---

### Workflow 1.7 — Raising a Complaint / Replacement
> **Goal:** Report an issue and get it resolved

1. Open order → Tap **"Report Issue"** *(P0 · Free · Existing — Critical)*
2. Select **complaint type** (late, wrong order, bad quality, rude delivery) *(P0 · Free · New)*
3. Request **replacement** (bad water / leaking can) *(P0 · Free · Existing)*
4. Request **refund** *(P1 · Free · New)*
5. **Track complaint status** *(P1 · Free · New)*
6. Receive **resolution notification**

---

### Workflow 1.8 — Wallet & Payments
> **Goal:** Manage wallet and payment methods

1. **Add money to wallet** *(P1 · Paid · New)*
2. **View wallet balance** at any time *(P1 · Paid · Existing)*
3. Use **wallet + cash (split payment)** for an order *(P2 · Paid · Existing)*
4. **Save UPI ID** for quick payment *(P1 · Free · New)*
5. View **payment history** *(P1 · Free · New)*
6. View **outstanding balance** (if on credit) *(P1 · Paid · New)*
7. Receive **payment due reminder** *(P1 · Paid · New)*

---

### Workflow 1.9 — Referring Friends
> **Goal:** Earn rewards by inviting friends

1. Open profile → **Get referral code** *(P1 · Paid · Existing)*
2. **Share via WhatsApp / SMS** *(P1 · Paid · New)*
3. Friend signs up → Uses code → **Both get bonus**
4. Track **referral earnings** in app *(P1 · Paid · Existing)*
5. Earn **loyalty points** on every order → **Redeem for discounts** *(P1 · Paid · New)*

---

## 🏪 ROLE 2 — SHOP OWNER

### Workflow 2.1 — Shop Onboarding (First Time Setup)
> **Goal:** Go live and start receiving orders

1. Download Shop App → **Login with phone + OTP** *(P0 · Free · New)*
2. **Create shop profile**: name, photo, description *(P0 · Free · New)*
3. Set **shop address + location on map** *(P0 · Free · New)*
4. Set **working hours** (open / close time) *(P0 · Free · Existing)*
5. Set **delivery area / radius** (e.g. 2km, 5km) *(P1 · Free · Existing)*
6. **Add product variants** (20L, 10L, 5L) with **prices** *(P0 · Free · New)*
7. Set **minimum order value** *(P1 · Free · New)*
8. Set **maximum orders per day limit** *(P1 · Free · New)*
9. Add **initial stock count** (full cans + empty cans) *(P0 · Free · New)*
10. Upload **water quality certificate** *(P1 · Free · New)*
11. Toggle **"Accept Orders"** → Go Live *(P0 · Free · New)*

---

### Workflow 2.2 — Handling Incoming Orders
> **Goal:** Accept, prepare and dispatch orders efficiently

1. **Receive new order alert** (sound + vibrate) *(P0 · Free · Existing — Critical)*
2. View **order details** (customer, items, address, notes) *(P0 · Free · Existing)*
3. Check stock → **Accept order** *(P0 · Free · Existing)*
   - OR **Reject order** with mandatory reason *(P0 · Free · Critical)*
4. **Set estimated delivery time (ETA)** *(P0 · Free · New)*
5. **Mark order: Preparing** *(P0 · Free · New)*
6. **Assign delivery person** *(P1 · Paid · New)*
7. **Mark order: Out for Delivery** *(P0 · Free · New)*
8. Customer notified automatically at each step
9. Delivery person completes delivery → **Mark Delivered** *(P0 · Free · Existing)*
10. **Upload delivery proof photo** (for COD orders > ₹500) *(P1 · Free · New — Critical)*

---

### Workflow 2.3 — Managing Order Queue (Busy Hours)
> **Goal:** Stay in control when orders are coming in fast

1. View **Order List tabs**: New / Preparing / Out / Delivered *(P0 · Free · Existing)*
2. **Filter orders** (today / pending / completed) *(P0 · Free · New)*
3. **Search orders** (customer name, order ID) *(P1 · Free · New)*
4. If overwhelmed → Enable **Busy Mode** (auto-reject new orders) *(P0 · Free · Critical)*
5. Set **Delivery Capacity** (max orders per hour, e.g. 5) *(P0 · Free · Critical)*
6. **Block delivery slots** when busy *(P1 · Free · New)*
7. **If order not accepted in 5 min** → auto-reminder fires *(P0 · Free · Critical)*
8. Use **Quick Actions**: Accept All / Reject All *(P1 · Free · Critical)*

---

### Workflow 2.4 — Inventory Management (Daily)
> **Goal:** Keep accurate stock, never run out unexpectedly

1. Check **full cans count** at start of day *(P0 · Free · Existing — Critical)*
2. Check **empty cans count** *(P0 · Free · Existing — Critical)*
3. Each order dispatched → **Stock auto-decremented** *(P0 · Free · New)*
4. Empty cans returned by customer → **Update return can count** *(P0 · Free · Existing)*
5. Receive **low stock alert** when below threshold *(P0 · Free · Existing)*
6. Supplier delivers → **Add stock** (update full cans) *(P0 · Free · New)*
7. Damaged can found → **Log damage adjustment** *(P1 · Free · New)*
8. End of day → **Daily stock reconciliation** *(P1 · Free · New)*

---

### Workflow 2.5 — Payment Collection & End-of-Day
> **Goal:** Track all money in and out for the day

1. Delivery done → **Record payment** (cash or UPI) *(P0 · Free · New)*
2. **Mark order: Paid / Unpaid** *(P0 · Free · New)*
3. View **Cash vs UPI breakdown** anytime *(P0 · Free · Existing)*
4. View **Daily earnings summary** *(P0 · Free · Existing)*
5. End of day → **End-of-Day Reconciliation** (cash + UPI totals) *(P0 · Free · Critical)*
6. **Generate bill / invoice** for customers if needed *(P1 · Free · New)*
7. Follow up on **pending payments** (credit customers) *(P1 · Paid · New)*
8. **Send payment reminder** to customer *(P1 · Paid · New)*

---

### Workflow 2.6 — Customer Management
> **Goal:** Know your customers and serve them better

1. View **customer database** (all customers) *(P0 · Free · New)*
2. **Search customer** by name or phone *(P0 · Free · New)*
3. View **customer order history** + total orders + total spent *(P1 · Free / Paid · New)*
4. **Tag customer** (VIP / Regular / New / Lost) *(P1 · Paid · Existing)*
5. **Add notes** about customer (e.g. "prefers morning delivery") *(P1 · Paid · New)*
6. Track **customer deposits** (can deposits) *(P1 · Paid · Existing)*
7. **Set COD limit** for risky customers *(P2 · Paid · Existing)*
8. **Blacklist** a customer after repeated fake orders *(P2 · Paid · Existing)*

---

### Workflow 2.7 — Handling Complaints
> **Goal:** Resolve issues quickly and retain customer trust

1. Receive **complaint notification** *(P0 · Free · New)*
2. View **complaint details** (type, order, customer) *(P0 · Free · New)*
3. Contact customer — **Call / WhatsApp** *(P0 · Free · New)*
4. **Resolve complaint** + add resolution notes *(P0 · Free · New)*
5. Process **replacement order** if needed *(P1 · Free · New)*
6. Process **refund** if applicable *(P1 · Paid · New)*
7. Track **complaint resolution status**

---

### Workflow 2.8 — Promotions & Loyalty
> **Goal:** Attract new customers and retain regulars

1. **Create discount coupon** (amount / percentage off) *(P1 · Paid · New)*
2. Set **coupon validity** (dates, max uses) *(P1 · Paid · New)*
3. Set **bulk discount rules** (e.g. 10+ cans = 5% off) *(P1 · Paid · Existing)*
4. Enable **first-time customer auto-discount** *(P1 · Paid · New)*
5. Run **festive / seasonal pricing** *(P2 · Paid · New)*
6. Track **coupon usage** *(P1 · Paid · New)*
7. View **referral performance** *(P1 · Paid · New)*

---

### Workflow 2.9 — Analytics & Business Review
> **Goal:** Understand business performance and make better decisions

1. View **Today's summary** (orders count, earnings) *(P0 · Free · New)*
2. View **Weekly / Monthly analytics** *(P1 · Paid · Existing)*
3. Check **Top customers list** *(P1 · Paid · Existing)*
4. Analyze **peak hours** (morning vs evening orders) *(P1 · Paid · Existing)*
5. Review **busiest days** of week *(P1 · Paid · New)*
6. Analyze **cancellation reasons** to reduce drop-offs *(P2 · Paid · Existing)*
7. Review **payment method breakdown** (UPI vs cash ratio) *(P1 · Paid · New)*
8. Review **new vs returning customers** trend *(P1 · Paid · New)*

---

## 🚴 ROLE 3 — DELIVERY PERSON

### Workflow 3.1 — Starting a Delivery Shift
> **Goal:** Get ready to deliver

1. Open Shop App → **Start Delivery Mode** *(P0 · Free · Existing)*
2. Set **availability status: Online** *(P1 · Paid · New)*
3. View **assigned orders** for the shift *(P1 · Paid · New)*
4. View **all deliveries on map** *(P1 · Paid · Existing)*

---

### Workflow 3.2 — Completing a Delivery
> **Goal:** Deliver order to customer and confirm

1. Receive **order assigned** notification *(P1 · Paid · New)*
2. View **order details**: customer name, address, items, notes *(P0 · Free · Existing)*
3. Tap **"Navigate to Customer"** → Opens Maps with directions *(P0 · Free · New)*
4. **Call customer** (1-tap) if needed *(P0 · Free · Existing)*
5. **WhatsApp customer** *(P1 · Free · New)*
6. Arrive at location → Hand over cans
7. Collect **empty cans** from customer (if exchange)
8. Collect **payment** (if COD)
9. **Mark order: Delivered** *(P0 · Free · Existing)*
10. **Upload delivery proof photo** *(P1 · Free · New)*
11. Get **OTP from customer** to confirm delivery *(P0 · Free · Critical)*
12. If customer absent → Log **failed delivery reason** *(P0 · Free · Critical)*
13. **Reschedule delivery** if failed *(P1 · Free · New)*

---

### Workflow 3.3 — Handling Delays
> **Goal:** Keep customer informed when delivery is late

1. Realize delivery will be delayed
2. **Update delivery time** in app *(P0 · Free · New)*
3. App **auto-notifies customer** of delay *(P0 · Free · New)*
4. Continue to customer

---

## 👨‍💼 ROLE 4 — SHOP STAFF / MANAGER

### Workflow 4.1 — Daily Order Operations
> **Goal:** Assist owner in managing order flow

1. **Login** with staff credentials (role: manager) *(P1 · Paid · Existing)*
2. Monitor **incoming orders** *(P0 · Free · Existing)*
3. **Accept / Reject orders** on behalf of shop *(P0 · Free · Existing)*
4. **Update order status** manually *(P0 · Free · New)*
5. **Enter manual orders** (phone orders from walk-in customers) *(P0 · Free · Existing)*
6. **Record cash payments** collected *(P0 · Free · New)*

---

### Workflow 4.2 — Stock Management
> **Goal:** Keep inventory accurate throughout the day

1. **Add stock** when supplier delivers *(P0 · Free · New)*
2. **Remove stock** as orders go out *(P0 · Free · New)*
3. Log **empty can returns** from delivery person *(P0 · Free · Existing)*
4. Flag **damaged cans** *(P2 · Paid · New)*
5. Report stock level to owner via daily summary

---

## 🔔 CROSS-ROLE: Notification Flows

| Trigger | Who Gets Notified | Type |
|---------|-------------------|------|
| Customer places order | Shop Owner / Staff | Sound + vibrate alert |
| Shop accepts order | Customer | Push notification |
| Order out for delivery | Customer | Push notification |
| Order delivered | Customer | Push notification |
| Order cancelled | Customer + Shop | Push notification |
| Low stock (< threshold) | Shop Owner | Alert |
| New complaint | Shop Owner | Push notification |
| Payment received | Shop Owner | Notification |
| Subscription renewal due | Customer | Reminder |
| Water running low (auto) | Customer | Reminder (Critical) |
| Daily summary | Shop Owner | Daily digest |

---

## 🚨 CRITICAL FEATURES — Must Build Before Launch

These are zero-cost features that, if missing, will break user trust:

| # | Feature | Role Affected |
|---|---------|---------------|
| 1 | View shop open/closed status in real-time | Customer |
| 2 | Real-time product availability (in stock / out) | Customer |
| 3 | Delivery OTP verification | Customer + Delivery |
| 4 | Edit delivery address before dispatch | Customer |
| 5 | Reject order reason mandatory | Shop Owner |
| 6 | Busy mode (auto-reject when overwhelmed) | Shop Owner |
| 7 | Order reminder if not accepted in 5 min | Shop Owner |
| 8 | End-of-day cash + UPI reconciliation | Shop Owner |
| 9 | Failed delivery reason logging | Delivery Person |
| 10 | Cancel reason mandatory (prevents fake orders) | Customer |

---

## 📊 Feature Priority Summary by Role

| Role | P0 (MVP) | P1 (Important) | P2 (Future) |
|------|----------|----------------|-------------|
| Customer | 35 | 28 | 12 |
| Shop Owner | 30 | 45 | 20 |
| Delivery Person | 8 | 10 | 4 |
| Shop Staff | 6 | 5 | 2 |

---

## 🏗️ Recommended Build Order

### Phase 1 — MVP (Launch Ready)
Focus: Core order flow works end-to-end for customer + shop

- Customer: Registration → Browse → Order → Track → Receive
- Shop: Receive alert → Accept → Mark status → Delivery
- Both: Notifications at every step
- All P0 + Critical Missing features

### Phase 2 — Stickiness
Focus: Make customers come back, give shops business tools

- Subscription plans, reorder shortcuts
- Inventory management, daily earnings
- Customer management, complaint handling
- Payment history, wallet

### Phase 3 — Growth
Focus: Referrals, loyalty, analytics, staff management

- Referral system, loyalty points
- Weekly/monthly analytics, top customers
- Delivery person management, route optimization
- Promotional campaigns, coupon system

### Phase 4 — Advanced (Paid Tier)
Focus: Power features for high-volume shops

- Real-time GPS tracking
- AI-based demand forecasting
- Tally/accounting integration
- Multi-branch management

---

*Generated from Water Delivery App Feature List • All "New" features listed are ZERO external API cost*
