# ThanniGo — Full Project Audit
**Date:** 2026-04-10 · **Auditor:** Antigravity  
**Codebase:** `d:\thanniGo\ThanniGoApp`  
**Stack:** Expo ~54 · Expo Router ~6 · React Native 0.81.5 · NativeWind 4 · Zustand 5 · Firebase Auth 24

---

## 1. Project Topology

```
ThanniGoApp/
├── app/                    ← Expo Router file-system routes
│   ├── _layout.tsx         ← Root stack + AppRouteGuard + ErrorBoundary
│   ├── index.tsx           ← Loading splash (guard delegates navigation)
│   ├── auth/               ← 4 screens: index, login, otp, role
│   ├── (tabs)/             ← Customer tabs: home, search, orders, wallet, profile
│   ├── order/              ← 7 stack screens
│   ├── shop/               ← Shop owner tab-group (15 screens + order sub-dir)
│   ├── delivery/           ← Delivery agent (4 screens)
│   ├── admin/              ← Admin dashboard (8 screens)
│   ├── shop-detail/        ← Customer shop detail [id]
│   └── <13 customer stack screens>
├── api/                    ← Axios client + shopApi + orderApi (mocked)
├── components/             ← ui/, stitch/, maps/, ErrorBoundary
├── constants/              ← theme.ts (palette, gradients, spacing, radius)
├── hooks/                  ← 6 hooks (navigation, session, back handler, scheme)
├── providers/              ← AppSessionProvider (auth state + route guard)
├── specs/                  ← openspec.yaml + implementation checklist
├── stores/                 ← 5 Zustand stores
├── types/                  ← domain.ts, session.ts
└── utils/                  ← mockData, safeNavigation, stitchRegistry, locationEvents
```

**Total screens implemented:** ~54 routes across all 4 user roles.

---

## 2. Architecture Health

### ✅ What's Working Well

| Area | Status |
|------|--------|
| **Navigation architecture** | Solid. Root guard (`AppRouteGuard`) handles all role-based redirects cleanly. `safeBack` + `useAndroidBackHandler` are standardized. |
| **Session persistence** | `AppSessionProvider` uses SecureStore (native) / AsyncStorage (web) — correct platform split. |
| **Design system** | `constants/theme.ts` is well-defined: palette, role gradients, spacing scale, radius tokens. |
| **Type safety** | `types/domain.ts` + `types/session.ts` cover all domain entities cleanly. |
| **State management** | 5 Zustand stores properly scoped: app, cart, shop, order, delivery. |
| **API layer** | Axios client with session-injecting interceptor + 401 handler. Shop/order APIs are properly stubbed with clear real-endpoint comments. |
| **Back navigation** | `useAndroidBackHandler` + `safeBack` pattern applied consistently. |
| **Error containment** | `ErrorBoundary` wraps entire app. |
| **Multi-role support** | 4 roles (customer, shop, admin, delivery) fully routed and guarded. |
| **Code quality** | No obvious dead imports, consistent naming conventions, well-commented dev bypass sections. |

---

## 3. Critical Issues (P0 — Fix Before Production)

### 🔴 C1: Firebase OTP Bypass Active in Production Code
**File:** `app/auth/otp.tsx:88–116`  
The `handleVerify()` function intentionally throws an error to fall into the catch block, bypassing all Firebase verification. **Any OTP (any 6 digits) grants full access.** This is the single most severe security gap.

```tsx
// otp.tsx:88-94
await confirm.confirm(code);  // confirm is null — will always throw
throw new Error("Local dev mock bypassing Firebase");  // redundant
// catch block: auth is granted unconditionally
```

**Risk:** An attacker entering any 6 digits on any phone number gets authenticated.  
**Fix:** Gate the bypass behind `__DEV__` and connect real Firebase confirmation object.

---

### 🔴 C2: `confirm` is Always `null`
**File:** `app/auth/otp.tsx:40`  
```tsx
const confirm: any = null;
```
No Firebase `ConfirmationResult` is ever passed from `login.tsx` → `otp.tsx`. The `confirm` variable is permanently `null`. Navigation params only carry `phone` and `role`, not the confirmation object. This means the Firebase integration is **structurally incomplete** — it cannot be turned on without a data-flow fix (e.g., shared context or SecureStore serialization).

---

### 🔴 C3: `order/confirmed.tsx` Uses All Hardcoded Data
**File:** `app/order/confirmed.tsx:30–33`  
```tsx
const otp = '4829';
const orderId = '#9831';
const shopName = 'Blue Spring Aquatics';
const eta = '12–15 mins';
```
The confirmation screen ignores the `activeOrderId` from `useOrderStore`. Real order data from checkout is never propagated here — OTP, shop, and total are all static strings.

---

