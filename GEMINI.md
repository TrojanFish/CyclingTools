# Yolo Cycling — Project Rules

## Design System: Apple HIG Dual-Platform

This project targets **two platforms** with a single React + Tailwind codebase:

- **Desktop (≥640 px)** → macOS Sequoia / Sonoma native aesthetic
- **Mobile (<640 px)** → iOS 18 native aesthetic

### Always-On Rules

1. **Breakpoint**: Use `sm:` (640 px) as the sole mobile↔desktop breakpoint.
2. **Spacing**: 4-Step Grid. Macro: `p-4 sm:p-5` for card/page padding; `space-y-4 sm:space-y-5` for tool root & section flow. Micro: `space-y-4` inside cards, `space-y-1.5` / `mb-1.5` for label-to-input, `gap-2` for button groups, `gap-1.5` for icon-text. Never use `p-6` or larger on standard cards.
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

### Verification & Quality Gates (Superpowers Standard)

Adhere to the `obra/superpowers` engineering discipline: **Evidence over claims, test-driven development, and mandatory verification before completion**.

1. **TDD for Scientific Calculations**: Any changes or additions to mathematical, aerodynamic, physiological, or mechanical algorithms (e.g., `src/utils/pmcCalculator.ts`, `routePacingEngine.ts`, `activityParser.ts`) MUST include corresponding unit tests in `src/utils/__tests__/`.
2. **Automated Quality Gate**: Before marking any task complete or finishing a branch, all gates must pass:
   ```bash
   npm run test                                                                              # 1. Vitest suite (100% pass)
   python .agents/skills/apple-hig-compliance/scripts/hig_checker.py scan src                  # 2. Apple HIG compliance (100/100)
   python .agents/skills/cycling-telemetry-pipeline/scripts/defensive_checker.py scan src     # 3. Defensive & Telemetry audit (100/100)
   node .\node_modules\typescript\bin\tsc --noEmit                                          # 4. TypeScript strict check (0 errors)
   node .\node_modules\vite\bin\vite.js build                                               # 5. Production build (exit 0)
   ```
3. **Defensive Code Quality**:
   - Never use `console.log` in production code.
   - Guard all `localStorage` and `IndexedDB` calls with `try...catch` and fallback to prevent `QuotaExceededError`.
   - Avoid unhandled `any` types; prefer `unknown` with type narrowing.
   - Maintain zero `TODO` or `FIXME` technical debts in production paths.

### Build & Test

```bash
npm run test     # vitest run — all unit tests must pass
npm run build    # tsc && vite build — must exit 0
```

### Continuous Integration (CI)

GitHub Actions workflow is maintained at `.github/workflows/ci.yml` and executes the full 4-stage quality gate on every pull request and push.

### Language & Terminology System

- Skill specification: `.agents/skills/cycling-terminology-system/SKILL.md`
- **Global Technical Acronyms (Tier 1)**: Universal technical abbreviations (`FTP`, `CTL`, `ATL`, `TSB`, `TSS`, `NP`, `IF`, `VI`, `VO₂max`, `Stack`, `Reach`, `CdA`) remain pure English uppercase on metric titles, chart axes, and formulas — never translated, never bracket-wrapped.
- **Authentic Chinese (Tier 2)**: UI components, menus, form inputs, and descriptions use authentic cycling Chinese (`前叉`, `下沉量`, `回弹阻尼`, `自补液`, `双盘`, `世巡职业级`) with zero English brackets or parenthetical redundancy.
- **Hierarchical Decoupling (Tier 3)**: `IOSMetricTile` primary label uses Tier 1 acronym; subtext carries concise localized Chinese explanation (`label="CTL"` ＋ `subtext="42天长期体能积淀"`). Card/section titles use pure Chinese (no bracket acronyms). Chart legend labels may use concise Chinese (`长期体能`) when legend space is constrained — never bracket hybrids like `CTL (长期体能)`.
- **Physical Units (Tier 4)**: Standard international symbols (`W`, `W/kg`, `bpm`, `rpm`, `km/h`, `PSI`, `Bar`, `mm`) — never spelled out in Chinese.
- **Tier 2 UI text**: Simplified Chinese (zh-CN) with Traditional Chinese (zh-TW) support via `language === 'zh-TW' ? '...' : '...'` pattern.
- **Code comments and variable names**: English only.
