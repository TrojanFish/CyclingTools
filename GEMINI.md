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
5. **Buttons**: `h-8.5 rounded-xl`. Always add `apple-touch` class.
6. **Numbers**: Always add `tabular-nums` to numeric displays.
7. **Colors**: Use `text-ios-{color}` / `bg-ios-{color}` tokens only. No raw hex in JSX classNames.
8. **Modals**: Desktop = centered panel; Mobile = iOS bottom sheet with `rounded-t-[28px]` and drag handle.
9. **Shadows**: Use `shadow-ios-sm`, `shadow-ios-card`, `shadow-ios-popover`. Never generic Tailwind shadows.
10. **Icons**: Lucide React, default `w-4 h-4`.

### Skill Reference

For comprehensive tokens, patterns, and audit checklist, activate the `apple-hig-compliance` skill.

### Build

```bash
npm run build    # tsc && vite build — must exit 0
```

### Language

- UI text: Simplified Chinese (zh-CN) with Traditional Chinese (zh-TW) support
- Code comments and variable names: English
