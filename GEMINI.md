# Yolo Cycling — Project Rules

## Design System: Apple HIG Dual-Platform

This project targets **two platforms** with a single React + Tailwind codebase:

- **Desktop (≥640 px)** → macOS Sequoia / Sonoma native aesthetic
- **Mobile (<640 px)** → iOS 18 native aesthetic

### Always-On Rules

1. **Breakpoint**: Use `sm:` (640 px) as the sole mobile↔desktop breakpoint.
2. **Spacing**: `p-4 sm:p-5` for page/card padding; `space-y-4 sm:space-y-5` for sections. Never use `p-6` or larger on standard cards.
3. **Radius**: Cards `rounded-2xl`, inner elements `rounded-xl`, buttons `rounded-xl`, tags `rounded-full`. Never `rounded-3xl` on regular cards.
4. **Typography**: Titles `text-lg sm:text-xl font-bold font-display`. Max weight `font-bold` (never `font-extrabold`).
5. **Buttons & Controls**: `h-9 rounded-xl` (36px, Apple HIG standard control height). Action buttons, segmented controls (`IOSSegmentedControl`), header buttons, and `<select>` dropdowns share identical `h-9` height for unified visual alignment. Always add `apple-touch` class.
6. **Numbers**: Always add `tabular-nums` to numeric displays.
7. **Colors**: Use `text-ios-{color}` / `bg-ios-{color}` tokens only. No raw hex in JSX classNames.
8. **Modals**: Desktop = centered panel; Mobile = iOS bottom sheet with `rounded-t-[28px]` and drag handle.
9. **Shadows**: Use `shadow-ios-sm`, `shadow-ios-card`, `shadow-ios-popover`. Never generic Tailwind shadows.
10. **Icons**: Lucide React, default `w-4 h-4`.
11. **Segmented Controls**: Segmented controls MUST expand full-width (`w-full flex-1 min-w-0`) on mobile (<640px) matching iOS 18 `UISegmentedControl`, and stay compact (`sm:w-auto`) on desktop.
12. **Unified Architecture**: All tool pages must adhere to standard component anatomy: `IOSToolHeader` for page headers, `IOSCardHeader` for card/section headers, `IOSMetricTile` for KPI/metric tiles, and `IOSCard` for containers. Avoid ad-hoc hand-rolled layouts.
13. **Button Hierarchy**: At most **1** Prominent (accent fill) button per card or view. Secondary actions must be Bordered (outline/tonal) or Plain (ghost).
14. **Automated Audit**: Run `python .agents/skills/apple-hig-compliance/scripts/hig_checker.py scan src` to verify 0 HIG errors.

### Skill & Audit Reference

- Skill specification: `.agents/skills/apple-hig-compliance/SKILL.md`
- Automated HIG checker:
  ```bash
  python .agents/skills/apple-hig-compliance/scripts/hig_checker.py scan src
  python .agents/skills/apple-hig-compliance/scripts/hig_checker.py contrast "#007AFF" "#FFFFFF"
  python .agents/skills/apple-hig-compliance/scripts/hig_checker.py target 44 44
  ```

### Build

```bash
npm run build    # tsc && vite build — must exit 0
```

### Language

- UI text: Simplified Chinese (zh-CN) with Traditional Chinese (zh-TW) support
- Code comments and variable names: English
