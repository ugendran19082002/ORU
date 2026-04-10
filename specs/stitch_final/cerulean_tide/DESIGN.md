```markdown
# Design System Specification: The Fluid Editorial

## 1. Overview & Creative North Star
**Creative North Star: "Hydro-Editorial Sophistication"**

This design system moves away from the generic, boxy layouts of traditional utility apps and embraces a high-end, editorial aesthetic. By leveraging the fluidity of water and the precision of a premium lifestyle magazine, we create an experience that feels refreshing, trustworthy, and intentional.

To break the "template" look, we utilize **intentional asymmetry**—offsetting headings and utilizing generous, "breathable" white space. We reject rigid grids in favor of **Tonal Layering**, where hierarchy is defined by light and depth rather than lines and boxes. The result is a digital environment that feels less like a database and more like a curated service.

---

## 2. Color Architecture
Our palette is rooted in deep aquatic tones and crisp, refreshing neutrals. We avoid "flatness" by using a sophisticated spectrum of surface containers.

### The Palette (Material Design Tokens)
*   **Primary Hierarchy:** `primary` (#005e97) for core actions, with `primary_container` (#0077be) serving as the vibrant focal point for high-priority CTAs.
*   **Success & Verification:** `secondary` (#006a61) and `secondary_container` (#83f2e3) provide a lush, "teal-water" reassurance.
*   **Surface Depth:** We utilize `surface` (#f7f9ff) as our base, layering with `surface_container_low` (#f2f3f9) and `surface_container_highest` (#e0e2e8) to create structure.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established through background color shifts. To separate a section, place a `surface_container_low` block against the `surface` background. The transition of tone is the divider.

### The Glass & Gradient Rule
To achieve a "premium water" feel, use **Glassmorphism** for floating headers or navigation bars. 
*   **Token:** `surface` at 70% opacity + 20px Backdrop Blur.
*   **Signature Texture:** Main CTAs should not be flat. Use a subtle linear gradient from `primary` (#005e97) to `primary_container` (#0077be) at a 135-degree angle to provide "soul" and dimension.

---

## 3. Typography: The Editorial Voice
We pair the structural authority of **Plus Jakarta Sans** with the functional clarity of **Inter**. 

*   **Display & Headlines (Plus Jakarta Sans):** These are our "hero" elements. Use `display-lg` (3.5rem) for welcome screens and `headline-lg` (2rem) for section starts. The tight tracking and bold weights convey premium reliability.
*   **Body & Labels (Inter):** Designed for high readability in utility contexts. `body-md` (0.875rem) is the workhorse for all primary descriptions, using `on_surface_variant` (#404751) to maintain a soft, sophisticated contrast.
*   **Asymmetric Hierarchy:** Headlines should often be "pushed" slightly further than body text or left-aligned with significant padding-top to create an editorial, non-standard layout.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are largely replaced by the **Layering Principle**. 

*   **Surface Stacking:** Instead of a shadow, place a `surface_container_lowest` (#ffffff) card on top of a `surface_container` (#eceef3) background. The subtle 2-degree shift in brightness creates a cleaner, more modern lift.
*   **Ambient Shadows:** For "floating" elements like bottom sheets or high-priority modals, use a "Hydro-Shadow":
    *   **Color:** `on_primary_fixed_variant` at 8% opacity.
    *   **Blur:** 24px to 40px (Extra-diffused).
*   **The Ghost Border:** If a container must sit on a background of the same color, use a "Ghost Border": `outline_variant` (#c0c7d2) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
*   **Primary:** High-gloss. Gradient from `primary` to `primary_container`. Height: 52px. Radius: `xl` (1.5rem). Text: `on_primary` (White).
*   **Secondary:** The "Invisible" Button. No background. Border: 1.5px `primary_container` at 40% opacity. Text: `primary`.
*   **Tertiary:** Text-only. `label-md` uppercase with 1px letter spacing.

### Cards & Lists
*   **Constraint:** Zero divider lines. 
*   **Implementation:** Separate list items using 12px of vertical white space or by alternating background tones (`surface` to `surface_container_low`). 
*   **Radius:** Always use `xl` (1.5rem) for main cards to mimic the tension of a water droplet.

### Fluid Inputs
*   **States:** Focused inputs use a 2px `primary` "Ghost Border" (20% opacity) and a subtle inner glow. 
*   **Labels:** Floating `label-sm` in `on_surface_variant`.

### Action Chips
*   **Selection:** Use `tertiary_fixed` (#b1f0d0) background with `on_tertiary_fixed` (#002114) text for "Verified" or "Active" states.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use overlapping elements (e.g., an image of a water bottle slightly breaking the boundary of its container card).
*   **Do** use "Breathing Room." If you think there is enough padding, add 8px more.
*   **Do** use `surface_bright` for top-level navigation to keep the UI feeling airy.

### Don't:
*   **Don't** use 1px solid #DDE6F5 borders. They make the app look like a legacy enterprise tool. Use tonal shifts instead.
*   **Don't** use pure black (#000000). Always use `on_background` (#181c20) for text to maintain the soft editorial feel.
*   **Don't** use sharp corners. Everything must feel "eroded" and smooth, adhering to the `xl` and `lg` roundedness scale.

---
**Director's Note:** Every screen should feel like a page from a high-end magazine. If a layout feels too "structured" or "gridded," look for ways to break the alignment or use a background tone to guide the eye instead of a line.```