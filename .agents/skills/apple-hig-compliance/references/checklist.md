# Apple HIG Compliance Audit Checklist

> Use this checklist when reviewing any component. Walk through each item and
> verify compliance. Mark non-conforming items for remediation.

---

## Pre-Flight

- [ ] Component builds without TypeScript errors (`npm run build`)
- [ ] Component renders in both light and dark mode
- [ ] Component is responsive (check at 390 px and 1440 px widths)

---

## 1. Typography

- [ ] Page title uses `text-lg sm:text-xl font-bold font-display`
- [ ] Section headers use `text-base font-semibold` or `text-sm font-semibold`
- [ ] Body text uses `text-sm`
- [ ] Captions/labels use `text-xs text-slate-400`
- [ ] Tags/badges use `text-[11px] font-medium`
- [ ] **No `text-2xl` or larger on card titles** (reserved for hero metric values only)
- [ ] **No `font-extrabold`** — maximum weight is `font-bold`
- [ ] All headings include `font-display`

---

## 2. Numeric Displays

- [ ] Every numeric value has `tabular-nums` class
- [ ] Metric tiles use `font-display` + `tabular-nums`
- [ ] `input[type="number"]` inherits `tabular-nums` from CSS
- [ ] No layout shift when numeric values change (test with varying digit counts)

---

## 3. Spacing

- [ ] Page-level padding: `p-4 sm:p-5`
- [ ] Section gaps: `space-y-4 sm:space-y-5` or `gap-4 sm:gap-5`
- [ ] Card internal padding: `p-4 sm:p-5`
- [ ] **No `p-6`, `p-7`, `p-8`** on standard cards (too loose for Apple density)
- [ ] **No `space-y-6` or larger** between sections
- [ ] Tag padding: `px-2.5 py-0.5` (not `px-3 py-1`)

---

## 4. Border Radius

- [ ] Outer cards: `rounded-2xl` (16 px)
- [ ] Inner cards/tiles: `rounded-xl` (12 px)
- [ ] Buttons: `rounded-xl` (12 px)
- [ ] Tags/badges: `rounded-full` (pill)
- [ ] **No `rounded-3xl`** on regular cards
- [ ] Bottom sheet: `rounded-t-[28px] sm:rounded-2xl`

---

## 5. Colors & Tokens

- [ ] All colors use `text-ios-{color}` / `bg-ios-{color}` tokens
- [ ] No raw hex values in JSX className strings
- [ ] Badge/tag tints use `bg-ios-{color}/10`
- [ ] Dark mode surfaces use `dark:bg-[#1C1C1E]` or `dark:bg-[#2C2C2E]`
- [ ] Separators use `border-black/5 dark:border-white/8` or CSS variable

---

## 6. Shadows

- [ ] Standard cards: `shadow-ios-card` or `shadow-ios-sm`
- [ ] Modals/popovers: `shadow-ios-popover`
- [ ] **No generic Tailwind shadows** (`shadow-md`, `shadow-lg`) — use iOS tokens

---

## 7. Buttons

- [ ] Primary: `h-8.5 rounded-xl bg-ios-blue text-white`
- [ ] Secondary: `h-8.5 rounded-xl bg-ios-blue/10 text-ios-blue`
- [ ] All buttons have `apple-touch` class
- [ ] Icon buttons: `p-1.5 rounded-full`
- [ ] **No `h-9` or `h-10` buttons** (h-8.5 = 34 px, Apple HIG standard)
- [ ] **No `rounded-2xl` on buttons** — use `rounded-xl`

---

## 8. Cards & Surfaces

- [ ] Uses `ios-card` class OR `IOSCard` component
- [ ] Glass cards have `backdrop-filter: blur()` + border
- [ ] Hover states on desktop: subtle border glow or `translateY(-2px)`
- [ ] Inset grouped tables use `.ios-inset-group` + `.ios-inset-row`

---

## 9. Modals

- [ ] **Desktop**: centered, `max-w-lg`, `rounded-2xl`, `shadow-ios-popover`
- [ ] **Mobile**: bottom-aligned, `rounded-t-[28px]`, full width
- [ ] Mobile sheet has **drag handle**: `w-10 h-1 rounded-full bg-slate-300`
- [ ] Drag handle hidden on desktop: `sm:hidden`
- [ ] Backdrop: `bg-black/40 backdrop-blur-sm`
- [ ] Close button: top-right, `p-1.5 rounded-full bg-slate-100 dark:bg-white/10`
- [ ] Max height: `max-h-[90vh] sm:max-h-[85vh]`
- [ ] Content scrollable: `overflow-y-auto`

---

## 10. Navigation

### Desktop (macOS)
- [ ] Sidebar visible (240 px fixed, frosted glass)
- [ ] Search filter at top
- [ ] Categories with disclosure triangles
- [ ] Active item: `bg-ios-blue/15 text-ios-blue rounded-lg`

### Mobile (iOS)
- [ ] Bottom TabBar visible
- [ ] Active tab: `text-ios-blue`
- [ ] Safe area padding on bottom
- [ ] No sidebar visible

---

## 11. Touch & Interaction

- [ ] All tappable elements ≥ 44 × 44 pt on mobile
- [ ] `apple-touch` class on interactive elements
- [ ] Hover states only on desktop (`hover:` prefix)
- [ ] Transition easing: `ease-apple-spring` or `cubic-bezier(0.16,1,0.3,1)`
- [ ] No abrupt transitions — all state changes animated

---

## 12. Forms & Inputs

- [ ] Input fields: `h-10 rounded-xl` with proper border
- [ ] Focus state: `focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue`
- [ ] Labels above inputs: `text-xs text-slate-400`
- [ ] Range sliders use native iOS styling (from `index.css`)
- [ ] Segmented controls use `IOSSegmentedControl` or `.ios-segmented-control`

---

## 13. Icons

- [ ] Lucide React icons only (consistent 1.5 px stroke)
- [ ] Default size: `w-4 h-4`
- [ ] In buttons: `w-3.5 h-3.5`
- [ ] Color inherits from parent or uses `text-ios-{color}`

---

## 14. Responsive Layout

- [ ] Single breakpoint: `sm:` (640 px) for mobile→desktop
- [ ] Grid columns adapt: `grid-cols-2 sm:grid-cols-4` etc.
- [ ] No content overflow on 390 px width
- [ ] No excessive whitespace on 1440 px width
- [ ] Bottom padding for mobile nav clearance: `pb-20` on main content

---

## 15. Dark/Light Mode

- [ ] All surfaces respond to `.dark` / `.light` class
- [ ] Text colors adapt via CSS variables or `dark:` variants
- [ ] Glass materials change opacity appropriately
- [ ] Charts and diagrams adapt colors
- [ ] No hardcoded white-on-white or black-on-black issues

---

## 16. Performance

- [ ] No excessive re-renders from style recalculations
- [ ] `backdrop-filter` limited to visible surfaces (avoid stacking)
- [ ] Large lists use virtualization or pagination
- [ ] Images lazy-loaded where applicable

---

## Severity Levels

| Level      | Action Required                                         |
| :--------- | :------------------------------------------------------ |
| 🔴 Critical | Blocks deployment — spacing, radius, or button height violations |
| 🟡 Warning  | Should fix before next release — color token, shadow issues |
| 🟢 Minor    | Nice to fix — hover state, transition timing tweaks     |
