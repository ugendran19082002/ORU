# THANNIGO WATER DELIVERY APP - COMPREHENSIVE DEVELOPMENT PROMPTS
## Complete Phase-Wise Implementation Guide

---

## 🎨 DESIGN SYSTEM REFERENCE

### **Color Palette**
```
PRIMARY COLORS:
- Primary Blue: #0077BE (Buttons, Headers, Active states)
- Primary Gradient: Linear gradient from #0077BE to #4EC2E5
- Secondary Blue: #4EC2E5 (Accents, Secondary actions)
- Tertiary Deep: #34C4E5 (Depth in gradients)

NEUTRAL COLORS:
- Charcoal: #2E4049 (Text headings)
- Gray Dark: #6B7C8C (Secondary text)
- Gray Medium: #A8B6C1 (Placeholder text)
- Gray Light: #E5E9EC (Dividers, borders)
- White: #FFFFFF (Backgrounds, cards)

ACCENT COLORS:
- Success Green: #2DD4BF (Verified badges, success states)
- Warning Orange: #F97316 (Alerts, pending status)
- Error Red: #EF4444 (Errors, cancellations)
- Info Yellow: #FCD34D (Notifications, tips)

BACKGROUND GRADIENTS:
- Card Hover: Linear gradient from #F0F9FF to #E0F2FE
- Button Active: Linear gradient from #0077BE to #0062A0
```

### **Typography System**
```
FONTS:
- Primary: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

SIZES:
- H1 Heading: 28px, Bold (700)
- H2 Heading: 24px, Semibold (600)
- H3 Heading: 20px, Semibold (600)
- Body Large: 16px, Regular (400)
- Body Normal: 14px, Regular (400)
- Caption: 12px, Regular (400)
- Button Text: 16px, Medium (500)
```

---

## 📱 PHASE 1: CUSTOMER APP - CORE SCREENS

### **PROMPT 1.1: Splash & Onboarding Screens**

```
ROLE: You are a senior mobile app UI/UX designer specializing in e-commerce and delivery applications.

TASK: Design a modern splash screen and onboarding flow for "Thannigo" - a premium water delivery app.

DESIGN SPECIFICATIONS:

1. SPLASH SCREEN:
   - Background: Linear gradient from #0077BE (top) to #4EC2E5 (bottom)
   - App Logo: Center-aligned, white water drop icon with "Thannigo" wordmark
   - Tagline: "Pure Water, Delivered Fresh" (14px, white, opacity 0.9)
   - Loading indicator: Subtle pulse animation on logo
   - Duration: 2-3 seconds auto-transition

2. ONBOARDING SCREENS (3 slides):
   
   SLIDE 1 - "Find Fresh Water Near You"
   - Illustration: Map with water drop pins in #0077BE
   - Title: 24px, #2E4049, Bold
   - Description: "Discover verified water suppliers in your area with real-time availability"
   - Background: White with subtle water droplet pattern (opacity 0.03)

   SLIDE 2 - "One-Tap Ordering"
   - Illustration: Phone screen showing order confirmation with checkmark
   - Title: "Order in Seconds"
   - Description: "Choose your quantity, schedule delivery, and relax - we handle the rest"
   - Accent color: #2DD4BF for success icons

   SLIDE 3 - "Track Every Drop"
   - Illustration: Delivery person with water cans and tracking path
   - Title: "Real-Time Tracking"
   - Description: "Know exactly when your water arrives with live delivery updates"
   - CTA Button: "Get Started" (Full width, gradient #0077BE to #4EC2E5, white text, 16px medium, 48px height, 12px border radius)

3. INTERACTION DESIGN:
   - Swipe gesture for slide navigation
   - Progress dots: Active = #0077BE, Inactive = #E5E9EC
   - "Skip" button (top right, 14px, #6B7C8C)
   - Smooth fade transitions between slides (300ms)

4. ACCESSIBILITY:
   - Minimum touch target: 44x44px
   - Color contrast ratio: 4.5:1 minimum
   - Support for dynamic type sizing

OUTPUT: Create responsive designs for iPhone 14 Pro (393x852px) and Android (360x800px) with all states and transitions documented.
```

---

### **PROMPT 1.2: Home Screen - Main Dashboard**

```
ROLE: You are a product designer creating an intuitive home screen for a water delivery marketplace app.

TASK: Design the main home screen with location-based shop discovery, search, and quick actions.

SCREEN STRUCTURE:

1. TOP APP BAR (Fixed, 64px height):
   - Background: White with subtle shadow (0px 2px 8px rgba(0,0,0,0.08))
   - Left: "Thannigo" logo (24px height, #0077BE)
   - Center: Location display
     • Icon: Location pin (#0077BE)
     • Text: "Delivering to" (12px, #6B7C8C)
     • Address: "Koramangala, Bangalore" (14px, #2E4049, semibold)
     • Tap to change location
   - Right: Bell icon (notifications) with red badge if unread

2. SEARCH BAR (Below header, 48px height, 16px margin):
   - Background: #F0F9FF
   - Icon: Search magnifying glass (#6B7C8C)
   - Placeholder: "Find refreshing water near you..." (#A8B6C1, 14px)
   - Border radius: 12px
   - On tap: Expand to search screen with filters

3. QUICK ACTION CHIPS (Horizontal scroll):
   - Chip design: White background, #E5E9EC border, 8px padding, 20px border radius
   - Active chip: #0077BE background, white text
   - Options:
     • "🔥 Pure Mineral" (with fire emoji)
     • "🏔️ Aqua Crystal" (with mountain emoji)
     • "⚡ 20-30 min" (fast delivery badge)
     • "⭐ Verified" (with star, #2DD4BF accent)
     • "💰 ₹35 & Below" (budget filter)

4. FEATURED SECTION (Card):
   - Background: Linear gradient from #0077BE to #34C4E5
   - Image: 3D water drop illustration (left side)
   - Badge: "🎯 ACTIVE ITERATION" (#2DD4BF, top right corner)
   - Title: "One-Tap Refresh" (20px, white, bold)
   - Subtitle: "Quickly reorder 2 cans of your favorite water from Aqua Crystal Pure" (14px, white, opacity 0.9)
   - Button: "Reorder Now" (White background, #0077BE text, 14px medium, 36px height, 8px radius)
   - Card height: 160px, 16px margin, 16px border radius

5. SHOP LISTINGS (Vertical scroll):
   
   Each shop card (White background, shadow, 16px radius, 12px margin bottom):
   
   TOP ROW:
   - Shop logo (48x48px, circular, left)
   - Shop name "Blue Spring Aquatics" (16px, #2E4049, semibold)
   - Rating "4.8 ⭐" (14px, #6B7C8C, right aligned)
   - Delivery time "15-25 Mins delivery" (12px, #6B7C8C, below name)

   MIDDLE SECTION:
   - Large product image (Water can, 120x120px, center)
   - Badge "PURE MINERAL" (#2DD4BF background, white text, top left of image)

   PRODUCT DETAILS:
   - Name "20L Mineral Water Can" (16px, #2E4049, semibold)
   - Price "₹45.00 per unit" (18px, #0077BE, bold)

   QUANTITY SELECTOR:
   - Label "QUANTITY" (10px, #6B7C8C, uppercase, letter-spacing 0.5px)
   - Counter: Minus button (-) | "02" display | Plus button (+)
   - Buttons: #0077BE circular, white icon, 32px diameter

   BOTTOM ROW:
   - Payment badges:
     • UPI icon with "UPI Payment" (12px, #6B7C8C)
     • Cash icon with "Cash on Delivery" (12px, #6B7C8C)
     • Both with subtle borders, horizontal layout

6. BOTTOM ACTION (Sticky, above bottom nav):
   - Delivery address card (White, 8px padding):
     • Icon: Location pin
     • "DELIVER TO" (10px, #6B7C8C)
     • "Apartment 402, Sarjapur Road..." (14px, #2E4049)
     • "Edit" link (#0077BE, 14px, right)

7. BOTTOM NAVIGATION BAR (60px height, white, top shadow):
   - Icons with labels (24px icons, 10px labels):
     • Home (Active: #0077BE fill, "Home" label)
     • Orders (Inactive: #6B7C8C)
     • Track (Inactive with delivery icon)
     • Profile (Inactive)
   - Active state: Icon + label both in #0077BE with 2px top indicator bar

INTERACTION STATES:
- Card tap: Scale to 0.98 with 200ms ease
- Button hover: Lighten 5%
- Infinite scroll: Load 10 shops, show loading spinner (#0077BE)

USER FLOW LOGIC:
1. Auto-detect location on first launch
2. Show nearest verified shops first
3. Display personalized "Reorder" card if previous orders exist
4. Real-time availability updates (WebSocket)
5. Pull-to-refresh gesture to update shop list

RESPONSIVE BEHAVIOR:
- Mobile: Single column, full width cards
- Tablet: 2-column grid for shop cards
- All touch targets minimum 44x44px

OUTPUT: Provide complete design with annotations for spacing (8px grid system), component states (default, hover, active, disabled), and micro-interactions.
```

---

### **PROMPT 1.3: Shop Detail & Product Selection Screen**

