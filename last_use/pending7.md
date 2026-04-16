# PROMPT 7 — Shop Search & Discovery: List View, Map View, Smart Filters & UX Design

## Context
Reuse existing architecture, components, and APIs wherever possible.
Extend or modify only when necessary. Annotate all new additions inline.

**Tech Stack:** Node.js + Sequelize + MySQL | React Native (Expo)
**Rules:** Paginated APIs | Geo-indexed queries | Performance-first design

---

## 1. DEFAULT EXPERIENCE (APP OPEN)

```
App opens → Auto-detect user GPS location
  → Query nearest shops (within default radius, e.g., 10 km)
  → Show: top 3–5 nearest shops as quick cards
  → Below cards: mini map preview with shop pins
  → CTA: "View all shops" → full discovery screen
```

**API behavior:**
- GET `/api/shops/nearby?lat=&lng=&limit=5`
- Returns: shop_id, name, distance, rating, delivery_charge, delivery_time_estimate, is_open, tags
- Response sorted by: distance ASC by default

---

## 2. VIEW MODES

**Toggle options:**
- **List View:** shop cards in vertical scroll (default)
- **Map View:** full-screen map with shop pins
- **Split View:** map top half, scrollable list bottom half

**State persistence:** Remember last used view mode per session

---

## 3. LIST VIEW — SHOP CARD DESIGN

**Each card displays:**
- Shop name | Distance (e.g., 1.2 km)
- Rating ⭐ (average + count)
- Estimated delivery time (e.g., "~20 mins")
- Delivery charge (e.g., "₹20" or "Free")
- Open / Closed badge (color-coded: green / red)
- Tags (max 2 per card): Fast Delivery | Best Price | Popular | Featured | New

**Priority ordering in list:**
1. Featured shops (admin-flagged)
2. Previously ordered shops (personalized)
3. Nearest open shops
4. Closed shops (at bottom, greyed out)

---

## 4. MAP VIEW — BEHAVIOR

**Map elements:**
- User location pin (distinct icon)
- Shop pins (clustered when multiple shops are nearby)
- Cluster badge shows count (e.g., "5 shops")

**Interactions:**
- Tap cluster → zoom in to reveal individual pins
- Tap shop pin → show bottom sheet with shop card (name, distance, rating, CTA)
- Swipe between shop cards in bottom sheet → map auto-pans to focused shop
- Filters applied in real-time → pins update without full reload

---

## 5. SEARCH FUNCTION

**Search bar behavior:**
- Sticky at top of screen
- Triggers on input with debounce (300ms)
- Shows: auto-suggestions (shop names + product names + area names)
- Stored per session: recent searches (last 5)
- Popular searches: pre-loaded from backend (top searched terms)

**Search scope:**
- Shop name (primary)
- Product name (e.g., searching "20L can" shows shops carrying that product)
- Area / pincode / landmark name

**API:** GET `/api/shops/search?q=&lat=&lng=&page=&limit=`

---

## 6. FILTER SYSTEM

**Quick filter chips (horizontal scroll, single/multi-select):**
- Open Now | Free Delivery | Fast Delivery | High Rated | Nearest | Offers Available

**Advanced filters (bottom sheet):**
- Delivery time range (e.g., under 30 mins)
- Max delivery charge (slider)
- Min rating (1–5 stars)
- Shop category / type
- Distance range (slider, max km)

**Filter API behavior:**
- All filters appended as query params to shop list API
- Active filter count shown as badge on filter button
- "Clear all" resets to defaults

---

## 7. SORT OPTIONS

**Sort by (dropdown / sheet):**
- Nearest (default)
- Fastest delivery
- Lowest delivery charge
- Highest rating
- Most popular (order volume based)

**Sort persists during session; resets on app restart**

---

## 8. PERSONALIZATION

**Data sources (local + backend):**
- Previous orders → boost shops previously ordered from
- Frequency: shops ordered from 3+ times → "Your frequent shops" section
- Recently viewed shops → shown in a horizontal scroll at top

**Backend query:**
- GET `/api/shops/personalized?user_id=&lat=&lng=` → returns mix of nearby + previously ordered

---

## 9. PERFORMANCE OPTIMIZATION

**Backend:**
- Shops table indexed on: `(lat, lng)` using spatial index (MySQL POINT column + SPATIAL INDEX)
- Paginate results: default page size 10, infinite scroll on frontend
- Cache popular shop list (Redis or in-memory) with short TTL (e.g., 30s)
- Search uses FULLTEXT index on shop name and product name

**Frontend:**
- Lazy load shop cards (FlatList with `initialNumToRender`)
- Map pins clustered using react-native-maps clustering library
- Skeleton loaders on first load and filter changes
- Debounce search input (300ms) to prevent API spam
- Image lazy loading with blur placeholder

---

## 10. EMPTY & EDGE STATES

| Scenario | UI Response |
|---|---|
| No shops in area | "No shops available nearby" + "Expand search area" button |
| All shops closed | "All shops are currently closed" + show reopen times |
| Network error | "Unable to load shops" + Retry button |
| Search no results | "No results for [query]" + clear search suggestion |
| Location permission denied | Prompt to enable location + manual city/pincode entry fallback |

---

## 11. SHOP CARD CTAs

**Each card has two actions:**
- **"View Products"** → opens shop product listing screen
- **"Order Now"** → shortcut: opens shop + auto-focuses cart

**Featured shop card:** Larger card with banner image + "Featured" badge

---

## 12. UI VISUAL DESIGN GUIDELINES

**Color coding:**
- Open badge: green background
- Closed badge: red/grey background
- Featured tag: gold/amber color
- Fast delivery tag: blue
- Best price tag: green

**Icons:** 🚚 delivery | ⭐ rating | ₹ price | 📍 distance | 🕐 time

**Animations:**
- Map pins: subtle drop-in animation on load
- Selected pin: pulse animation
- List ↔ Map transition: smooth shared-element style transition

---

## 13. BACKEND API SUMMARY

| Endpoint | Purpose |
|---|---|
| GET /api/shops/nearby | Default nearby shops on home load |
| GET /api/shops/search | Text search with filters + sort |
| GET /api/shops/personalized | User-specific shop ordering |
| GET /api/shops/:id | Single shop detail + products preview |
| GET /api/shops/:id/slots | Available delivery slots |

**Standard response includes:**
- Pagination metadata: `{ page, limit, total, has_more }`
- Each shop: distance_km calculated server-side from user lat/lng

---

## 14. REACT NATIVE SCREEN STRUCTURE

**Shop Discovery Screen components:**
- `SearchBar` (sticky header)
- `ViewModeToggle` (List / Map / Split)
- `FilterChips` (horizontal scroll)
- `ShopList` (FlatList with pagination)
- `MapView` (conditional render)
- `ShopCard` (reusable component)
- `ShopBottomSheet` (for map tap interaction)
- `EmptyState` (reusable with icon + message + CTA)
- `FilterSheet` (bottom sheet with advanced filters)
- `SortSheet` (bottom sheet with sort options)
