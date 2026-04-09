# Design System Documentation: The Fluid Professional

## 1. Overview & Creative North Star: "The Architectural Flow"
The objective of this design system is to transcend the generic "SaaS-blue" template. We are moving toward an editorial experience characterized by high-contrast typography, intentional asymmetry, and a rejection of traditional containment. 

Our Creative North Star is **The Architectural Flow**. We treat the screen not as a flat canvas, but as a three-dimensional space where light and depth define boundaries. By utilizing high-end typography scales (Manrope and Plus Jakarta Sans) and a "No-Line" philosophy, we create a digital environment that feels premium, curated, and authoritative. This is a system built on "Quiet Luxury"—where the quality is felt through spatial cadence rather than heavy borders or loud decorations.

---

### 2. Colors & Tonal Logic
This system utilizes a sophisticated palette of deep navies and vibrant teals, grounded by a layered surface architecture.

*   **Primary Logic:** Use `primary` (#005e97) for core brand actions. To add "soul" to the UI, leverage gradients transitioning from `primary` to `primary_container` (#0077be) in hero sections and major CTAs.
*   **The "No-Line" Rule:** Designers are strictly prohibited from using 1px solid borders to section off content. Boundaries must be defined by background color shifts—for example, placing a `surface_container_low` card on a `surface` background.
*   **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of fine paper. 
    *   **Base:** `surface` (#f7f9ff)
    *   **Level 1:** `surface_container_low` (#f2f3f9) for secondary groupings.
    *   **Level 2:** `surface_container_highest` (#e0e2e8) for high-priority interactive elements.
*   **The "Glass & Gradient" Rule:** For floating elements or top-level navigation, use Glassmorphism. Apply `surface_container_lowest` (#ffffff) at 70% opacity with a 20px backdrop-blur. This ensures the primary blue and teal brand colors "bleed" through the interface, creating a cohesive, integrated feel.

---

### 3. Typography: Editorial Authority
We pair the geometric stability of **Manrope** for headings with the humanist clarity of **Plus Jakarta Sans** for body copy.

*   **Display & Headlines (Manrope):** Use `display-lg` and `headline-lg` to create "Editorial Moments." Large, bold navy text (`on_surface`) should sit with significant white space to establish a clear point of entry.
*   **Body & Titles (Plus Jakarta Sans):** These are designed for endurance. `body-md` (0.875rem) in `on_surface_variant` (#404751) provides the "Neutral Grey" feel of the original brand while maintaining AAA accessibility.
*   **Price Points:** Always use `display-sm` or `headline-md` in `primary_container` (#0077be) to draw the eye immediately to the value proposition.

---

### 4. Elevation & Depth
In this system, "Elevation" is a product of light and layering, never heavy shadows.

*   **The Layering Principle:** Depth is achieved by stacking surface tokens. A card should be `surface_container_lowest` (#ffffff) sitting on a `surface_container_low` background. This creates a natural "lift" without visual noise.
*   **Ambient Shadows:** When a floating state is required (e.g., a primary button or a modal), use an ultra-diffused shadow: `0 12px 32px rgba(0, 119, 190, 0.08)`. The shadow color is tinted with our Primary Blue to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline_variant` at 20% opacity. Never use 100% opaque borders.
*   **Roundedness:** Adhere to the `xl` (1.5rem / 24px) or `lg` (1rem / 16px) scales for containers to maintain the "Soft Professional" aesthetic. Inputs use `md` (0.75rem / 12px) to provide a slightly sharper, more functional feel.

---

### 5. Components

#### Buttons
*   **Primary:** Height 52px, Radius 14px. Background: `primary_container` (#0077be). Text: `on_primary` (White, Bold). Apply a subtle 2px inner-glow on hover to simulate tactile feedback.
*   **Secondary:** White background with a "Ghost Border" of `primary` at 40% opacity. 
*   **Tertiary:** No background or border. Use `primary` text with a `label-md` weight.

#### Inputs & Forms
*   **Text Inputs:** Radius 12px. Border: `tertiary_fixed_dim` (#96d4b5) to provide a soft mint accent. On focus, the border transitions to `primary` (#005e97) with a 4px soft outer glow.
*   **Feedback:** Use `error` (#ba1a1a) for alerts, but wrap them in an `error_container` with 12px padding to avoid a "harsh" clinical look.

#### Cards & Lists
*   **Forbid Dividers:** Do not use horizontal lines between list items. Use 16px–24px of vertical white space (Spacing Scale) or alternating subtle background shifts (`surface` to `surface_container_low`).
*   **Selection Chips:** Use `secondary_fixed` (#86f5e6) for unselected states and `primary` with white text for active states.

#### Navigation (The 5-Tab Floating Bar)
The bottom navigation should not be "attached" to the bottom of the screen. It should be a floating capsule with `surface_container_lowest` at 80% opacity and a `xl` radius. This emphasizes the "Glassmorphism" rule and feels like a modern utility tool.

---

### 6. Do’s and Don'ts

*   **DO:** Use asymmetrical layouts. For example, a large headline on the left with body copy offset to the right.
*   **DO:** Prioritize white space over content density. If a screen feels "busy," increase the surface nesting depth.
*   **DON'T:** Use solid black (#000000). Use `on_surface` (#181c20) for all high-contrast text.
*   **DON'T:** Use 1px dividers or "boxes inside boxes." Let the typography and background shifts do the work.
*   **DO:** Ensure that all interactive elements have a minimum touch target of 44px, even if the visual element is smaller.