```
ROLE: You are a conversion-focused UI designer creating a shop detail page that maximizes order completion rates.

TASK: Design an immersive shop profile page with product catalog, trust signals, and smooth checkout initiation.

SCREEN LAYOUT:

1. HEADER SECTION (Fixed on scroll):
   - Back button (top left, 40x40px, white with shadow)
   - Shop cover image (Full width, 240px height, parallax scroll effect)
   - Gradient overlay (Linear from transparent to rgba(0,0,0,0.4))
   - Shop logo overlay (Bottom left, 80x80px, circular, white border 4px)

2. SHOP INFO CARD (Overlaps cover image by 40px):
   - Background: White, 20px top border radius, shadow
   - Shop name "Thannigo" (24px, #2E4049, bold)
   - Location "📍 Koramangala, Bangalore" (14px, #6B7C8C)
   - Verification badge "✓ Verified" (#2DD4BF background, white text, 24px height, 8px radius, inline)
   
   METRICS ROW (3 columns, 12px top margin):
   - Rating: "⭐ 4.8" (16px, #2E4049) + "(1.2k reviews)" (12px, #6B7C8C)
   - Delivery: "⚡ 25-30 min" (14px, #6B7C8C)
   - Distance: "📍 2.3 km" (14px, #6B7C8C)

3. ACTION BUTTONS ROW (16px margin):
   - "View Map 🗺️" button (Flex 1, #F0F9FF background, #0077BE text, 40px height, 8px radius)
   - "Call ☎️" button (Flex 1, #F0F9FF background, #0077BE text, 8px margin left)
   - Both with 500ms ripple effect on tap

4. TABS NAVIGATION (Sticky below shop info):
   - Background: White with bottom border #E5E9EC
   - Tabs: "Products" | "About" | "Reviews"
   - Active tab: #0077BE text with 3px bottom border
   - Inactive tabs: #6B7C8C text
   - Smooth slide animation (300ms) on tab switch

5. PRODUCTS TAB CONTENT:
   
   CATEGORY CHIPS (Horizontal scroll, 8px gap):
   - Chip style: #F0F9FF background, #0077BE text, 32px height, 16px horizontal padding
   - Active chip: #0077BE background, white text
   - Categories: "All" | "20L Cans" | "10L Cans" | "Bottles" | "Dispensers"

   PRODUCT GRID (2 columns, 12px gap):
   
   Each product card:
   - Background: White, border #E5E9EC, 12px radius, 12px padding
   - Product image (Full width, 160px height, object-fit: cover)
   - Badge "VERIFIED ✓" (Top right overlay, #2DD4BF)
   
   PRODUCT INFO:
   - Name "Aqua Crystal Pure" (14px, #2E4049, semibold)
   - Rating "4.8 ★" + "1.2 km away" (12px, #6B7C8C, below name)
   - Size "20 L" badge (#E0F2FE background, #0077BE text, inline)
   - Price "₹35" (18px, #0077BE, bold, right aligned)
   
   ADD TO CART:
   - If quantity = 0: "+Add" button (Full width, #0077BE background, white text, 36px height)
   - If quantity > 0: Counter (Minus | Display | Plus) with #0077BE buttons
   - Haptic feedback on quantity change

6. ABOUT TAB CONTENT:
   - Opening hours "⏰ Mon-Sun: 6:00 AM - 11:00 PM" (14px, #2E4049)
   - Description paragraph (14px, #6B7C8C, line-height 1.6)
   - Certifications section:
     • "🏆 Certifications" heading (16px, #2E4049, semibold)
     • Badges: "ISO Certified" | "FSSAI Approved" | "BIS Mark"
     • Each badge: White background, #E5E9EC border, 8px padding, icon + text
   - Payment methods accepted (Icon row)
   - Contact information

7. REVIEWS TAB CONTENT:
   - Overall rating card (Top):
     • Large "4.8" (48px, #0077BE, bold)
     • "out of 5" (14px, #6B7C8C)
     • Star visualization (5 stars, filled based on rating)
     • "(1,234 reviews)" (12px, #6B7C8C)
   
   RATING BREAKDOWN:
   - 5 rows (5★ to 1★)
   - Each row: Stars | Progress bar (#0077BE fill, #E5E9EC background) | Count
   
   INDIVIDUAL REVIEWS (Vertical list):
   - User avatar (40px circular)
   - Name + Rating stars (14px, #2E4049)
   - Review text (14px, #6B7C8C, 3-line clamp with "Read more")
   - Date (12px, #A8B6C1)
   - Helpful button "👍 Helpful (23)"

8. FLOATING CART BUTTON (Fixed bottom, above viewport):
   - Only visible when items added (slide up animation)
   - Background: Gradient from #0077BE to #4EC2E5
   - Content:
     • Left: "3 Cans" (14px, white) + "₹105" (16px, white, semibold)
     • Right: "View Cart →" (16px, white, medium)
   - Full width minus 32px margin, 56px height, 12px radius
   - Pulsing glow effect (#4EC2E5, 50% opacity, 2s interval)

MICRO-INTERACTIONS:
- Product image: Zoom on tap (modal view)
- Add to cart: Scale animation + success checkmark (300ms)
- Category chip: Horizontal scroll with momentum
- Pull down: Show refresh indicator
- Scroll up: Hide header, show shop name in top bar

TRUST INDICATORS:
- Verified badge prominently displayed
- Real customer photos in reviews
- Response time: "Usually responds in 2 hours"
- Delivery success rate: "98% on-time delivery"

USER FLOW:
1. Land on shop page from home or search
2. Browse products by category
3. Add multiple items to cart
4. View cart summary in floating button
5. Tap floating button → Navigate to checkout

OUTPUT: Design with complete interaction states, loading skeletons, empty states, and error handling.
```

---

### **PROMPT 1.4: Shopping Cart & Checkout Screen**

```
ROLE: You are a checkout optimization specialist designing a frictionless cart and payment flow.

TASK: Create a streamlined cart review and checkout screen that minimizes drop-off and builds purchase confidence.

SCREEN STRUCTURE:

1. TOP BAR (Fixed):
   - Back arrow (left)
   - Title "Review Order" (16px, #2E4049, center)
   - Clear cart icon (right, with confirmation dialog)

2. CART ITEMS SECTION (Scrollable):
   
   Each item card (White, 16px padding, 12px bottom margin):
   - Left: Product thumbnail (80x80px, 8px radius)
   - Middle:
     • Product name "20L Mineral Water Can" (14px, #2E4049, semibold)
     • Shop name "Blue Spring Aquatics" (12px, #6B7C8C)
     • Price per unit "₹45/unit" (12px, #6B7C8C)
   - Right:
     • Quantity counter (Compact, 32px buttons)
     • Total price "₹90" (14px, #0077BE, bold, below counter)
   - Delete button (Bottom right, trash icon, #EF4444)

3. DELIVERY DETAILS CARD:
   - Icon: 📍 Location pin (#0077BE)
   - Label "DELIVERY ADDRESS" (10px, #6B7C8C, uppercase)
   - Address: "Flat 402, Ocean Breeze Apartments, Sunset Boulevard, Coastal Road..." (14px, #2E4049)
   - "Change" link (#0077BE, 14px, right aligned)
   - Map preview thumbnail (Full width, 120px height, interactive, optional)

4. DELIVERY SCHEDULE CARD:
   - Icon: ⏰ Clock (#0077BE)
   - Label "DELIVERY TIME" (10px, #6B7C8C, uppercase)
   
   DELIVERY OPTIONS (Radio buttons):
   - Option 1: "Now (30-45 mins)" - Default selected
     • Radio button: #0077BE when selected, #E5E9EC when not
     • Label 14px, #2E4049
   - Option 2: "Schedule for later"
     • When selected: Expand to show date picker + time slot selector
     • Date chips: Today | Tomorrow | Pick date (calendar icon)
     • Time slots: Morning (6AM-12PM) | Afternoon (12PM-6PM) | Evening (6PM-11PM)
   
5. DELIVERY INSTRUCTIONS (Expandable):
   - "Add delivery notes (optional)" (14px, #0077BE, tap to expand)
   - When expanded: Text area (4 rows, #F0F9FF background, 8px padding)
   - Placeholder: "E.g., Call before arriving, Leave at gate, Ring doorbell..."
   - Character limit: 200 chars, show counter

6. PAYMENT METHOD CARD:
   - Icon: 💳 Card (#0077BE)
   - Label "PAYMENT METHOD" (10px, #6B7C8C, uppercase)
   
   OPTIONS (Select one):
   - UPI Payment (Recommended badge #2DD4BF)
     • Radio + "UPI Apps" | "₹450" (right aligned, #2E4049, semibold)
     • Sub-icons: GPay, PhonePe, Paytm (16px each)
   
   - Cash on Delivery
     • Radio + "Pay on delivery" | "₹450"
     • Info text "Please keep exact change" (12px, #6B7C8C)
   
   - Card/Net Banking
     • Radio + "Credit/Debit Card"
     • When selected: Expand to show card input fields

7. PROMO CODE SECTION (Collapsible):
   - "Have a promo code?" (14px, #0077BE, tap to expand)
   - When expanded:
     • Input field (48px height, #F0F9FF background, "Enter code" placeholder)
     • "Apply" button (Adjacent, #0077BE background, white text)
   - If applied successfully: Green checkmark + "₹20 saved!" message

8. BILL SUMMARY CARD (Sticky above CTA):
   - Background: #F0F9FF, 12px padding, 8px radius
   
   BREAKDOWN:
   - Item total: "₹450" (14px, #2E4049, right aligned)
   - Delivery fee: "₹20" (14px, #2E4049) + Info icon (tap for explanation)
   - Discount: "-₹20" (#2DD4BF, 14px, if promo applied)
   - Platform fee: "₹5" (14px, #2E4049)
   - Separator line (#E5E9EC, 1px)
   - TO PAY: "₹455" (18px, #0077BE, bold, both left and right)

9. PLACE ORDER BUTTON (Fixed bottom):
   - Background: Gradient from #0077BE to #4EC2E5
   - Text: "Place Order ₹455" (16px, white, medium, center)
   - Full width minus 32px margin, 56px height, 12px radius
   - Loading state: Spinner replaces text, button disabled
   - Success state: Checkmark animation + "Order Placed!"

INTERACTION DESIGN:
- Auto-save cart to local storage (every change)
- Real-time price calculation (debounced 300ms after quantity change)
- Address autofill using browser/device location
- Payment method: Pre-select last used method
- Haptic feedback on order placement (success vibration pattern)

VALIDATION & ERROR HANDLING:
- Empty cart: Show "Your cart is empty" illustration + "Start Shopping" button
- Invalid address: Red outline + "Please select a valid delivery address"
- Payment failure: Modal with retry option + alternative payment methods
- Out of delivery range: Alert with suggestion to change address or contact shop

TRUST SIGNALS:
- Secure payment badge "🔒 Secure Checkout" (12px, #6B7C8C, top)
- Estimated delivery time: "Expected by 3:45 PM today" (12px, #2DD4BF, below schedule)
- Money-back guarantee badge (optional)

USER FLOW:
1. Review cart items (edit quantities or remove)
2. Confirm/change delivery address
3. Select delivery time (now or schedule)
4. Add optional delivery instructions
5. Choose payment method
6. Apply promo code (optional)
7. Review bill summary
8. Place order → Navigate to order confirmation

ACCESSIBILITY:
- Form labels properly associated
- Error messages announced to screen readers
- Focus management for keyboard navigation
- Color contrast 4.5:1 minimum

OUTPUT: Include all states (empty, loading, error, success), animations (JSON for Lottie), and backend API call structure.
```

