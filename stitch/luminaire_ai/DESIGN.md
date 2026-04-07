# Design System Specification: Futuristic Premium

## 1. Overview & Creative North Star: "The Ethereal Engine"
The Creative North Star for this design system is **"The Ethereal Engine."** We are moving away from the "SaaS dashboard" cliché of rigid boxes and heavy lines. Instead, we treat the AI Content Builder as a living, breathing laboratory. The interface should feel like a high-end physical console made of dark obsidian and frosted glass, illuminated from within by the "spark" of artificial intelligence.

To achieve a "High-Status" editorial feel, we prioritize **intentional asymmetry** and **tonal depth**. Large headings should breathe with generous letter spacing, and components should appear to float in a multi-dimensional space rather than being pinned to a flat grid. This system is designed to feel magical yet authoritative, ensuring the user feels like a director, not just an operator.

---

## 2. Color & Surface Philosophy
The palette is built on a foundation of deep, ink-like shadows contrasted against hyper-pigmented neon accents.

### The "No-Line" Rule
**Strict Mandate:** Prohibit the use of 1px solid, high-contrast borders for sectioning or layout. Boundaries must be defined through:
1.  **Background Shifts:** Placing a `surface_container_low` card on a `surface` background.
2.  **Tonal Transitions:** Using subtle shifts between `surface_container` tiers to denote change in context.

### Surface Hierarchy & Nesting
Treat the UI as physical layers. Each "inner" container should utilize a tier higher in the hierarchy to create a sense of proximity to the user.
*   **Base Layer:** `surface` (#0b1326) — The infinite void.
*   **Content Areas:** `surface_container_low` (#131b2e) — Large workspace areas.
*   **Active Modules:** `surface_container_highest` (#2d3449) — Floating panels and interactive inspectors.

### The "Glass & Gradient" Rule
To capture the "Magical" personality, use **Glassmorphism** for modal overlays and floating sidebars:
*   **Recipe:** `surface_container` at 70% opacity + `backdrop-blur: 24px`.
*   **Signature Textures:** Apply a linear gradient (45deg) from `primary` (#b7c4ff) to `primary_container` (#2d62ff) for high-value CTAs. This creates "visual soul" that flat colors lack.

---

## 3. Typography
The system utilizes a dual-font approach to balance editorial authority with functional clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "tech-luxury" feel. Use `display-lg` through `headline-sm` for AI-generated titles and primary navigation anchors. Increase letter-spacing by 0.02em for a "premium" feel.
*   **Body & Labels (Inter):** The workhorse. Inter provides exceptional legibility for both English and Arabic scripts, crucial for a global content builder. Use `body-md` for general content and `label-sm` for metadata.
*   **Hierarchy Note:** Use `on_surface_variant` (#c3c5d8) for secondary descriptions to ensure the `primary` content stands out with high-status clarity.

---

## 4. Elevation & Depth
Depth is achieved through light and layering, not structural scaffolding.

*   **The Layering Principle:** Avoid shadows on standard cards. Instead, stack `surface_container_lowest` (#060e20) inside a `surface_container_high` (#222a3d) to create a "recessed" effect for input areas.
*   **Ambient Shadows:** For floating AI-dialogues, use a diffuse shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 15px rgba(183, 196, 255, 0.05);`. The shadow color must be a tinted version of `surface_tint`.
*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use a `outline_variant` (#434656) at **15% opacity**. Never use 100% opaque lines.
*   **Glowing Focus Rings:** When an element is focused, use a 2px outer glow: `0 0 8px tertiary` (#3cddc7). This mimics the energy of a powered-on machine.

---

## 5. Components

### Buttons
*   **Primary (The "Power" State):** Gradient fill from `primary` to `primary_container`. 16px+ (xl) rounded corners. White text (`on_primary_container`).
*   **Secondary (The "Glass" State):** Glassmorphic background (semi-transparent `surface_variant`) with a "Ghost Border."
*   **Tertiary:** No background, `primary` text weight, subtle underline on hover.

### Input Fields & The AI Command Bar
*   **Structure:** No visible borders. Use `surface_container_lowest` as the fill.
*   **AI State:** When AI is processing, the input field should display a subtle, slow-moving gradient "sweep" across the bottom edge using `secondary` (#ddb7ff) and `tertiary` (#3cddc7).

### Cards & Lists
*   **Mandate:** Forbid divider lines. Use **vertical white space** (24px or 32px from the spacing scale) to separate list items.
*   **Interactivity:** On hover, a card should shift from `surface_container_low` to `surface_container_high` and scale slightly (1.02x) to feel responsive to the user's intent.

### AI Suggestion Chips
*   **Style:** Small, `md` (12px) rounded corners. Use `tertiary_container` with `on_tertiary_container` text. These should feel like "gems" scattered within the UI.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts (e.g., a wide content area next to a narrow, floating utility panel).
*   **Do** use the `xl` (1.5rem) corner radius for main dashboard containers to keep the "Soft & Magical" feel.
*   **Do** prioritize Arabic readability by ensuring line heights are 1.6x the font size for body text.

### Don't:
*   **Don't** use pure black (#000) or pure white (#FFF). Use the `surface` and `on_surface` tokens to maintain the premium tonal range.
*   **Don't** use "Drop Shadows" that are grey or harsh. Shadows must be ambient, tinted, and wide-reaching.
*   **Don't** use standard 1px borders to separate the sidebar from the main content. Use a background color shift or a wide gutter.

---

## 7. Signature Interaction: The "Glow Focus"
In this design system, interactivity is synonymous with light. When a user interacts with a "Content Block," the entire container should emit a very soft, `tertiary` (#3cddc7) outer glow (opacity 10%). This signals that the AI is "focused" on that specific piece of content, reinforcing the high-status, professional nature of the tool.