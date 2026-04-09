# Design System Strategy: Fluid Purity

## 1. Overview & Creative North Star
The "Fluid Purity" strategy moves away from the utility-first aesthetic of standard delivery apps and leans into a "High-End Editorial" experience. Water is essential, transparent, and fluid; the interface must reflect these qualities. 

**Creative North Star: The Liquid Gallery**
We treat every screen not as a set of data points, but as a curated editorial layout. We break the "template" look through intentional asymmetry—utilizing generous whitespace (the "breathing room") and overlapping elements that mimic the way light refracts through water. By abandoning rigid grid lines in favor of tonal layering and soft glassmorphism, we create an environment that feels premium, trustworthy, and effortlessly modern.

---

## 2. Color Architecture
Our palette is rooted in deep aquatic tones and crisp surfaces. We utilize a sophisticated Material-based token system to ensure depth and accessibility.

### Tonal Logic
- **Primary (`#005e97` / `#0077be`):** The "Source." Used for high-impact actions and brand presence.
- **Secondary (`#006a61`):** The "Flow." Used for confirmation and success states, symbolizing purity and verification.
- **Tertiary (`#28654c`):** The "Reef." Used for subtle accents and categorical tags.
- **Surface Tiers:** Use `surface-container-lowest` (#ffffff) to `surface-container-highest` (#e0e2e8) to define hierarchy.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
1.  **Tonal Shifts:** A `surface-container-low` card sitting on a `surface` background.
2.  **Soft Shadows:** Ambient depth without hard edges.
3.  **Negative Space:** Using the 8px grid to create clear separation.

### Glass & Gradient Signature
To move beyond a "flat" app feel, use Glassmorphism for floating navigation bars or modal headers. Apply a backdrop-blur (12px–20px) to semi-transparent surface colors. For primary CTAs, apply a subtle linear gradient from `primary` to `primary_container` to give buttons a "luminous" quality.

---

## 3. Typography: Editorial Authority
The typography pairing balances the "Artistic" (Syne/Epilogue) with the "Functional" (DM Sans/Plus Jakarta Sans).

| Level | Token | Font | Size | Character |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Epilogue | 3.5rem | High-contrast, bold, editorial impact. |
| **Headline** | `headline-md` | Epilogue | 1.75rem | Authoritative, used for page titles. |
| **Title** | `title-lg` | Plus Jakarta | 1.375rem | Accessible, professional, trustworthy. |
| **Body** | `body-md` | Plus Jakarta | 0.875rem | Highly legible for delivery details. |
| **Label** | `label-sm` | Plus Jakarta | 0.6875rem | Used for micro-copy and tags. |

**Editorial Note:** Use `display` styles with asymmetrical alignment (e.g., left-aligned with a significant right-margin offset) to break the standard centered "app" feel.

---

## 4. Elevation & Depth
In this design system, depth is a physical property. We use **Tonal Layering** instead of structural lines.

- **The Layering Principle:** Stack surfaces like sheets of frosted glass. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural lift.
- **Ambient Shadows:** When an element must float (e.g., a "Quick Order" FAB), use a shadow with a 24px blur, 4% opacity, using a tint of `on-surface` (#181c20). Never use pure black shadows.
- **The "Ghost Border" Fallback:** If a container needs more definition (e.g., in low-contrast scenarios), use a "Ghost Border"—the `outline-variant` token at 15% opacity.

---

## 5. Signature Components

### Buttons (The "Luminous" CTA)
- **Primary:** Height: 52px. Corner Radius: `full` (pill) or `xl` (1.5rem). Background: Gradient of `primary` to `primary_container`. 
- **Secondary:** Transparent background with a `Ghost Border`. Text color: `primary`.
- **Interactions:** On press, the button should subtly scale (0.98) and increase shadow density.

### Cards & Information Architecture
- **Rule:** Forbid divider lines within cards.
- **Implementation:** Separate the "Water Volume" from "Delivery Time" using a vertical 16px gap and a subtle background shift (e.g., placing the metadata in a `surface-container-high` pill within the card).
- **Radius:** All cards must use the `lg` (1rem) or `xl` (1.5rem) corner radius to maintain a soft, approachable feel.

### Fluid Input Fields
- **Style:** Minimalist. No bottom line or full border. Use a `surface-container-low` background with a `sm` (0.25rem) radius.
- **Focus State:** Transition to a `Ghost Border` using the `primary` color at 40% opacity.

### Specialized App Components
- **Hydration Tracker:** A custom circular progress component using a mesh gradient of `secondary` and `tertiary_fixed_dim`.
- **Liquid Selection Chips:** For selecting bottle sizes (5L, 10L, 20L). On selection, the chip should "fill" with a `primary` color animation, mimicking a container being filled with water.

---

## 6. Do's and Don'ts

### Do
- **Do** use generous whitespace. If you think there's enough space, add 8px more.
- **Do** use high-contrast typography scales (e.g., a very large `display-sm` heading next to a small `body-sm` caption).
- **Do** use rounded corners (14px+) to communicate safety and fluidity.

### Don't
- **Don't** use 1px solid dividers. Use whitespace or tonal shifts.
- **Don't** use "default" drop shadows. Always tint shadows with the surface color.
- **Don't** cram information. If a screen feels busy, move secondary information into a "Glass" bottom sheet.
- **Don't** use pure black (#000000) for text. Use `on-surface` (#181c20) for better optical comfort.