---

### **PROMPT 1.5: Order Tracking & Live Status Screen**

```
ROLE: You are a real-time experience designer creating a delightful order tracking interface.

TASK: Design a live tracking screen that keeps customers informed and engaged throughout the delivery journey.

SCREEN LAYOUT:

1. TOP SECTION (Non-scrollable):
   - Background: Gradient from #0077BE to #34C4E5
   - Status badge "✓ Order Accepted" (White background, #2DD4BF text, center, 32px height)
   - Order ID "#WD4524" (14px, white, opacity 0.9, center, 8px top margin)
   - Estimated time "Arriving in 25-30 mins" (18px, white, bold, center, 4px top margin)

2. LIVE MAP VIEW (Interactive, 320px height):
   - Google Maps integration or custom map
   - Customer location: Blue pin with pulsing circle animation
   - Shop location: Water drop icon in #0077BE
   - Delivery route: Dashed line in #4EC2E5, 3px width
   - Delivery person marker: Animated scooter icon moving along route
   - Zoom controls (Bottom right)
   - "Center on me" button (Bottom left, circular, white with shadow)

3. DELIVERY STATUS TIMELINE (Vertical stepper):
   
   Each step:
   - Left: Status icon (32px circular)
   - Center: Status text + timestamp
   - Right: Action button (if applicable)
   - Connector line: 2px, #E5E9EC (inactive) or #0077BE (active)
   
   STEP 1: Order Placed ✓
   - Icon: Green checkmark circle (#2DD4BF background)
   - Text: "Order placed successfully" (14px, #2E4049, semibold)
   - Time: "2:15 PM" (12px, #6B7C8C, below text)
   
   STEP 2: Shop Accepted ✓
   - Icon: Shop building icon (#2DD4BF background)
   - Text: "Blue Spring Aquatics accepted your order" (14px, #2E4049)
   - Time: "2:17 PM"
   - Action: "Call Shop" button (12px, #0077BE, outline)
   
   STEP 3: Preparing Order (Current) 🔄
   - Icon: Animated loading spinner (#0077BE)
   - Text: "Preparing your order" (14px, #2E4049, semibold)
   - Sub-text: "3 cans of 20L water" (12px, #6B7C8C)
   - Estimated: "Ready by 2:30 PM" (12px, #0077BE)
   
   STEP 4: Out for Delivery (Upcoming)
   - Icon: Delivery scooter outline (#E5E9EC)
   - Text: "Out for delivery" (14px, #A8B6C1)
   - Grayed out until active
   
   STEP 5: Delivered (Upcoming)
   - Icon: Package check outline (#E5E9EC)
   - Text: "Delivered" (14px, #A8B6C1)
   - Grayed out until active

4. DELIVERY PERSON CARD (Appears when "Out for Delivery"):
   - Background: White, shadow, 12px radius, 16px padding
   - Layout: Horizontal
   
   LEFT SIDE:
   - Avatar: Circular photo, 56px diameter
   - Verification badge (Small green check overlay)
   
   MIDDLE:
   - Name: "Rahul Sharma" (16px, #2E4049, semibold)
   - Rating: "4.9 ★" (14px, #6B7C8C)
   - Vehicle: "KA 01 AB 1234" (12px, #6B7C8C)
   - Distance: "2.3 km away" (12px, #0077BE)
   
   RIGHT SIDE:
   - Call button (Circular, 48px, #0077BE background, phone icon white)

5. ORDER ITEMS SUMMARY (Collapsible):
   - Header: "Order Details" (16px, #2E4049, semibold) + Chevron down
   - When expanded:
     • Each item: Image (40x40px) | Name | Qty | Price
     • Total: "3 items • ₹450" (14px, #0077BE, right aligned)

6. DELIVERY ADDRESS CARD (Compact):
   - Icon: Location pin
   - Text: "Flat 402, Ocean Breeze..." (14px, #2E4049)
   - "View full address" link (#0077BE, 12px)

7. HELP & SUPPORT SECTION (Bottom):
   - "Need help with your order?" (14px, #6B7C8C, center)
   - Buttons:
     • "Contact Support" (Outline button, #0077BE border and text)
     • "Report Issue" (Outline button)
   - Both 40px height, 8px radius, 8px gap between

8. BOTTOM ACTION BAR (Appears on delivery):
   - "Order Delivered?" confirmation
   - "Yes, Received" button (Primary gradient)
   - "No, Report Issue" button (Outline, red)

REAL-TIME UPDATES:
- WebSocket connection for live status
- Push notifications for status changes:
  • "Your order has been accepted!"
  • "Delivery partner is 5 mins away"
  • "Order delivered. Rate your experience!"
- Auto-refresh every 30 seconds as fallback
- Visual indicator: "Updated just now" (12px, #2DD4BF, top right)

MICRO-INTERACTIONS:
- Map marker: Bounce animation when delivery person moves
- Status icon: Pulse animation for current step
- Estimated time: Count-down timer with real-time updates
- Delivery person card: Slide up from bottom with 300ms ease
- Progress bar: Smooth fill animation on status change

NOTIFICATION SCENARIOS:
1. Order Accepted: "Blue Spring Aquatics accepted your order! Preparing 3 cans."
2. Out for Delivery: "Rahul is on the way with your order. Track live."
3. Nearby: "Your delivery is 2 mins away. Please be available."
4. Delivered: "Order delivered! Hope you enjoyed our service."

EDGE CASES:
- Delayed order: Show "Taking longer than expected" + "Call shop" option
- Delivery person unreachable: Alternative contact (Shop number)
- Wrong address: "Update delivery location" button (if not dispatched)
- Cancelled by shop: Red alert + "Order cancelled. Refund initiated."

ACCESSIBILITY:
- VoiceOver announcements for status changes
- High contrast mode support
- Haptic feedback on status milestones
- Text size adaptation (up to 200%)

USER FLOW:
1. Order placed → Immediate redirect to tracking screen
2. Real-time status updates → Visual + push notifications
3. Delivery person assigned → Show contact card
4. Out for delivery → Live map tracking
5. Delivered → Rate and review prompt

OUTPUT: Provide designs with animation timings, WebSocket message structure, and push notification templates.
```

---

## 📱 PHASE 2: CUSTOMER APP - SECONDARY SCREENS

### **PROMPT 2.1: Search & Filter Results Screen**

