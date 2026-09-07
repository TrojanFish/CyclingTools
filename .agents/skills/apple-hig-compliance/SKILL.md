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
| Button & Control  | `h-9` (36px)                                    | `h-9` (36px)                                     |
| Button radius     | `rounded-xl`                                    | `rounded-xl`                                     |
| Title             | `text-lg font-bold font-display`                | `sm:text-xl`                                     |
| Body text         | `text-sm`                                       | `text-sm`                                        |
| Caption / label   | `text-xs` or `text-[11px]`                      | same                                             |
| Tag / badge       | `px-2.5 py-0.5 text-[11px] rounded-full`        | same                                             |
| Numeric display   | always add `tabular-nums`                       | same                                             |
| Shadow (card)     | `shadow-ios-card`                               | same                                             |
| Shadow (popover)  | `shadow-ios-popover`                            | same                                             |
| Transition easing | `ease-apple-spring` / `cubic-bezier(0.16,1,0.3,1)` | same                                         |

## Core Apple Design Pillars in Action

1. **Clarity (清晰优先)**:
   - Unambiguous visual hierarchy: Strict type scale with high contrast (WCAG 2.1 AA ≥4.5:1 for body text, ≥3.0:1 for graphical elements).
   - Dynamic & Tabular: All numeric values and timers must use `tabular-nums` and SF Mono/display fonts to eliminate jitter.
   - Text legibility: Never use `font-extrabold` or `font-black`. Maximum font weight is `font-bold`.
2. **Deference (顺应内容)**:
   - The UI is a quiet, elegant frame for user data. Minimize heavy borders and avoid garish solid background blocks on cards.
   - Frosted glass (`glass-panel`, `backdrop-blur-2xl`) blurs background context gently without competing with foreground data.
3. **Depth (景深层次)**:
   - Physical layering: Base view (z-0) → Cards & Inset Groups (z-0) → Sticky Header / Sidebar (z-30/40) → Popovers & Sheets (z-50).
   - Physics-based motion: Use Apple spring cubic-bezier (`ease-apple-spring`: `cubic-bezier(0.16,1,0.3,1)`).
   - Sheet Detents: iOS bottom sheets feature `.medium` (`max-h-[50vh]`) or `.large` (`max-h-[90vh]`) detents with a grabber capsule.

## Mandatory Rules (always-on)

1. **Font stack**: SF Pro → system-ui → Inter → sans-serif. Use `font-display` for headings + numeric readouts.
2. **tabular-nums**: Every element that displays numeric data (metrics, stats, timers, inputs) **must** carry `tabular-nums` to prevent layout jitter.
3. **iOS color tokens only**: Use `text-ios-blue`, `bg-ios-red/10`, etc. Never use raw hex in JSX classes; tokens live in `tailwind.config.js`.
4. **Dark/Light modes**: All cards must support both. Use CSS variables from `index.css` (`--card-bg`, `--glass-bg`, etc.) or the Tailwind `dark:` variant.
5. **Safe Area**: Body already applies `env(safe-area-inset-*)`. Never override this.
6. **Touch targets**: All interactive elements ≥ 44 × 44 pt logical on mobile (use `min-h-[44px] min-w-[44px]` or adequate padding).
7. **apple-touch class**: Every tappable element should include the `apple-touch` class for iOS-native scale-down press feedback.
8. **3-Tier Button Hierarchy**:
   - **Prominent (Filled Accent)**: Primary call-to-action (CTA). **Strict limit: At most 1 Prominent button per card/view** (e.g. `bg-ios-blue text-white`).
   - **Bordered (Tonal/Outline)**: Secondary actions (e.g. `bg-ios-blue/10 text-ios-blue` or `border border-black/10 dark:border-white/10`).
   - **Plain (Ghost/Text)**: Tertiary or cancel actions (e.g. `text-slate-400 hover:text-slate-200`).
9. **Unified Control Height (36px / h-9)**: Action buttons, segmented controls (`IOSSegmentedControl`), header action buttons, and `<select>` dropdowns share identical `h-9 rounded-xl` for harmonious visual alignment across all tool pages.
10. **Segmented Controls**: Segmented controls MUST expand full-width (`w-full flex-1 min-w-0`) on mobile (<640px) matching iOS 18 `UISegmentedControl`, and remain compact (`sm:w-auto`) on desktop.
11. **Unified Component Architecture**: All tool pages MUST adhere to standard component anatomy: `IOSToolHeader` for top banners, `IOSCardHeader` for section/card headers, `IOSMetricTile` for KPI metrics, and `IOSCard` for containers. Ad-hoc hand-rolled layouts are prohibited.

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

1. **Automated HIG Audit**:
   ```bash
   python .agents/skills/apple-hig-compliance/scripts/hig_checker.py scan src
   ```
   Ensures zero non-HIG generic shadows, zero `font-black/extrabold`, zero non-tokenized raw hex, and verified touch/control dimensions.
2. **Contrast & Target Quick Check**:
   ```bash
   # Check text/background contrast (WCAG 2.1 AA/AAA)
   python .agents/skills/apple-hig-compliance/scripts/hig_checker.py contrast "#007AFF" "#FFFFFF"

   # Check touch target size (minimum 44x44pt)
   python .agents/skills/apple-hig-compliance/scripts/hig_checker.py target 44 44
   ```
3. **Build & Type Check**:
   ```bash
   npm run build    # tsc && vite build — must exit 0
   ```
4. Visually confirm desktop layout at 1440 × 900 and mobile at 390 × 844 (iPhone 15 Pro viewport).
5. Toggle light/dark mode; verify all tokens respond correctly.
6. Check `tabular-nums` on any numeric display by toggling values.
