---
name: impeccable-design
description: Impeccable Anti-Slop Design System rules & detector standards. Enforces crisp architectural corner radii, strict token adherence (DESIGN.md), typographic scale, high-contrast readable interfaces, and eliminates 64 AI slop tells.
---

# Impeccable Anti-Slop Design System & Quality Catalog

Based on [Impeccable Design Guidelines & Slop Detector](https://impeccable.style/slop/#section-design-system), this skill provides rules to ensure interfaces look crafted by seasoned product designers rather than generic AI generators.

---

## 1. Core Principles

1. **Crisp, Controlled Corner Radii (No Over-Rounding):**
   - Professional product UI uses tight, architectural radii: **2px (`rounded-xs`), 4px (`rounded-sm` / `rounded-[4px]`), max 6px (`rounded-md`)**.
   - **Banned:** `24px+` or bubble curves on small cards (`rule-over-round`).
   - Full pill shapes (`rounded-full`) are strictly reserved for compact inline chips/tags, not cards or large layout containers.

2. **Strict Design System Token Adherence (`DESIGN.md`):**
   - `rule-design-system-font`: Fonts must come from approved typefaces.
   - `rule-design-system-color`: Colors must come from explicit semantic palette tokens.
   - `rule-design-system-radius`: Corner radius must belong to the documented shape scale.
   - `rule-design-system-font-size`: Type steps must follow an intentional scale (ratio >= 1.25).

3. **No Decorative AI Tells:**
   - `rule-codex-grid-background`: Do not slap decorative grid-lines across views unless it's a technical canvas/CAD tool.
   - `rule-glassmorphism`: No frosted glass or heavy backdrop blurs used for decoration.
   - `rule-border-accent-on-rounded`: Avoid thick saturated side stripes on rounded cards.
   - `rule-gpt-thin-border-wide-shadow`: Do not mix 1px hairline borders with diffuse, oversized glow shadows. Commit to clean edges.
   - `rule-repeating-stripes-gradient`: Avoid generic diagonal stripe gradients.

4. **Typographic Hierarchy & Purpose:**
   - Avoid `rule-flat-type-hierarchy`: Ensure clear contrast between titles, subtitles, and body text.
   - `rule-undersized-ui-text`: Keep functional text readable (minimum 11px for data, 12px for body).
   - `rule-kicker-above-heading`: Do not stack unnecessary tracked uppercase eyebrow kickers on every component.

---

## 2. Corner Radii Guidelines (Impeccable Standard)

| Component Type | Standard Radius | Tailwind Class | Notes |
| :--- | :--- | :--- | :--- |
| **Kanban Cards** | 3px - 4px | `rounded-[4px]` / `rounded-sm` | Crisp, precise, technical |
| **Buttons & Badges** | 3px - 4px | `rounded-[4px]` / `rounded-sm` | Solid, tactile edge |
| **Column Headers** | 4px | `rounded-t-[4px]` | Clean separation |
| **Outer Containers** | 6px | `rounded-md` | Subtly framed, structured |
| **Inputs / Selects** | 4px | `rounded-[4px]` / `rounded-sm` | High density, professional |

---

## 3. High-Density Enterprise Palette Application

- **Normal Data Cards:** Clean crisp white (`#FFFFFF`) with subtle boundary border (`border-slate-200` / `border-slate-300/80`).
- **Concluded State Cards:** Light tint (`#EEF9F3`) with dark green header text (`#14532d`), `line-through` strike on completed subjects.
- **Headers:** Saturated brand header (`#029CC8`) with sharp white contrast text.
- **Grids / Boards:** Smooth gradient backdrops tailored to the domain (e.g. atmospheric soft blue/metallic blend).

---

## 4. Verification Checklist Before Shipping

- [ ] Are corner radii tight, crisp, and architectural (3px-6px)?
- [ ] Are all glowing neon / purple orb shadows removed?
- [ ] Is functional text readable and high contrast?
- [ ] Does completed status show clear visual feedback (`#EEF9F3`, `line-through`, dark green)?
- [ ] Has `npm run build` executed with 0 errors before committing?
