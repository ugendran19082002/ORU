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
- [ ] Add dedicated search route and advanced filter UX from the spec.
- [ ] Refactor `/order/[id]` from product/order entry into true shop detail plus product selection.
- [ ] Upgrade `/order/checkout` to full payment method, coupon, and price-summary flow.
- [ ] Add dedicated `/order/confirmed` success screen with delivery OTP.
- [ ] Keep `/order/tracking`, but add cancel reason sheet, edit-address gating, delivery contact actions, and timeline parity.
- [ ] Add report-issue flow and connect `/order/rating` from delivered orders.
- [ ] Expand `/addresses` and `/edit-profile` to match profile/settings expectations from the spec.

## P0 Shop Core

- [ ] Upgrade `/shop` into the spec dashboard with accept-orders toggle, capacity, and low-stock awareness.
- [ ] Keep `/shop/order/[id]`, but add reject reasons, ETA picker, proof capture, and failed-delivery flows.
- [ ] Keep `/shop/inventory`, but add full/empty can tracking, stock log, and min-threshold management.
- [ ] Upgrade `/shop/earnings` with end-of-day reconciliation workflow.
- [ ] Keep `/shop/customers`, `/shop/profile`, and `/shop/settings`, but connect them to shared data/state.

## P1 Routes And Screens

- [ ] Add `/notifications`.
- [ ] Add `/subscriptions`.
- [ ] Add `/rewards`.
- [ ] Add `/shop/analytics`.
- [ ] Add `/shop/promotions`.
- [ ] Add `/shop/delivery`.

## Delivery App

- [ ] Create `/delivery` route group and layout.
- [ ] Add assigned orders screen.
- [ ] Add navigation/live trip screen.
- [ ] Add OTP confirmation screen.
- [ ] Add delivery completion and failed-delivery flows.

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