### 🔴 C4: Google Maps API Key is Placeholder
**File:** `app.json:29`  
```json
"apiKey": "PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE"
```
Any `react-native-maps` usage on Android will silently fail or show a blank map without a valid key.

---

### 🔴 C5: `cartStore` Initializes with a Pre-Seeded Item
**File:** `stores/cartStore.ts:26`  
```tsx
items: { P001: 2 } as Record<string, number>,
```
`initialState` pre-populates the cart with 2 cans. `clearCart()` resets to this seeded state — meaning the cart is never truly empty after clear.

---

## 4. High-Priority Issues (P1 — Fix Before Beta)

### 🟠 H1: `order/confirmed.tsx` Back Navigation Policy
The `useAndroidBackHandler` redirects to `/(tabs)` on back — correct. But the "Track Live" button does `router.replace('/order/tracking')`, which also can't go back to confirmed. This is correct UX, but `tracking.tsx` should also use the same guard. **Verify `tracking.tsx` prevents going back to `confirmed`.**

---

### 🟠 H2: `cartStore.getDeliveryFee()` Has No shopId Guard
**File:** `stores/cartStore.ts:56–59`  
If `shopId` is `null` (empty cart), the fee defaults to `20` silently. The checkout UI may show a delivery fee even with an empty cart.

---

### 🟠 H3: OTP Screen Re-initiates `roleAccent`/`roleGradients` with Unsafe Fallback
**File:** `app/auth/otp.tsx:46–47`  
```tsx
const theme = roleGradients[role] ?? roleGradients.customer;
const accent = roleAccent[role] ?? roleAccent.customer;
```
`role` comes from `useLocalSearchParams` and is typed `AppRole` but is a raw string at runtime — it could be anything. The fallback is correct but no validation/toast is shown if an invalid role is passed.

---

### 🟠 H4: `deliveryStore.updateTaskStatus` Uses `any` Type
**File:** `stores/deliveryStore.ts:12`  
```tsx
updateTaskStatus: (taskId: string, status: any) => void;
```
`OrderStatus` from `domain.ts` should be used here. This defeats type-checking for all delivery task status updates.

---

### 🟠 H5: `shopStore` Has No Optimistic Update for Filter Changes
Filter state changes trigger no re-fetch. Combined with `loadShops()` only being called on mount (with no invalidation), filter-based sorting is purely client-side with stale data after first load — fine for mock, but will break with real APIs.

---

### 🟠 H6: `useAndroidBackHandler` Missing `segments` Dependency
**File:** `hooks/use-back-handler.ts:43`  
```tsx
}, [router, customFallback]);
```
`segments` is read inside the effect but is not in the dependency array. This is a stale closure bug — `isRoot` check will always use the initial segments value, not the current one.

**Fix:**
```tsx
}, [router, customFallback, segments]);
```

---

### 🟠 H7: `AppRouteGuard` Runs on Every Route Change (Costly)
**File:** `providers/AppSessionProvider.tsx:142–189`  
The guard's `useEffect` depends on `pathname` and `segments`, running on **every navigation event**. For a production app with many screen transitions, this adds unnecessary overhead. Consider debouncing or using a ref to track last-navigated target.

---

## 5. Medium-Priority Issues (P2 — Tech Debt)

### 🟡 M1: `safeNavigation.ts` Shows an Alert on Navigation Error
**File:** `utils/safeNavigation.ts:54–58`  
Showing `Alert` inside a utility function is a side effect that's hard to test and breaks the separation of concerns. The caller should handle error display.

---

### 🟡 M2: `orderStore.placeOrder` Has Inconsistent Indentation (Minor Code Smell)
**File:** `stores/orderStore.ts:26–30`  
Lines 27–30 are indented misaligned relative to the outer `try` block. Not a bug but signals a quick paste.

---

### 🟡 M3: `specs/thannigo-implementation-checklist.md` Has Trailing Unmapped Stitch Keys
**File:** `specs/thannigo-implementation-checklist.md:101–216`  
The bottom half of the checklist is a raw dump of stitch registry keys without checkboxes or task assignments. It's not machine-parseable as a real checklist anymore. Clean this up or move it to `utils/stitchRegistry.ts` exclusively.

---

### 🟡 M4: `backend/` Directory Exists but is Unexplored
The project root has a `backend/` directory that was not examined. If it contains server code co-located with the React Native app, it should be separated into its own package/repo for clarity.

---

### 🟡 M5: `app.json` Missing `splash` Config Key
The `expo-splash-screen` plugin is configured but there is no top-level `"splash"` key in `app.json`. Some Expo SDK versions require this for the splash screen to work correctly on older Android devices.

---

### 🟡 M6: Dark Mode Not Fully Implemented in Screens
`constants/theme.ts` defines a complete `Colors.dark` palette, but individual screens use hardcoded hex strings (e.g., `#f7f9ff`, `#181c20`) rather than pulling from the theme. Dark mode will have no effect on most screens.

