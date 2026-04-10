# ThanniGo Implementation Checklist

Source of truth:

- Spec: `specs/thannigo.openspec.yaml`
- Repo baseline: Expo Router routes in `app/`
- Checklist date: 2026-04-10

## Route Alignment Summary

Implemented routes already present:

- Auth: `/auth`, `/auth/role`, `/auth/login`, `/auth/otp`
- Customer: `/(tabs)`, `/(tabs)/orders`, `/(tabs)/wallet`, `/(tabs)/profile`
- Customer stack: `/order/[id]`, `/order/checkout`, `/order/tracking`, `/order/rating`, `/addresses`, `/edit-profile`, `/location`, `/map-preview`
- Shop: `/shop`, `/shop/customers`, `/shop/earnings`, `/shop/inventory`, `/shop/order/[id]`, `/shop/profile`, `/shop/settings`
- Admin: `/admin`, `/admin/inventory`, `/admin/shops`, `/admin/customers`, `/admin/orders`, `/admin/complaints`, `/admin/commission`

Missing routes to add:

- `/search`
- `/order/confirmed`
- `/report-issue` or `/order/[id]/issue`
- `/notifications`
- `/subscriptions`
- `/rewards`
- Delivery route group under `/delivery/*`
- Shop analytics/promotions/delivery management routes

## P0 Foundation

- [x] Replace scattered hardcoded colors with shared theme tokens aligned to the spec palette.
- [ ] Introduce central typed mock domain models for user, shop, order, product, payment, and inventory.
- [ ] Add shared state stores for auth, cart, orders, shop, and app settings.
      Current progress: auth/session persistence is now in `providers/AppSessionProvider.tsx`; cart/order/shop stores still pending.
- [x] Add route guards so customer, shop, and admin flows cannot cross-enter incorrectly.
- [ ] Standardize loading, empty, and error states for every list and detail screen.
- [ ] Add notification and haptic service abstractions instead of per-screen ad hoc behavior.

## P0 Auth

- [ ] Split current `/auth` experience into explicit splash/welcome vs onboarding intent from the spec.
- [ ] Upgrade `/auth/role` into full onboarding or add dedicated onboarding slides before role selection.
- [x] Keep `/auth/login` and `/auth/otp`, but connect them to real auth/session state.
- [ ] Add biometric follow-up and remembered session handling after OTP verification.

## P0 Customer Core

- [ ] Upgrade `/(tabs)` into full customer home with open/closed badges, filters, reorder card, and map/list toggle.
- [x] Add dedicated search route and advanced filter UX from the spec.
- [x] Refactor `/order/[id]` from product/order entry into true shop detail plus product selection.
- [x] Upgrade `/order/checkout` to full payment method, coupon, and price-summary flow.
- [x] Add dedicated `/order/confirmed` success screen with delivery OTP.
- [ ] Keep `/order/tracking`, but add cancel reason sheet and edit-address gating.
      Current progress: delivery contact actions and the timeline now read from shared order state.
- [ ] Add report-issue flow and connect `/order/rating` from delivered orders.
      Current progress: issue submission UI is now connected to the active order context and notifications handoff.
- [ ] Expand `/addresses` and `/edit-profile` to match profile/settings expectations from the spec.

## P0 Shop Core

- [ ] Upgrade `/shop` into the spec dashboard with accept-orders toggle, capacity, and low-stock awareness.
      Current progress: accept-orders, busy-mode, capacity, and low-stock dashboard UI are now present on `/shop`.
- [ ] Keep `/shop/order/[id]`, but add reject reasons, ETA picker, proof capture, and failed-delivery flows.
- [ ] Keep `/shop/inventory`, but add full/empty can tracking, stock log, and min-threshold management.
      Current progress: stitch-linked inventory management UI is present; deeper can-ledger and threshold logic still pending.
- [ ] Upgrade `/shop/earnings` with end-of-day reconciliation workflow.
- [ ] Keep `/shop/customers`, `/shop/profile`, and `/shop/settings`, but connect them to shared data/state.
      Current progress: settings navigation is aligned; customers/profile screens now have stitch-linked UI and some workflow wiring, but deeper shared-state parity is still pending.

## P1 Routes And Screens

- [x] Add `/notifications`.
- [x] Add `/subscriptions`.
- [x] Add `/rewards`.
- [x] Add `/shop/analytics`.
- [x] Add `/shop/promotions`.
- [x] Add `/shop/delivery`.

## Delivery App