```
ROLE: You are a search experience designer optimizing for speed and relevance in a local marketplace.

TASK: Create an intelligent search interface with real-time suggestions, filters, and result sorting.

SCREEN COMPONENTS:

1. SEARCH BAR (Fixed top, 56px height):
   - Background: White
   - Back arrow (left, 40x40px touch target)
   - Search input:
     • Autofocus on screen load
     • Placeholder: "Search shops, products..." (#A8B6C1, 16px)
     • Clear button (X) appears when text entered
     • Voice search button (microphone icon, right, #0077BE)
   - Search button disabled until 3+ characters typed

2. RECENT SEARCHES (Below search bar, when empty):
   - Header: "Recent" (14px, #6B7C8C, left) + "Clear all" (#0077BE, right)
   - Each item:
     • Clock icon (#A8B6C1)
     • Search term (14px, #2E4049)
     • Tap to reuse search
     • Swipe left to delete (iOS) or long-press menu (Android)
   - Max 5 recent searches stored

3. TRENDING SEARCHES (Chips, horizontal scroll):
   - Header: "🔥 Trending" (14px, #2E4049, 8px bottom margin)
   - Chips: White background, #E5E9EC border, #6B7C8C text
   - Examples: "20L water can" | "Aqua mineral" | "Fast delivery" | "Verified shops"
   - Tap to auto-fill search

4. FILTERS BAR (Horizontal scroll, sticky below search):
   - Background: #F0F9FF
   - Filter chips (Pill shaped, 36px height):
     • "🎯 All" (Active: #0077BE background, white text)
     • "⚡ Fast Delivery" (Inactive: white, #2E4049 text, #E5E9EC border)
     • "⭐ 4.5+ Rated"
     • "💰 Under ₹50"
     • "📍 < 2km"
     • "✓ Verified"
   - Last chip: "More Filters" with badge count if applied

5. SORT DROPDOWN (Right of filters):
   - Button: "Sort" with dropdown icon (36px height, #0077BE text)
   - Dropdown options (Bottom sheet on mobile):
     • Relevance (Default)
     • Distance: Nearest first
     • Rating: Highest first
     • Price: Low to high
     • Price: High to low
     • Fastest delivery
   - Selected option: Checkmark (#2DD4BF)

6. RESULTS HEADER (16px padding):
   - "234 results found" (14px, #6B7C8C)
   - If filters applied: "5 filters applied" chip (#0077BE, white text, tap to edit)

7. SEARCH RESULTS (Grid or list toggle):
   
   LIST VIEW (Default):
   - Same shop card as home screen
   - Highlight matching text: Bold + #0077BE color
   - "Ad" badge for promoted shops (#FCD34D background, top right)
   
   GRID VIEW (2 columns):
   - Compact cards: Image top, info below
   - 48px height product images
   - Name (14px, 2-line clamp) + Price (16px, bold)

8. FILTER MODAL (Opens from "More Filters"):
   - Full-screen bottom sheet (Mobile) or modal (Tablet)
   - Header: "Filters" (center) | "Reset" (left) | "Apply" (right, #0077BE)
   
   FILTER SECTIONS:
   
   DELIVERY TIME:
   - Slider: 0-60 mins (Step: 5 mins)
   - Current selection: "Deliver within 30 mins"
   - Handle color: #0077BE, track: #E5E9EC
   
   DISTANCE:
   - Slider: 0-10 km (Step: 0.5 km)
   - Current: "Within 3 km"
   
   PRICE RANGE:
   - Two handles slider: Min ₹20 - Max ₹100
   - Input fields for manual entry
   
   RATING:
   - Chips: Any | 3.5+ | 4+ | 4.5+
   - Star icons in chips
   
   PRODUCT TYPE:
   - Checkboxes:
     □ 20L Cans
     □ 10L Cans
     □ 1L Bottles
     □ Dispenser Rental
   
   SHOP FEATURES:
   - Checkboxes:
     □ Verified shops only
     □ Accepts UPI
     □ Cash on delivery
     □ Open now
     □ Free delivery
   
   - Apply button (Bottom, sticky, shows result count)
     "Show 156 results" (Gradient background)

SEARCH LOGIC:
- Fuzzy matching for typos
- Auto-suggestions after 2 characters
- Prioritize: Exact match > Partial match > Similar
- Search scope: Shop names, product names, categories, locations
- Highlight search terms in results (Bold + color)

EMPTY STATES:
- No results found:
  • Illustration: Empty search box
  • "No results for 'xyz'" (16px, #2E4049)
  • Suggestions: "Try different keywords" or "Check spelling"
  • "Clear filters" button if filters active
  • "Browse all shops" fallback button

LOADING STATES:
- Skeleton screens (3-5 cards)
- Shimmer animation (#E5E9EC to #F0F9FF, 1.5s)
- "Loading results..." text (14px, #6B7C8C, center)

INTERACTION DESIGN:
- Instant search: Start showing results after 3 characters
- Debounce: 300ms after last keystroke
- Pull-to-refresh on results
- Infinite scroll: Load 20 results at a time
- Filter count badge: Update in real-time

ADVANCED FEATURES:
- Voice search: Speech-to-text, show animated mic icon during recording
- Barcode scanner: Scan water can barcode for direct product search
- Image search: Upload photo to find similar products (future)
- Search history sync: Cloud storage for logged-in users

OUTPUT: Include search algorithm logic, API request/response format, and analytics events to track.
```

---

### **PROMPT 2.2: Order History & Past Orders Screen**

```
ROLE: You are designing an order management system that helps users track, reorder, and review past purchases.

TASK: Create a comprehensive order history screen with filtering, search, and one-tap reordering.

SCREEN STRUCTURE:

1. TOP BAR:
   - Title: "My Orders" (18px, #2E4049, semibold, center)
   - Filter icon (right, 40x40px touch target)
   - Notification dot if new order status (Red, 8px)

2. STATUS TABS (Horizontal scroll, sticky):
   - Background: White, bottom border #E5E9EC
   - Tabs:
     • "All" (Badge count: 45)
     • "Active" (Orders in progress, badge: 2)
     • "Delivered" (Completed, badge: 40)
     • "Cancelled" (badge: 3)
   - Active tab: #0077BE text + 3px bottom border
   - Inactive: #6B7C8C text
   - Smooth slide transition (300ms)

3. SEARCH BAR (Collapsible):
   - Collapsed: "Search orders..." (14px, #A8B6C1) + search icon
   - Tap to expand with animation
   - Search by: Order ID, shop name, product, date
   - Clear button when text entered

4. ORDER CARDS (Vertical list):

   ACTIVE ORDER CARD:
   - Border: 2px solid #0077BE (indicates in-progress)
   - Background: White, 12px radius, 16px padding
   
   TOP ROW:
   - Order ID "#WD4524" (14px, #2E4049, semibold, left)
   - Status badge "🚚 Out for Delivery" (#0077BE background, white text, right)
   
   SHOP INFO:
   - Shop logo (40px circular, left)
   - Shop name "Blue Spring Aquatics" (14px, #2E4049)
   - Date "09 Apr 2026, 2:15 PM" (12px, #6B7C8C, below name)
   
   PRODUCT SUMMARY:
   - "3 items • ₹450" (14px, #2E4049, semibold)
   - Product thumbnails (3x 32px images, horizontal, overlapping)
   
   PROGRESS BAR:
   - 4 steps: Order → Accepted → Delivery → Delivered
   - Current step highlighted in #0077BE
   - Progress: 60% filled (#0077BE fill, #E5E9EC background)
   
   ACTION BUTTONS:
   - "Track Order" (Primary, gradient, full width, 40px height)
   - "Call Shop" (Outline, #0077BE border, 50% width)
   
   ---
   
   DELIVERED ORDER CARD:
   - Border: 1px solid #E5E9EC
   - Background: White
   
   TOP ROW:
   - Order ID "#WD4520" (14px, #2E4049, semibold)
   - Status "✓ Delivered" (#2DD4BF text, right)
   
   SHOP INFO:
   - Same as active card
   - Date "08 Apr 2026, 11:30 AM"
   
   PRODUCT SUMMARY:
   - "2 items • ₹300"
   - Product images
   
   RATING SECTION (if not rated):
   - "Rate your experience" (14px, #6B7C8C)
   - 5 empty stars (tap to rate)
   
   ACTION BUTTONS:
   - "⚡ Reorder" (Primary gradient, 60% width)
     • On tap: Add all items to cart + navigate to checkout
     • Show success toast "Added to cart!"
   - "View Details" (Outline, 40% width)
   
   ---
   
   CANCELLED ORDER CARD:
   - Border: 1px solid #EF4444
   - Background: #FEF2F2 (Light red tint)
   
   TOP ROW:
   - Order ID "#WD4512"
   - Status "✕ Cancelled" (#EF4444 text, right)
   
   CANCELLATION INFO:
   - Reason: "Cancelled by customer" (12px, #6B7C8C)
   - Refund status: "Refund initiated - ₹450" (#2DD4BF, 12px)
   
   ACTION:
   - "Reorder Items" (Outline button, #0077BE)

5. ORDER DETAIL VIEW (Tap "View Details"):
   - Full-screen modal or new screen
   
   HEADER:
   - Back button (left)
   - "Order #WD4520" (center, 16px, #2E4049, semibold)
   - "Get Help" (right, #0077BE)
   
   STATUS TIMELINE:
   - Same vertical stepper as tracking screen
   - All steps marked as completed
   
   ORDER SUMMARY:
   - Each item: Image | Name | Qty | Price
   - Subtotal, Delivery, Discount, Total (Same as checkout)
   
   DELIVERY DETAILS:
   - Address with map thumbnail
   - Delivery time actual: "Delivered at 11:45 AM"
   - Delivery person: Name + photo + rating
   
   PAYMENT INFO:
   - Method used: "UPI (Google Pay)"
   - Transaction ID: "TXN1234567890"
   - Status: "Paid" (#2DD4BF)
   
   INVOICE:
   - "Download Invoice" button (PDF generation)
   - "Get GST Invoice" (if applicable)
   
   SUPPORT OPTIONS:
   - "Report an issue"
   - "Request refund" (if within policy window)
   - "Contact support"

6. FILTER MODAL (From filter icon):
   
   DATE RANGE:
   - Preset chips: "Last 7 days" | "Last 30 days" | "Last 3 months" | "All time"
   - Custom date picker
   
   STATUS:
   - Checkboxes: All | Active | Delivered | Cancelled | Refunded
   
   SHOP:
   - Dropdown: All shops | Select specific shop
   
   PRICE RANGE:
   - Slider: ₹0 - ₹1000
   
   - "Apply Filters" button (Bottom, sticky)

7. BULK ACTIONS (Long-press or multi-select):
   - Checkbox appears on each card
   - Bottom action bar:
     • "Download Invoices" (for selected)
     • "Delete" (for cancelled orders only)
   - Selection counter: "3 selected"

8. EMPTY STATES:
   
   NO ORDERS:
   - Illustration: Empty package box
   - "No orders yet" (18px, #2E4049, semibold)
   - "Start shopping for fresh water!" (14px, #6B7C8C)
   - "Explore Shops" button (Primary gradient)
   
   NO ACTIVE ORDERS:
   - "No active orders"
   - "Place a new order" button
   
   SEARCH NO RESULTS:
   - "No orders found for 'xyz'"
   - "Try different keywords" suggestion

SPECIAL FEATURES:

REORDER FUNCTIONALITY:
- "⚡ Reorder" button on every delivered order
- One-tap: Adds same items + quantities to cart
- If shop closed: Show alert + "Schedule for later" option
- If product unavailable: Highlight + suggest alternative
- Success state: Toast "Added to cart! Ready to checkout?"

RATING & REVIEW:
- Inline rating (5 stars) directly on order card
- Tap star → Expand for detailed review
- Rate: Shop | Delivery person | Product quality
- Photo upload option for review
- "Review submitted" success state

ORDER INSIGHTS:
- "Insights" tab (optional):
  • Total orders this month
  • Total spent
  • Favorite shop
  • Most ordered product
  • Charts and visualizations

INTERACTION DESIGN:
- Pull-to-refresh: Sync latest order status
- Infinite scroll: Load 20 orders per page
- Swipe card right: Quick reorder (with undo)
- Swipe card left: Delete (cancelled orders only)
- Tap card: Expand for quick view (collapsed details)
- Double-tap order ID: Copy to clipboard

NOTIFICATIONS:
- Push: Order status changes
- In-app: "New orders available" badge on tab
- Email: Order confirmation, delivery summary

ACCESSIBILITY:
- Screen reader: Announce order status on card focus
- High contrast: Status colors meet WCAG AAA
- Keyboard navigation: Tab through orders
- Focus indicators on all interactive elements

OUTPUT: Provide state machine for order statuses, API endpoints for filtering/searching, and analytics tracking plan.
```

