# Design System Specification: The Fluid Architect

## 1. Overview & Creative North Star
**The Creative North Star: "Precision Serenity"**
This design system moves beyond the rigid, "boxed-in" aesthetic of traditional mobile commerce. We are building a "Digital Atelier"—an environment that feels curated, architectural, and airy. By moving away from heavy borders and standard grids, we embrace **Precision Serenity**. 

We break the "template" look through:
*   **Intentional Asymmetry:** Aligning text to strict editorial grids while allowing imagery to bleed or overlap.
*   **Atmospheric Depth:** Using light and tone rather than lines to define space.
*   **Typographic Confidence:** Large, high-contrast price points and headlines that command the layout, balanced by generous whitespace.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, maritime blue and a crisp, airy background. We do not use color simply to fill space; we use it to direct the eye.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. A section ends when the `surface` color transitions to `surface-container-low`. 

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine paper. 
*   **Base:** `surface` (#f7f9ff) acts as the canvas.
*   **Layer 1:** `surface-container-low` (#f2f3f9) for grouped content areas.
*   **Layer 2 (The Hero):** `surface-container-lowest` (#ffffff) for the highest-priority cards and interactive elements.
*   **The Glass Rule:** For floating headers or navigation bars, use `surface` at 80% opacity with a `20px` backdrop-blur. This ensures the brand colors "bleed" through the interface, creating a cohesive, organic feel.

### Signature Textures
Main CTAs should never be flat. Use a subtle linear gradient from `primary` (#005e97) to `primary-container` (#0077be) at a 135-degree angle. This provides a "jewel-toned" depth that feels premium and tactile.

---

## 3. Typography: Editorial Authority
We utilize a dual-font system to balance technical precision with approachable modernism.

*   **Display & Headlines (Plus Jakarta Sans):** These are our "Voice." Large `display-lg` and `headline-lg` tokens should be used with tight letter-spacing (-0.02em) to create an authoritative, editorial look.
*   **Titles & Body (Inter):** These are our "Utility." Inter provides maximum readability at small scales. 
*   **The Price Statement:** Prices are the soul of the transaction. Use `primary-container` (#0077be) for prices, scaled between 24px and 40px, always in **Bold**.

---

## 4. Elevation & Depth
In this system, elevation is a feeling, not a drop-shadow effect.

*   **Tonal Layering:** To lift a product card, do not reach for a shadow first. Place a `surface-container-lowest` (pure white) card onto a `surface-container` (light blue-grey) background. The contrast creates the lift.
*   **Ambient Shadows:** If a floating action button (FAB) or high-priority modal requires a shadow, use: `box-shadow: 0 12px 32px rgba(24, 28, 32, 0.06);`. The shadow color is a tint of our `on-surface` navy, never pure black.
*   **The Ghost Border:** If a border is required for accessibility (e.g., input fields), use `outline-variant` (#c0c7d2) at **20% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: The Tactile Primary
*   **Primary:** Height 52px, Radius 14px (`xl`). Background: `primary-gradient`. Text: `on-primary` (#ffffff), `title-sm` weight.
*   **Secondary:** No background. `1.5px` border using `primary` (#005e97). High-contrast and clear.
*   **Ghost:** No container. `primary` text. Used for "Cancel" or secondary actions to reduce visual noise.

### Cards & Lists: The Open-Air Rule
*   **Cards:** Pure white background, `xl` (1.5rem) corner radius. Use vertical whitespace (32px) to separate card groups rather than dividers.
*   **Chips:** Use `tertiary-fixed` (#b1f0d0) for "Verified" or "Success" states. Use `tertiary-container` (#437e64) with `on-tertiary` text for high-priority status tags.

### Inputs: The Focused State
*   **Default:** `surface-container-high` background, no border.
*   **Focused:** `surface-container-lowest` background with a 1.5px `primary` border. This "pop-out" effect signals the user's focus clearly.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use overlapping elements. A product image can slightly break the boundary of its container to create depth.
*   **Do** use `secondary-fixed` (#86f5e6) for soft backgrounds behind "Success" icons.
*   **Do** prioritize whitespace. If a screen feels "busy," remove a line and add 16px of padding.

### Don’t:
*   **Don’t** use 1px solid dividers. Use a `8px` gap of a different surface tone instead.
*   **Don’t** use pure black (#000000) for text. Always use `on-surface` (#181c20) for a softer, more premium readability.
*   **Don’t** use standard "Material Design" shadows. Keep them diffused, light, and tinted with the brand navy.