- [x] Create `/delivery` route group and layout.
- [x] Add assigned orders screen.
- [x] Add navigation/live trip screen.
- [x] Add OTP confirmation screen.
- [x] Add delivery completion and failed-delivery flows.

## Admin Alignment

- [ ] Preserve current `/admin/*` routes.
- [ ] Fold current admin screens into the spec as the formal super-admin module instead of treating them as out-of-band.
- [ ] Define admin roles, permissions, and navigation in the spec.

## Verification

- [ ] Smoke test auth -> customer order flow.
- [ ] Smoke test auth -> shop order handling flow.
- [ ] Verify deep links and back navigation between tabs and stack routes.
- [ ] Run `npm run lint`.

- [X]Generate full Expo app from OpenSpec with all screens, navigation, filters, workflows, Zustand state, and stitch UI integration.Generate full Expo app from OpenSpec with all screens, navigation, filters, workflows, Zustand state, and stitch UI integration.

1.  Audit remaining partial screens and identify missing navigation/button flows against stitchRegistry + OpenSpec
2.  Implement shared stitch/OpenSpec screen metadata and finish remaining customer partial screens
3.  Upgrade shop/delivery/admin partial screens and wire missing button navigation/workflows
4.  Run verification (typecheck, targeted lint/smoke review) and reconcile the checklist with implemented coverage

5.Make all UI screens clear and user-friendly, using stitchRegistry as the design reference.

[UI QUALITY CHECKLIST]

1. Layout

- Proper spacing (8px grid)
- No overlapping elements
- Responsive (mobile friendly)

2. Clarity

- Screen purpose clear in 3 seconds
- No clutter / unnecessary UI
- Proper headings

3. Navigation

- Back button present
- CTA clearly visible
- Flow matches workflow

4. Components

- Buttons consistent (height 52, radius 14)
- Inputs aligned
- Cards uniform

5. Colors

- Use primary #0077BE correctly
- Status colors (green/red/orange)
- No random colors

6. Filters (if applicable)

- Search visible
- Filter usable
- Real-time update

7. UX

- Easy to use (1–2 taps max)
- No confusion
- Proper empty states

8. Logic Mapping

- Matches OpenSpec screen
- Matches workflow step
- Matches user role

9. Stitch Mapping

- Screen exists in stitchRegistry
- Path valid
- No duplicate screens

10. Performance

- No heavy UI
- Smooth scroll

by

customerHome: "customer_home",
search_filters: "search_filters",
shop_availability_alternatives: "shop_availability_alternatives",
search: "search_filter",
searchMap: "search_map_view",
orderConfirmed: "order_confirmation_success",
notifications: "same_additiona_scrrens/notifications_complaints",
subscriptions: "subscription_plans",
subscription_loyalty_shop: "subscription_loyalty_shop",
rewards: "referrals_loyalty",
reportIssue: "report_issue",
shopAnalytics: "shop_analytics",
shopPromotions: "promotions_loyalty",
shopDelivery: "delivery_management_tracking",
live_order_tracking: "same_additiona_scrrens/live_order_tracking",
deliveryDashboard: "delivery_mode_dashboard_3",
deliveryTrip: "delivery_active_trip",
deliveryOtp: "delivery_otp_verification",
deliveryComplete: "failed_delivery_reschedule",
cancel_order: "cancel_order",
cancel_order_reason: "cancel_order_reason",
customer_management_shop: "customer_management_shop",
customer_subscription_plans: "customer_subscription_plans",
emergency_help: "emergency_help",
inventory_management: "inventory_management",
manual_order_entry: "manual_order_entry",
my_wallet: "my_wallet",
wallet_history: "same_additiona_scrrens/wallet_history",
onboarding_slide_1: "onboarding_slide_1",
onboarding_slide_2: "onboarding_slide_2",
onboarding_slide_3: "onboarding_slide_3",
order_summary: "order_summary",
order_confirmation: "same_additiona_scrrens/order_confirmation",
order_history: "same_additiona_scrrens/order_history",
shop_dashboard_home_1: "shop_dashboard_home_1",
shop_settings_profile: "shop_settings_profile",
shop_vendor_registration_1: "shop_vendor_registration_1",
shop_vendor_registration_2: "shop_vendor_registration_2",
splash_screen: "splash_screen",
customer_profile: "same_additiona_scrrens/customer_profile",
rate_review_customer: "same_additiona_scrrens/rate_review_customer",
schedule_delivery: "same_additiona_scrrens/schedule_delivery",
shop_earnings: "shop_earnings",