---

### **PROMPT 2.3: User Profile & Account Settings Screen**

```
ROLE: You are a user experience designer creating a personalized profile and settings hub.

TASK: Design a comprehensive profile screen with account management, preferences, and quick actions.

SCREEN LAYOUT:

1. HEADER SECTION (Gradient background):
   - Background: Linear gradient #0077BE to #34C4E5
   - Height: 200px
   
   PROFILE CARD (Centered, overlaps header):
   - Avatar: 96px circular, white border 4px
   - Edit icon overlay (bottom right of avatar, #0077BE background, white pen icon)
   - Name: "Rahul Sharma" (20px, white, bold, below avatar)
   - Phone: "+91 98765 43210" (14px, white, opacity 0.9)
   - Member since: "Member since Apr 2025" (12px, white, opacity 0.8)

2. STATS CARDS (3-column grid, below header):
   
   Each card: White background, shadow, 8px radius, 12px padding
   
   CARD 1: Orders
   - Icon: 📦 (24px)
   - Count: "45" (20px, #0077BE, bold)
   - Label: "Orders" (12px, #6B7C8C)
   
   CARD 2: Loyalty Points
   - Icon: ⭐ (24px)
   - Count: "1,250" (20px, #FCD34D, bold)
   - Label: "Points" (12px, #6B7C8C)
   - Tap to view rewards
   
   CARD 3: Saved
   - Icon: 💰 (24px)
   - Count: "₹2,340" (20px, #2DD4BF, bold)
   - Label: "Saved" (12px, #6B7C8C)

3. QUICK ACTIONS GRID (2 columns, 16px gap):
   
   Each action card: White, border #E5E9EC, 12px radius, 16px padding
   
   ROW 1:
   - "Saved Addresses" (Icon: 📍, Count badge: 3)
   - "Payment Methods" (Icon: 💳, Count: 2)
   
   ROW 2:
   - "My Reviews" (Icon: ⭐, Count: 12)
   - "Favorite Shops" (Icon: ❤️, Count: 5)
   
   ROW 3:
   - "Wallet & Rewards" (Icon: 🎁, Balance: ₹150)
   - "Refer & Earn" (Icon: 🤝, Badge: "₹50 per referral")

4. SETTINGS SECTION:
   
   ACCOUNT SETTINGS:
   - "Edit Profile" → Name, email, phone, photo
   - "Change Password" (if email login)
   - "Language Preference" (Current: English, options: Hindi, Kannada, Tamil)
   - "Delete Account" (Red text, confirmation dialog)
   
   APP SETTINGS:
   - "Notifications" → Toggles for:
     • Order updates (ON)
     • Offers & promotions (OFF)
     • Delivery alerts (ON)
     • New shop alerts (OFF)
   
   - "Privacy" → Toggles for:
     • Share location (ON, required for delivery)
     • Share usage data (OFF)
   
   - "Theme" → Options:
     • Light (Default)
     • Dark
     • Auto (System)
   
   - "Data & Storage" →
     • Clear cache (Show size: 45.2 MB)
     • Download invoices (Bulk download option)
   
   DELIVERY PREFERENCES:
   - "Default Address" (Quick select)
   - "Delivery Instructions" (Pre-saved notes)
   - "Contact Preference" (Call | SMS | WhatsApp)

5. HELP & SUPPORT SECTION:
   - "Help Center" → FAQ browser
   - "Contact Support" → Chat, Call, Email options
   - "Report a Problem" → Form with category selection
   - "Terms & Conditions"
   - "Privacy Policy"
   - "About Thannigo" → App version, company info

6. LOYALTY & REWARDS (Expandable section):
   
   HEADER:
   - "Thannigo Rewards" (16px, #2E4049, semibold)
   - Current tier badge "🥈 Silver Member"
   
   POINTS SUMMARY:
   - Total points: 1,250 pts
   - Points expiring soon: 150 pts (by Apr 30)
   - Progress bar to next tier:
     • Current: Silver (1,000 pts)
     • Next: Gold (2,500 pts)
     • Progress: 50% (Visual bar in #0077BE)
   
   REWARDS CATALOG:
   - Redeemable rewards grid:
     • ₹50 off (500 pts)
     • Free delivery (200 pts)
     • 10% cashback (800 pts)
   - "View All Rewards" button
   
   REFERRAL PROGRAM:
   - Referral code: "RAHUL50" (Copy button)
   - Share options: WhatsApp, SMS, Email
   - "Invite friends & earn ₹50 per referral"
   - Referral history: 3 successful referrals

7. SAVED ADDRESSES MODAL:
   - List of saved addresses (Max 10)
   
   Each address card:
   - Type tag: "Home" | "Work" | "Other" (#0077BE, white text)
   - Address: Full text (14px, #2E4049)
   - Default badge (if default address)
   - Actions: Edit | Delete | Set as default
   
   - "Add New Address" button (Bottom, #0077BE)
   - Form fields:
     • Address type (Home/Work/Other)
     • House/Flat number
     • Street/Locality (Autocomplete)
     • Landmark (Optional)
     • City (Auto-detected, editable)
     • Pincode
     • Map picker for accurate location

8. PAYMENT METHODS MODAL:
   - Saved cards/UPI
   
   Each payment method:
   - Card: Type icon (Visa/Mastercard/RuPay) | Last 4 digits | Expiry
   - UPI: UPI ID (rahul@paytm)
   - Default badge
   - Actions: Set default | Remove
   
   - "Add Payment Method" → Card form or UPI ID input
   - Security note: "Your data is encrypted & secure 🔒"

9. REFERRAL MODAL (Tap "Refer & Earn"):
   - Hero illustration: Two people sharing
   - Headline: "Give ₹50, Get ₹50" (24px, #0077BE, bold)
   - Description: "Share your code. Friends get ₹50 off first order. You earn ₹50 credits."
   - Referral code: "RAHUL50" (Large, center, copy button)
   - Share buttons:
     • WhatsApp (Most prominent)
     • SMS
     • Email
     • More options
   - Terms: "Credits valid for 90 days"

10. NOTIFICATION SETTINGS:
    - Category toggles:
      • Push notifications (Master toggle, affects all below)
      • Order updates
      • Delivery alerts (Arriving soon, Delivered)
      • Promotional offers
      • New shops nearby
      • Price drops on favorites
    
    - In-app preferences:
      • Email notifications
      • SMS notifications
      • WhatsApp updates
    
    - Do Not Disturb:
      • Schedule quiet hours (e.g., 10 PM - 8 AM)

INTERACTION DESIGN:
- Avatar tap: Open photo picker (Camera | Gallery | Remove)
- Stats cards tap: Navigate to detailed view
- Quick action cards: Scale animation (0.95) on press
- Settings rows: Chevron right indicator for navigable items
- Toggles: Smooth slide animation with haptic feedback
- Logout: Confirmation dialog "Are you sure?"

DATA MANAGEMENT:
- Auto-save settings changes (debounced 500ms)
- Sync settings across devices (if logged in)
- Export data: "Download my data" (GDPR compliance)
- Account deletion: "Delete account" → Confirmation with password → 30-day grace period

EMPTY STATES:
- No saved addresses: "Add your first address for faster checkout"
- No reviews: "You haven't reviewed any orders yet"
- No favorites: "Save your favorite shops for quick access"

SECURITY FEATURES:
- Two-factor authentication toggle
- Login history: Device, location, time
- Active sessions: View and logout from other devices
- Suspicious activity alerts

ANALYTICS TO TRACK:
- Profile completion percentage
- Feature usage (which sections visited most)
- Referral conversion rate
- Settings changes (theme, language)
- Support ticket submissions

OUTPUT: Include complete navigation flow, form validation rules, API endpoints for settings CRUD, and privacy policy compliance checklist.
```