---

### 🟡 M7: `api/client.ts` Points to Non-Existent Domain
```tsx
baseURL: 'https://api.thannigo.dev/v1',
```
This domain doesn't exist in production yet. Any inadvertent real API call in non-mocked code paths will either hang (10s timeout) or fail visibly. Consider using an env variable (`process.env.EXPO_PUBLIC_API_URL`) so this can be configured per environment.

---

## 6. Route Coverage Audit

### Customer Flow ✅ Complete
| Route | File | Status |
|-------|------|--------|
| `/auth` | `auth/index.tsx` | ✅ |
| `/auth/login` | `auth/login.tsx` | ✅ |
| `/auth/otp` | `auth/otp.tsx` | ✅ (⚠️ bypass active) |
| `/auth/role` | `auth/role.tsx` | ✅ |
| `/(tabs)` | `(tabs)/index.tsx` | ✅ |
| `/(tabs)/search` | `(tabs)/search.tsx` | ✅ |
| `/(tabs)/orders` | `(tabs)/orders.tsx` | ✅ |
| `/(tabs)/wallet` | `(tabs)/wallet.tsx` | ✅ |
| `/(tabs)/profile` | `(tabs)/profile.tsx` | ✅ |
| `/order/[id]` | `order/[id].tsx` | ✅ |
| `/order/checkout` | `order/checkout.tsx` | ✅ |
| `/order/confirmed` | `order/confirmed.tsx` | ✅ (⚠️ hardcoded data) |
| `/order/tracking` | `order/tracking.tsx` | ✅ |
| `/order/cancel` | `order/cancel.tsx` | ✅ |
| `/order/schedule` | `order/schedule.tsx` | ✅ |
| `/order/rating` | `order/rating.tsx` | ✅ |
| `/notifications` | `notifications.tsx` | ✅ |
| `/subscriptions` | `subscriptions.tsx` | ✅ |
| `/rewards` | `rewards.tsx` | ✅ |
| `/addresses` | `addresses.tsx` | ✅ |
| `/edit-profile` | `edit-profile.tsx` | ✅ |
| `/shop-detail/[id]` | `shop-detail/[id].tsx` | ✅ |
| `/report-issue` | `report-issue.tsx` | ✅ |
| `/emergency-help` | `emergency-help.tsx` | ✅ |
| `/wallet-history` | `wallet-history.tsx` | ✅ |
| `/map-preview` | `map-preview.tsx` | ✅ |
| `/search-map` | `search-map.tsx` | ✅ |
| `/shop-alternatives` | `shop-alternatives.tsx` | ✅ |
| `/location` | `location.tsx` | ✅ |

### Shop Owner Flow ✅ Complete
| Route | Status |
|-------|--------|
| `/shop` (dashboard) | ✅ |
| `/shop/inventory` | ✅ |
| `/shop/earnings` | ✅ |
| `/shop/customers` | ✅ |
| `/shop/profile` | ✅ |
| `/shop/settings` | ✅ |
| `/shop/promotions` | ✅ |
| `/shop/analytics` | ✅ |
| `/shop/analytics.next` | ✅ |
| `/shop/delivery` | ✅ |
| `/shop/delivery-fleet` | ✅ |
| `/shop/order/[id]` | ✅ |
| `/shop/manual-order` | ✅ |
| `/shop/vendor-register` | ✅ |
| `/shop/subscription-plans` | ✅ |

### Delivery Agent Flow ✅ Complete
| Route | Status |
|-------|--------|
| `/delivery` (dashboard) | ✅ |
| `/delivery/navigation` | ✅ |
| `/delivery/complete` | ✅ |

### Admin Flow ✅ Complete
| Route | Status |
|-------|--------|
| `/admin` | ✅ |
| `/admin/commission` | ✅ |
| `/admin/complaints` | ✅ |
| `/admin/customers` | ✅ |
| `/admin/inventory` | ✅ |
| `/admin/orders` | ✅ |
| `/admin/shops` | ✅ |

### ⚠️ Missing from Spec (Not Yet Implemented)
| Route | Spec Reference |
|-------|---------------|
| Onboarding slides (3 screens) | `onboarding_slide_1/2/3` |
| `/auth/biometric` follow-up | `P0 Auth` checklist |
| `/order/[id]/issue` (deep-link issue report) | Checklist |
| Admin role/permission management | `Admin Alignment` |

---

## 7. State Management Audit

