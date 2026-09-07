---
name: apple-hig-compliance
description: >-
  Use this skill whenever modifying, creating, or reviewing UI components for the
  yolo-cycling project. It enforces dual-platform Apple HIG compliance: desktop
  (≥640 px) must resemble macOS Sequoia/Sonoma native apps; mobile (<640 px) must
  resemble iOS 18. All Tailwind utility classes, design tokens, spacing, radius,
  typography, motion, and component patterns documented here are authoritative.
---

# Apple HIG Compliance — Dual-Platform Design System

> **Desktop = macOS Sequoia · Mobile = iOS 18**

This skill encodes the project's canonical Apple Human Interface Guidelines
design tokens and component patterns. Every UI change—whether a new tool page,
a shared component, or a minor layout tweak—**must** follow the rules below.

## Quick-Reference Token Table

| Token             | Mobile (<640 px)                                | Desktop (≥640 px / `sm:`)                        |
| :---------------- | :---------------------------------------------- | :----------------------------------------------- |
| Page padding      | `p-4`                                           | `sm:p-5`                                         |
| Section gap       | `space-y-4` / `gap-4`                           | `sm:space-y-5` / `sm:gap-5`                      |
| Card radius       | `rounded-2xl`                                   | `sm:rounded-2xl`                                 |
| Card padding      | `p-4`                                           | `sm:p-5`                                         |
| Button height     | `h-8.5`                                         | `h-8.5`                                          |
| Button radius     | `rounded-xl`                                    | `rounded-xl`                                     |
| Title             | `text-lg font-bold font-display`                | `sm:text-xl`                                     |
| Body text         | `text-sm`                                       | `text-sm`                                        |
| Caption / label   | `text-xs` or `text-[11px]`                      | same                                             |
| Tag / badge       | `px-2.5 py-0.5 text-[11px] rounded-full`        | same                                             |
| Numeric display   | always add `tabular-nums`                       | same                                             |
| Shadow (card)     | `shadow-ios-card`                               | same                                             |
| Shadow (popover)  | `shadow-ios-popover`                            | same                                             |
| Transition easing | `ease-apple-spring` / `cubic-bezier(0.16,1,0.3,1)` | same                                         |

## Mandatory Rules (always-on)

1. **Font stack**: SF Pro → system-ui → Inter → sans-serif. Use `font-display`
   for headings + numeric readouts.
2. **tabular-nums**: Every element that displays numeric data (metrics, stats,
   timers, inputs) **must** carry `tabular-nums` to prevent layout jitter.
3. **iOS color tokens only**: Use `text-ios-blue`, `bg-ios-red/10`, etc.
   Never use raw hex in JSX classes; tokens live in `tailwind.config.js`.
4. **Dark/Light modes**: All cards must support both. Use CSS variables from
   `index.css` (`--card-bg`, `--glass-bg`, etc.) or the Tailwind `dark:` variant.
5. **Safe Area**: Body already applies `env(safe-area-inset-*)`. Never override
   this.
6. **Touch targets**: All interactive elements ≥ 44 × 44 pt logical on mobile
   (use `min-h-[44px] min-w-[44px]` when needed).
7. **apple-touch class**: Every tappable element should include the `apple-touch`
   class for the scale-down press feedback.

## Desktop (macOS) — Key Patterns

| Pattern             | Implementation                                                                               |
| :------------------ | :------------------------------------------------------------------------------------------- |
| Sidebar             | `MacosSidebar.tsx`: 240 px fixed, frosted glass, SF Pro 13 px labels, category disclosure     |
| Content area        | Scrollable with macOS overlay scrollbars (5 px, `#8E8E93` thumb)                             |
| Modals / Panels     | Centered, `rounded-2xl`, `shadow-ios-popover`, `max-w-lg`, backdrop blur 40 px               |
| Toolbar density     | Compact; prefer inline segmented controls over dropdown selects                               |
| Hover states        | Subtle `bg-white/5 dark:bg-white/5` or `border-color` shift; optional `translateY(-2px)`     |

## Mobile (iOS) — Key Patterns

| Pattern             | Implementation                                                                               |
| :------------------ | :------------------------------------------------------------------------------------------- |
| Navigation          | Bottom TabBar via `MobileBottomNav.tsx`; full-width top header with safe-area padding         |
| Cards               | `ios-card` class + `rounded-2xl`; Inset Grouped style via `ios-inset-group` / `ios-inset-row` |
| Bottom Sheet modal  | `items-end p-0 rounded-t-[28px]`; gray capsule drag handle `w-10 h-1 rounded-full bg-slate-300` centered on top |
| Segmented control   | `IOSSegmentedControl` component or `.ios-segmented-control` CSS class                        |
| Range sliders       | Native iOS UISlider appearance (20 px white circular knob, 6 px track)                       |

## Detailed References

For the exhaustive specification, see:

- **[Design Tokens](./references/design-tokens.md)** — Colors, spacing, radius,
  shadows, typography scales, motion curves
- **[Component Patterns](./references/component-patterns.md)** — Card, Modal,
  Sheet, SegmentedControl, Sidebar, Toolbar, Navigation recipes
- **[Checklist](./references/checklist.md)** — Step-by-step audit checklist for
  reviewing any component against Apple HIG

## Verification

After modifying any UI component:

1. Run `npm run build` — must exit 0 with no TypeScript errors.
2. Visually confirm desktop layout at 1440 × 900 and mobile at 390 × 844
   (iPhone 15 Pro viewport).
3. Toggle light/dark mode; verify all tokens respond correctly.
4. Check `tabular-nums` on any numeric display by toggling values.