---

## 🏪 PHASE 3: SHOP OWNER APP

### **PROMPT 3.1: Shop Owner Dashboard - Main Screen**

```
ROLE: You are a business intelligence dashboard designer creating a command center for water shop owners.

TASK: Design a real-time dashboard showing key metrics, active orders, and actionable insights.

SCREEN LAYOUT:

1. TOP BAR (Gradient, #0077BE to #34C4E5):
   - Shop logo (40px circular, white border, left)
   - Shop name "Blue Spring Aquatics" (16px, white, semibold)
   - Shop status toggle (right):
     • "🟢 Open" (Green, tap to toggle)
     • "🔴 Closed" (Red)
   - Notification bell (Badge if new orders/messages)

2. DATE SELECTOR (Below top bar):
   - Background: White, shadow
   - Preset chips: "Today" (Active: #0077BE) | "Yesterday" | "This Week" | "This Month"
   - Custom date picker icon (right)

3. KEY METRICS CARDS (2x2 grid, 8px gap):
   
   CARD 1: Today's Revenue
   - Icon: 💰 (#2DD4BF background circle)
   - Amount: "₹12,450" (24px, #2E4049, bold)
   - Label: "Today's Revenue" (12px, #6B7C8C)
   - Trend: "+15% from yesterday" (12px, #2DD4BF, ↑ icon)
   
   CARD 2: Orders
   - Icon: 📦 (#0077BE background circle)
   - Count: "32" (24px, #2E4049, bold)
   - Label: "Orders Today" (12px, #6B7C8C)
   - Breakdown: "28 delivered, 4 active" (10px, #6B7C8C)
   
   CARD 3: New Customers
   - Icon: 👥 (#FCD34D background circle)
   - Count: "8" (24px, #2E4049, bold)
   - Label: "New Customers" (12px, #6B7C8C)
   - Total customers: "523 total" (10px, #6B7C8C)
   
   CARD 4: Average Order Value
   - Icon: 📊 (#4EC2E5 background circle)
   - Amount: "₹389" (24px, #2E4049, bold)
   - Label: "Avg. Order Value" (12px, #6B7C8C)
   - Trend: "+₹12 from last week" (10px, #2DD4BF)

4. ACTIVE ORDERS SECTION:
   - Header: "Active Orders (4)" (16px, #2E4049, semibold, left)
   - "View All" link (#0077BE, right)
   
   TABS:
   - "New (2)" | "Preparing (1)" | "Out for Delivery (1)"
   - Active tab: #0077BE background, white text
   
   Each order card (White, shadow, 12px radius):
   
   TOP ROW:
   - Order ID "#WD4524" (14px, #2E4049, semibold)
   - Time "2 mins ago" (12px, #6B7C8C)
   - Status badge "NEW" (#F97316 background, white text)
   
   CUSTOMER INFO:
   - Avatar (32px circular, left)
   - Name "Rahul Sharma" (14px, #2E4049)
   - Rating "4.8 ★" (12px, #6B7C8C)
   - Phone number "(+91 98765 43210)" (12px, #6B7C8C)
   - Call button icon (right, #0077BE)
   
   ORDER DETAILS:
   - "3 items • ₹450" (14px, #2E4049, semibold)
   - Product thumbnails (3x 32px, horizontal)
   - Product names in condensed list:
     • "2x 20L Mineral Water Can"
     • "1x 10L Aqua Pure"
   
   DELIVERY INFO:
   - Icon: 📍 Location
   - Address: "Flat 402, Ocean Breeze Apartments..." (12px, #6B7C8C, 2-line clamp)
   - Distance: "2.3 km away" (12px, #0077BE, right aligned)
   - Delivery time: "ASAP (30-45 mins)" or "Scheduled: 4:00 PM"
   
   PAYMENT:
   - Method icon + "UPI Paid" (#2DD4BF) or "COD" (#6B7C8C)
   
   ACTION BUTTONS (Row, 8px gap):
   - "Reject" (Outline, #EF4444 border and text, 40% width)
   - "Accept Order" (Gradient #0077BE to #4EC2E5, white text, 60% width)
   - On accept: Auto-move to "Preparing" tab
   
   PREPARING STATE:
   - "Mark Ready for Delivery" button (Primary)
   - Estimated ready time countdown "Ready in 12 mins"
   
   OUT FOR DELIVERY STATE:
   - Delivery person assigned: "Assigned to Arjun Kumar"
   - "Track Delivery" button
   - Customer location on mini-map

5. INVENTORY STATUS (Collapsible):
   - Header: "Inventory Status" (16px, #2E4049, semibold)
   - Expand/collapse chevron
   
   When expanded, list of products:
   - Product name "20L Mineral Water Can" (14px, #2E4049)
   - Stock level "45 units" (12px, #6B7C8C)
   - Progress bar:
     • Green: >50 units (stock healthy)
     • Yellow: 20-50 units (moderate)
     • Red: <20 units (low stock alert)
   - "Update Stock" button for each item
   - Bulk "Update All" button at bottom

6. PERFORMANCE INSIGHTS (Card):
   - Background: Linear gradient #F0F9FF to #E0F2FE
   - Icon: 📈 Chart
   - Title: "Performance Insights" (16px, #2E4049, semibold)
   
   METRICS:
   - "⭐ Average rating: 4.8" (You're in top 10% of shops!)
   - "⏱️ Avg. delivery time: 28 mins" (2 mins faster than yesterday)
   - "✅ Order acceptance: 96%" (Excellent! Keep it up)
   - "👍 Customer retention: 78%" (12 repeat customers this week)
   
   - "View Detailed Analytics" link (#0077BE)

7. QUICK ACTIONS (Bottom sheet or FAB menu):
   - Floating Action Button (FAB, bottom right):
     • Icon: "+" (White on #0077BE gradient circle, 56px)
     • On tap: Expand to show options:
       - "Update Inventory"
       - "Add Product"
       - "Create Offer"
       - "Manage Hours"
       - "View Reports"

8. NOTIFICATIONS PANEL (Slide from right):
   - Bell icon tap opens panel
   - Categories:
     • New orders (Badge count)
     • Customer messages
     • Low stock alerts
     • Payment confirmations
     • Platform updates
   
   Each notification:
   - Icon (based on type)
   - Title + timestamp
   - Tap to navigate to relevant screen
   - Swipe to dismiss

REAL-TIME UPDATES:
- WebSocket connection for new orders
- Push notifications with sound alert
- Order count badges update live
- Revenue counter animates on new order
- Stock alerts trigger when item <20 units

INTERACTION DESIGN:
- Pull-to-refresh: Sync latest data
- Shop status toggle: Confirmation dialog if orders pending
- Order card swipe right: Quick accept
- Order card swipe left: Quick reject (with reason)
- Haptic feedback on order acceptance
- Success animation on order completion

ANALYTICS TO TRACK:
- Order acceptance rate
- Average preparation time
- Peak order hours (chart)
- Revenue trends (daily/weekly/monthly)
- Product popularity (best sellers)
- Customer ratings distribution

OFFLINE MODE:
- Cache last 24 hours data
- Queue actions (accept/reject) for sync
- "You're offline" banner at top
- Auto-retry on connection restore

OUTPUT: Include WebSocket message format, push notification templates, analytics dashboard wire frames, and database schema for metrics storage.
```

---

### **PROMPT 3.2: Order Management & Details Screen (Shop Owner)**