| Store | Persisted? | Real API? | Notes |
|-------|-----------|-----------|-------|
| `appStore` | ❌ | ❌ | Notifications/subscriptions/rewards are all mock-only |
| `cartStore` | ❌ | ❌ | Pre-seeded cart item bug (C5) |
| `shopStore` | ❌ | ✅ stubbed | `loadShops()` hits `shopApi`, but data is still mock |
| `orderStore` | ❌ | ✅ stubbed | `placeOrder()` hits `orderApi`, but data is still mock |
| `deliveryStore` | ❌ | ❌ | Fully mock |

**Key gap:** No store data is persisted across app restarts except the session token. Order history, cart, delivery tasks will reset on every cold start.

---

## 8. Dependency Audit

| Package | Version | Note |
|---------|---------|------|
| `expo` | ~54.0.33 | ✅ Recent |
| `react-native` | 0.81.5 | ✅ |
| `expo-router` | ~6.0.23 | ✅ |
| `react` | 19.1.0 | ✅ Latest |
| `@react-native-firebase/auth` | ^24.0.0 | ⚠️ Installed but **not functionally connected** |
| `firebase` | ^12.11.0 | ⚠️ Web SDK also installed — potential duplicate Firebase init risk |
| `nativewind` | ^4.2.3 | ⚠️ Used (`global.css` + `tailwind.config.js`) but most screens use `StyleSheet` — inconsistent styling strategy |
| `react-native-reanimated` | ~4.1.1 | ✅ |
| `react-native-maps` | 1.20.1 | ⚠️ Web fallback needed (known issue from past conv) |
| `expo-secure-store` | ^55.0.13 | ✅ |
| `@shopify/flash-list` | ^2.3.1 | ✅ — verify it's actually used in list screens |
| `react-native-worklets` | 0.5.1 | ⚠️ Listed as dep but not verified as used — may be transitive |
| `expo-local-authentication` | ~17.0.8 | ⚠️ Installed but biometric flow is **not implemented** yet |

**Dual Firebase SDK risk:** Both `@react-native-firebase` (native module) and `firebase` (JS SDK) are listed. These should not both be active simultaneously as they can conflict. Decide on one SDK strategy.

---

## 9. Security Checklist

| Check | Status |
|-------|--------|
| OTP bypass active in production code | 🔴 FAIL |
| Firebase auth not connected | 🔴 FAIL |
| Google Maps key is placeholder | 🔴 FAIL |
| Session stored in SecureStore (native) | ✅ PASS |
| API auth header injected via interceptor | ✅ PASS (mock token) |
| Route guard blocks cross-role access | ✅ PASS |
| No sensitive data in `console.log` | ⚠️ PARTIAL — session data can appear in guard logs |
| Biometric not functional | 🟠 KNOWN GAP |

---

## 10. Prioritized Action Plan

### Immediate (Block Beta Release)
1. **[C1+C2]** Gate OTP bypass behind `__DEV__`. Wire `ConfirmationResult` from `login.tsx` → `otp.tsx` via context or route param serialization.
2. **[C3]** Connect `order/confirmed.tsx` to `useOrderStore().orders.find(o => o.id === activeOrderId)`.
3. **[C4]** Add a real Google Maps API key to `app.json`.
4. **[C5]** Fix `cartStore` initial state: `items: {}`.
5. **[H6]** Add `segments` to `useAndroidBackHandler` dependency array.

### Before Beta
6. **[H4]** Type `deliveryStore.updateTaskStatus` with `OrderStatus`.
7. **[M7]** Move `baseURL` to `EXPO_PUBLIC_API_URL` env variable.
8. **[M6]** Audit all screens and replace hardcoded hex colors with theme tokens.
9. **Dual Firebase SDK** — decide: native (`@react-native-firebase`) or web (`firebase`), remove the other.
10. **Biometric flow** — wire `expo-local-authentication` into auth post-OTP.

### Polish / Nice-to-Have
11. **Onboarding slides** — implement 3 onboarding screens per spec.
12. **Dark mode** — use `useThemeColor` hook across all screens.
13. **Persistent stores** — add `persist` middleware to `orderStore` + `cartStore` via `AsyncStorage`.
14. **`backend/` directory** — move to separate package if it contains server code.
15. **Stitch checklist cleanup** — clean `thannigo-implementation-checklist.md` trailing content.

---

## 11. Summary Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Navigation architecture | 9/10 | Excellent guard + safeBack pattern |
| Screen coverage | 8/10 | ~90% of spec implemented |
| Type safety | 7/10 | One `any` in delivery store, raw confirm type |
| Security | 3/10 | OTP bypass + no real Firebase = non-starter for prod |
| State design | 7/10 | Clean stores, but no persistence and seeding bug |
| UI consistency | 6/10 | Mixed StyleSheet/NativeWind, hardcoded colors |
| API readiness | 5/10 | Well-structured stubs, but 0% real endpoints wired |
| **Overall** | **6.4/10** | Strong foundation, critical auth gap before production |