```
ROLE: You are designing an order management interface for shop owners to efficiently process and track orders.

TASK: Create a detailed order management screen with status updates, communication tools, and fulfillment workflows.

SCREEN LAYOUT:

1. TOP BAR:
   - Back arrow (left)
   - Order ID "#WD4524" (16px, #2E4049, center)
   - More options menu (right, 3-dot icon)

2. ORDER STATUS CARD (Top, sticky):
   - Background: Based on status
     • New: #FCD34D (Yellow)
     • Accepted: #0077BE (Blue)
     • Preparing: #4EC2E5 (Light blue)
     • Ready: #2DD4BF (Green)
     • Delivered: #2DD4BF (Green)
     • Cancelled: #EF4444 (Red)
   
   - Status text: "PREPARING ORDER" (14px, white, uppercase, center)
   - Timestamp: "Accepted 8 mins ago" (12px, white, opacity 0.9, center)
   - Countdown timer: "Ready in 12:34" (18px, white, bold, center, if preparing)

3. CUSTOMER INFORMATION CARD:
   - Avatar (56px circular, left)
   - Name "Rahul Sharma" (16px, #2E4049, semibold)
   - Rating "4.8 ★" (14px, #6B7C8C)
   - Customer type: "New Customer" or "Repeat Customer (15th order)" (#2DD4BF, 12px)
   
   CONTACT ACTIONS (Row):
   - Call button (Icon + "Call", #0077BE background, white text, 48px height)
   - WhatsApp button (Icon, #25D366 background, 40px square)
   - Message button (Icon, #0077BE background, 40px square)

4. DELIVERY DETAILS CARD:
   - Icon: 📍 Location
   - Label: "DELIVERY ADDRESS" (10px, #6B7C8C, uppercase)
   - Address: "Flat 402, Ocean Breeze Apartments, Sunset Boulevard, Coastal Road, Bangalore - 560037" (14px, #2E4049)
   - Distance: "2.3 km from your shop" (12px, #0077BE)
   - Special instructions: "Ring doorbell twice" (12px, #6B7C8C, italic, if provided)
   
   MINI MAP:
   - Google Maps embed (Full width, 160px height)
   - Customer location pin
   - Shop location pin
   - Route drawn between them
   - "Open in Maps" button (12px, #0077BE, bottom right)

5. ORDER ITEMS SECTION:
   - Header: "Order Items (3)" (16px, #2E4049, semibold)
   
   Each item:
   - Product image (64x64px, left, 8px radius)
   - Product name "20L Mineral Water Can" (14px, #2E4049, semibold)
   - SKU "SKU: MC-20L-001" (12px, #6B7C8C)
   - Quantity: "Qty: 2" (14px, #2E4049)
   - Price per unit: "₹45/unit" (12px, #6B7C8C)
   - Total for item: "₹90" (14px, #0077BE, bold, right aligned)
   
   PREPARATION CHECKLIST (If preparing):
   - Checkbox for each item: ☐ "2x 20L Mineral Water Can"
   - Check when item picked: ☑ (Checkmark in #2DD4BF)
   - Progress: "2/3 items prepared"

6. DELIVERY SCHEDULING:
   - Label: "DELIVERY TIME" (10px, #6B7C8C)
   - Type: "ASAP Delivery" or "Scheduled: 4:00 PM - 5:00 PM"
   - Estimated delivery: "Expected by 3:15 PM" (14px, #2E4049)
   
   ASSIGN DELIVERY PERSON (If ready for delivery):
   - Dropdown: "Select delivery person" (14px, #2E4049)
   - Options:
     • Arjun Kumar (Available, 2 pending deliveries)
     • Priya Reddy (Available, 0 pending)
     • Ravi Sharma (Busy, 5 pending)
   - Each option: Avatar | Name | Status | Current deliveries
   - "Auto-assign nearest" button (Use algorithm)

7. PAYMENT DETAILS CARD:
   - Background: #F0F9FF, 12px padding
   
   BREAKDOWN:
   - Items total: "₹450" (14px, #2E4049, right aligned)
   - Delivery charge: "₹20" (14px, #2E4049)
   - Platform fee: "₹5" (14px, #2E4049)
   - Discount: "-₹20" (14px, #2DD4BF, if promo applied)
   - Total: "₹455" (18px, #0077BE, bold)
   
   PAYMENT STATUS:
   - Method: "💳 UPI Payment" (14px, #2E4049)
   - Status: "✅ Paid" (#2DD4BF, 14px, bold) or "💵 COD - Collect ₹455" (#F97316, 14px, bold)
   - Transaction ID: "TXN1234567890" (12px, #6B7C8C, if online payment)

8. ORDER TIMELINE (Vertical stepper):
   
   Each step:
   - Timestamp (left, 12px, #6B7C8C)
   - Status icon (Circle, colored by status)
   - Status text (14px, #2E4049)
   - Actor (12px, #6B7C8C, e.g., "by Rahul Sharma" or "by You")
   
   STEPS:
   - "2:15 PM - Order placed by Rahul Sharma"
   - "2:17 PM - Order accepted by You"
   - "2:18 PM - Payment confirmed (UPI)"
   - "2:20 PM - Started preparing"
   - "2:32 PM - Marked ready for delivery"
   - "2:35 PM - Assigned to Arjun Kumar"
   - "2:36 PM - Out for delivery"
   - "3:15 PM - Delivered"

9. ACTION BUTTONS (Sticky bottom):
   
   NEW ORDER STATE:
   - "Reject Order" (Outline, #EF4444, 40% width)
   - "Accept Order" (Gradient, 60% width)
   
   On reject:
   - Modal: "Reason for rejection"
   - Options: Out of stock | Shop closed | Too far | Other
   - Text input for custom reason
   - "Confirm Rejection" button
   
   ACCEPTED STATE:
   - "Start Preparing" (Primary gradient, full width)
   
   PREPARING STATE:
   - "Mark Ready for Delivery" (Primary, full width)
   - Disabled until all items checked
   
   READY STATE:
   - "Assign & Dispatch" (Primary, full width)
   - Must select delivery person first
   
   OUT FOR DELIVERY STATE:
   - "Track Delivery" (Primary, full width)
   - "Call Delivery Person" (Outline)
   
   DELIVERED STATE:
   - "View Invoice" (Outline, #0077BE)
   - "Customer Feedback" (if available)

10. MORE OPTIONS MENU (3-dot menu):
    - Edit order (if not dispatched)
    - Print receipt
    - Send invoice via email
    - Report issue
    - Cancel order (with reason)

SPECIAL SCENARIOS:

BULK ORDERS (>10 items or >₹2000):
- "🚨 High-value order" badge (Top, #F97316)
- Confirmation step before acceptance
- Additional verification call to customer recommended

REPEAT CUSTOMER:
- "🌟 Loyal Customer" badge
- Order history: "15th order from Rahul Sharma"
- Average rating given: "Usually rates 5 ★"
- Quick note: "Prefers delivery at gate"

SCHEDULED DELIVERY:
- Reminder notification 30 mins before scheduled time
- Option to reschedule (if more than 2 hours away)
- "Prepare by [time]" countdown timer

DELIVERY DELAY:
- If estimated time exceeded:
  • Red alert banner "Delivery delayed"
  • "Notify customer" button (Send automated apology message)
  • Option to call customer

CUSTOMER CANCELLATION REQUEST:
- In-app cancellation request notification
- "Approve" or "Reject" buttons
- If order already prepared: Option to charge cancellation fee

INTERACTION DESIGN:
- Swipe order card right: Quick accept
- Swipe left: Quick reject (opens reason modal)
- Item checklist: Haptic feedback on check
- Status change: Confetti animation (if positive change)
- Print receipt: System print dialog or PDF download

REAL-TIME SYNC:
- WebSocket for delivery person location
- Customer location updates (if shared)
- Payment status real-time verification
- Stock quantity sync on order acceptance

OFFLINE RESILIENCE:
- Cache order details locally
- Queue status updates for sync
- Show "Offline - changes will sync" banner
- Auto-retry on connection restore

ANALYTICS EVENTS:
- Order accepted (time from order placed to accepted)
- Preparation time (time from accepted to ready)
- Delivery assignment time
- Total fulfillment time
- Rejection reason tracking

OUTPUT: Include state machine diagram for order states, notification templates, and API endpoints for status updates.
```

---

## 🎯 PHASE 4: ADVANCED FEATURES & OPTIMIZATION

### **PROMPT 4.1: Real-Time Notifications & Alerts System**

```
ROLE: You are a notification system architect designing a multi-channel alert mechanism.

TASK: Create a comprehensive notification system with push, in-app, SMS, and email alerts for both customers and shop owners.

NOTIFICATION TYPES & TRIGGERS:

CUSTOMER APP NOTIFICATIONS:

1. ORDER STATUS UPDATES:
   - Order accepted: "🎉 Great! [Shop Name] accepted your order!"
     • CTA: "Track Order"
   - Preparing: "👨‍🍳 [Shop Name] is preparing your order"
   - Out for delivery: "🚚 [Delivery Person] is on the way! Arriving in 15-20 mins"
     • CTA: "Track Live"
   - Nearby: "📍 Your delivery is 2 mins away! Please be available"
   - Delivered: "✅ Order delivered! Hope you enjoyed our service"
     • CTA: "Rate Your Experience"

2. PROMOTIONAL:
   - New shop nearby: "🆕 New shop [Shop Name] opened 1.2 km away!"
     • CTA: "Explore Menu"
   - Flash sale: "⚡ Flash Sale! 20% off on all orders above ₹200"
     • CTA: "Shop Now"
   - Loyalty rewards: "🎁 You've earned 50 points! Redeem for ₹25 off"
     • CTA: "View Rewards"

3. REMINDERS:
   - Abandoned cart: "🛒 Your cart misses you! 3 items waiting"
     • CTA: "Complete Order"
     • Trigger: 2 hours after cart creation
   - Reorder reminder: "💧 Running low? Reorder from [Shop Name]"
     • Trigger: 7 days after last order (if regular customer)

4. ALERTS:
   - Payment failed: "❌ Payment failed. Please retry"
     • CTA: "Retry Payment"
   - Order cancelled: "Order #WD4524 cancelled. Refund initiated"
   - Price drop: "💰 20L Water Can now ₹40 (was ₹45) at [Shop Name]"

SHOP OWNER APP NOTIFICATIONS:

1. ORDER ALERTS:
   - New order: "🔔 New order #WD4524 for ₹450!"
     • Sound: Alert chime (distinct, attention-grabbing)
     • Vibration: Pattern (short, long, short)
     • CTA: "Accept Order"
     • Auto-dismiss: After 5 mins (order auto-rejected)
   
2. PERFORMANCE ALERTS:
   - Low stock: "⚠️ Only 5 units left of 20L Mineral Water Can"
     • CTA: "Update Stock"
   - Negative review: "😟 New 2-star review from Rahul Sharma"
     • CTA: "Respond"
   - Rating drop: "📉 Your rating dropped to 4.6 (was 4.8 yesterday)"

3. FINANCIAL:
   - Daily summary: "💰 Today's revenue: ₹12,450 (32 orders)"
     • Trigger: 11:00 PM daily
   - Payment received: "✅ ₹450 credited to your account (Order #WD4524)"
   - Payout ready: "💵 ₹12,450 ready for withdrawal"

NOTIFICATION UI COMPONENTS:

IN-APP NOTIFICATION BANNER (Top of screen):
- Background: Based on type
  • Success: #2DD4BF
  • Warning: #F97316
  • Error: #EF4444
  • Info: #0077BE
- Icon (left, 24px, white)
- Title (14px, white, semibold)
- Message (12px, white, opacity 0.9, max 2 lines)
- Action button (right, "View" or "Dismiss")
- Auto-dismiss: 5 seconds (or manual swipe up)

PUSH NOTIFICATION FORMAT:
- Title: Short, actionable (max 50 chars)
- Body: Context (max 120 chars)
- Icon: App logo or custom icon per type
- Sound: Default or custom per type
- Badge: Unread count on app icon
- Action buttons: Primary CTA + optional secondary
- Deep link: Navigate to relevant screen on tap

NOTIFICATION CENTER (In-app):
- Accessible via bell icon
- Tabs: "All" | "Orders" | "Offers" | "Updates"
- Each notification:
  • Icon (colored based on type)
  • Title + timestamp
  • Short preview (1 line)
  • Unread indicator (blue dot)
  • Swipe to delete
- Mark all as read button
- Clear all button (confirmation dialog)

NOTIFICATION PREFERENCES:

CUSTOMER SETTINGS:
- Master toggle: Push notifications (ON/OFF)
- Categories:
  □ Order updates (Always ON, can't disable)
  □ Delivery alerts (ON)
  □ Promotional offers (OFF by default)
  □ New shops nearby (OFF)
  □ Price drops (OFF)
  □ Loyalty rewards (ON)
  □ Cart reminders (ON)

- Channels:
  □ Push notifications
  □ SMS (Mobile number required)
  □ Email (Email required)
  □ WhatsApp (Opt-in required)

- Quiet hours:
  • Start: 10:00 PM
  • End: 8:00 AM
  • Exceptions: Delivery alerts (always allowed)

SHOP OWNER SETTINGS:
- Master toggle: (Always ON for new orders)
- Categories:
  □ New orders (Always ON, can't disable)
  □ Customer messages (ON)
  □ Low stock alerts (ON)
  □ Performance insights (ON)
  □ Payment notifications (ON)
  □ Marketing tips (OFF)

- Alert methods:
  □ Push (ON)
  □ SMS (ON for critical: new orders)
  □ Email (Daily summary)
  □ Phone call (Emergency: >3 pending orders)

DELIVERY SCENARIOS:

1. ORDER PLACED:
   - Customer: "Order placed! Waiting for [Shop] to accept"
   - Shop: "🔔 New order #WD4524 for ₹450! Tap to accept"

2. ORDER ACCEPTED:
   - Customer: "Great! [Shop] accepted your order. Preparing now."
   - Shop: Auto-move order to "Preparing" tab

3. OUT FOR DELIVERY:
   - Customer: "[Delivery Person] is on the way! Track live"
   - Shop: "Order #WD4524 out for delivery"
   - Delivery Person: "New delivery assigned: ₹450, 2.3 km away"

4. DELIVERED:
   - Customer: "Order delivered! Rate your experience"
   - Shop: "₹450 will be credited in 24-48 hours"
   - Delivery Person: "Delivery completed. ₹30 earned"

SMART BATCHING:
- Group multiple notifications:
  • "3 new orders from Blue Spring Aquatics"
  • "5 items low in stock"
- Frequency capping: Max 5 promotional notifications per day
- Time-based batching: Non-urgent alerts sent at 9 AM, 2 PM, 6 PM

ERROR HANDLING:
- Failed delivery: Retry 3 times (exponential backoff)
- Undelivered notification log
- Fallback: SMS if push fails (for critical notifications)

ANALYTICS:
- Delivery rate (% successfully delivered)
- Open rate (% notifications tapped)
- Action rate (% CTAs clicked)
- Opt-out rate (% users disabling categories)
- A/B testing: Different copy, timing, icons

TECHNICAL IMPLEMENTATION:
- Push service: Firebase Cloud Messaging (FCM) or APNs
- SMS gateway: Twilio or equivalent
- Email service: SendGrid or AWS SES
- In-app: Local database for notification history
- WebSocket: Real-time updates for live screens

OUTPUT: Provide notification payload schemas (JSON), FCM/APNs configuration, retry logic flowcharts, and analytics dashboard wireframes.
```

---

## 🎨 DESIGN PRINCIPLES & ACCESSIBILITY

```
COLOR USAGE GUIDELINES:

PRIMARY ACTIONS:
- Use #0077BE gradient for main CTAs (Place Order, Accept Order, Confirm)
- Reserve #2DD4BF for success states and positive feedback
- Use #F97316 for urgent actions or warnings
- Apply #EF4444 only for destructive actions (Delete, Cancel, Reject)

TEXT HIERARCHY:
- Headings: #2E4049 (Charcoal, high contrast)
- Body text: #2E4049 for primary, #6B7C8C for secondary
- Placeholders & captions: #A8B6C1
- Links & interactive text: #0077BE

BACKGROUNDS:
- Primary surfaces: #FFFFFF
- Elevated surfaces: #FFFFFF with shadow
- Disabled states: #E5E9EC
- Input fields: #F0F9FF (light blue tint)

ACCESSIBILITY REQUIREMENTS:

1. COLOR CONTRAST:
   - Text to background: Minimum 4.5:1 (WCAG AA)
   - Large text (18px+): Minimum 3:1
   - Interactive elements: 3:1 minimum

2. TOUCH TARGETS:
   - Minimum size: 44x44px (iOS) or 48x48px (Android)
   - Spacing: 8px minimum between adjacent targets

3. TYPOGRAPHY:
   - Support dynamic type (iOS) and font scaling (Android)
   - Max scale: 200% without breaking layout
   - Line height: 1.5x for body text minimum

4. FOCUS INDICATORS:
   - Visible focus ring: 2px solid #0077BE
   - Focus order: Logical (top to bottom, left to right)

5. SCREEN READERS:
   - Meaningful labels for all interactive elements
   - Image alt text
   - Status announcements for dynamic content

6. ANIMATIONS:
   - Respect "Reduce Motion" system setting
   - Provide static alternatives for animations
   - Duration: 200-400ms for UI transitions

7. FORMS:
   - Clear error messages
   - Inline validation
   - Error states: Red border + icon + descriptive text

RESPONSIVE DESIGN:

MOBILE (320px - 767px):
- Single column layouts
- Full-width cards with 16px side margins
- Bottom sheets for modals
- Collapsible sections to save space

TABLET (768px - 1023px):
- 2-column grid for cards
- Side panels for additional info
- Larger touch targets (56px)

DESKTOP (1024px+):
- 3-column grid
- Fixed sidebar navigation
- Hover states for interactive elements
```

---

This comprehensive prompt document should enable your development team to build the entire Thannigo Water Delivery App with:

✅ Clear visual hierarchy and branding
✅ Consistent color usage and design language
✅ User-friendly interactions and micro-animations
✅ Accessibility compliance
✅ Role-based features (Customer vs Shop Owner)
✅ Logical user flows and state management
✅ Real-time updates and notifications
✅ Comprehensive error handling

Each prompt is designed to be copy-pasted to an AI code generator or given to a development team for pixel-perfect implementation.
