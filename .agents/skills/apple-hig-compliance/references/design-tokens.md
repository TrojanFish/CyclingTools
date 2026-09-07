# Design Tokens Reference

> Authoritative token source for the yolo-cycling project.
> Maps to `tailwind.config.js`, `index.css`, and CSS custom properties.

---

## 1. Color System

### 1.1 iOS System Colors (Light / Dark)

| Token Name      | Light          | Dark           | Tailwind Class             |
| :-------------- | :------------- | :------------- | :------------------------- |
| Blue            | `#007AFF`      | `#0A84FF`      | `text-ios-blue`            |
| Green           | `#34C759`      | `#30D158`      | `text-ios-green`           |
| Indigo          | `#5856D6`      | `#5E5CE6`      | `text-ios-indigo`          |
| Orange          | `#FF9500`      | `#FF9F0A`      | `text-ios-orange`          |
| Pink            | `#FF2D55`      | `#FF375F`      | `text-ios-pink`            |
| Purple          | `#AF52DE`      | `#BF5AF2`      | `text-ios-purple`          |
| Red             | `#FF3B30`      | `#FF453A`      | `text-ios-red`             |
| Teal            | `#30B0C7`      | `#40C8E0`      | `text-ios-teal`            |
| Yellow          | `#FFCC00`      | `#FFD60A`      | `text-ios-yellow`          |
| Mint            | `#00C7BE`      | `#63E6E2`      | `text-ios-mint`            |

### 1.2 Gray Scale (6-level Apple system grays)

| Token       | Value      | Tailwind Class      | Usage                                    |
| :---------- | :--------- | :------------------ | :--------------------------------------- |
| Gray        | `#8E8E93`  | `text-ios-gray`     | Secondary text, icons                    |
| Gray 2      | `#AEAEB2`  | `text-ios-gray2`    | Tertiary text, placeholders              |
| Gray 3      | `#C7C7CC`  | `text-ios-gray3`    | Disabled state, borders                  |
| Gray 4      | `#D1D1D6`  | `text-ios-gray4`    | Light dividers                           |
| Gray 5      | `#E5E5EA`  | `text-ios-gray5`    | Grouped background inset cards           |
| Gray 6      | `#F2F2F7`  | `text-ios-gray6`    | Page-level grouped background            |

### 1.3 Surface Colors

| Surface                | Light CSS Variable               | Dark CSS Variable                |
| :--------------------- | :------------------------------- | :------------------------------- |
| Page background        | `--bg-main: #F2F2F7`            | `--bg-main: #000000`            |
| Card                   | `--card-bg: #FFFFFF`            | `--card-bg: #1C1C1E`           |
| Card secondary         | `--card-secondary: #E5E5EA`     | `--card-secondary: #2C2C2E`    |
| Glass panel            | `--glass-bg: rgba(255,255,255,0.85)` | `--glass-bg: rgba(28,28,30,0.78)` |
| Input                  | `--input-bg: #FFFFFF`           | `--input-bg: #1C1C1E`          |
| Separator              | `rgba(60,60,67,0.12)`           | `rgba(255,255,255,0.08)`       |

### 1.4 Tinted Backgrounds (for badges/tags)

Use `bg-ios-{color}/10` for subtle tints. Examples:

```
bg-ios-blue/10 text-ios-blue     → Blue badge
bg-ios-red/10 text-ios-red       → Red alert
bg-ios-green/10 text-ios-green   → Success badge
bg-ios-orange/10 text-ios-orange → Warning badge
bg-ios-purple/10 text-ios-purple → Category badge
```

---

## 2. Typography

### 2.1 Font Stack

```
Primary:  -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
          "SF Pro", system-ui, Inter, sans-serif
Mono:     "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace
```

Tailwind: `font-sans` (primary), `font-mono` (mono), `font-display` (headings).

### 2.2 Type Scale

| Role                | Mobile                           | Desktop (`sm:`)                   |
| :------------------ | :------------------------------- | :-------------------------------- |
| Page title          | `text-lg font-bold font-display` | `sm:text-xl`                     |
| Section header      | `text-base font-semibold`        | same                              |
| Card title          | `text-sm font-semibold`          | same                              |
| Body                | `text-sm`                        | same                              |
| Caption / Label     | `text-xs text-slate-400`         | same                              |
| Micro (tags/badges) | `text-[11px] font-medium`        | same                              |
| Metric value (lg)   | `text-2xl font-bold tabular-nums font-display` | `sm:text-3xl`        |
| Metric value (sm)   | `text-lg font-bold tabular-nums font-display`  | `sm:text-xl`         |

### 2.3 Font Rendering

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

Already set on `body` in `index.css`.

### 2.4 Tabular Numbers (CRITICAL)

**Every** numeric display must use:
```
tabular-nums          /* Tailwind utility */
font-display          /* Custom font-family with tnum feature */
```

Both CSS and font-feature-settings are applied globally via `index.css`:
```css
.tabular-nums, .font-display, input[type="number"] {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

---

## 3. Spacing

### 3.1 Page-Level Spacing

| Context          | Mobile      | Desktop         |
| :--------------- | :---------- | :-------------- |
| Page padding     | `p-4`       | `sm:p-5`        |
| Section spacing  | `space-y-4` | `sm:space-y-5`  |
| Grid gap         | `gap-4`     | `sm:gap-5`      |
| Card padding     | `p-4`       | `sm:p-5`        |

### 3.2 Component-Level Spacing

| Context               | Value                                   |
| :-------------------- | :-------------------------------------- |
| Card internal gap     | `space-y-3` or `space-y-4`              |
| Input ↔ label gap     | `space-y-1.5`                           |
| Button group gap      | `gap-2`                                 |
| Inset group row pad   | `py-3 px-4` (12px × 16px)              |
| Metric tile padding   | `p-3 sm:p-4`                            |
| Tag / badge padding   | `px-2.5 py-0.5`                         |

---

## 4. Border Radius

| Element              | Class              | Value     |
| :------------------- | :----------------- | :-------- |
| Page-level card      | `rounded-2xl`      | 16 px     |
| Inner card / tile    | `rounded-xl`       | 12 px     |
| Button               | `rounded-xl`       | 12 px     |
| Tag / badge          | `rounded-full`     | pill      |
| iOS Bottom Sheet     | `rounded-t-[28px]` | 28 px top |
| Segmented control    | `rounded-xl`       | 12 px     |
| Input field          | `rounded-xl`       | 12 px     |
| Small chip           | `rounded-lg`       | 8 px      |
| Avatar / icon circle | `rounded-full`     | 50 %      |

**Anti-pattern**: Never use `rounded-3xl` (1.5 rem = 24 px) on cards. Reserve
`rounded-3xl` only for `IOSCard` large variant when explicit.

---

## 5. Shadows

| Token Name        | Value                                                                                 | Usage                      |
| :---------------- | :------------------------------------------------------------------------------------ | :------------------------- |
| `shadow-ios-sm`   | `0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)`                            | Subtle inner elements      |
| `shadow-ios-md`   | `0 4px 16px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)`                           | Standard cards             |
| `shadow-ios-lg`   | `0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)`                          | Elevated cards             |
| `shadow-ios-card` | `0 2px 8px -2px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.06)`                 | Default card shadow        |
| `shadow-ios-popover` | `0 20px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)`                      | Modals, popovers           |

---

## 6. Motion & Transitions

### 6.1 Easing Curves

| Curve Name                  | Value                                | Usage                            |
| :-------------------------- | :----------------------------------- | :------------------------------- |
| Apple spring (primary)      | `cubic-bezier(0.16, 1, 0.3, 1)`     | All UI transitions               |
| Tailwind class              | `ease-apple-spring`                  | `transition-all ease-apple-spring` |

### 6.2 Duration

| Context              | Duration   |
| :------------------- | :--------- |
| Hover state          | `150 ms`   |
| Card transition      | `200 ms`   |
| Modal appear/dismiss | `300 ms`   |
| Theme toggle         | `250 ms`   |

### 6.3 Touch Feedback

The `apple-touch` CSS class provides iOS-native press feedback:
```css
.apple-touch:active {
  transform: scale(0.975);
  opacity: 0.88;
}
```

---

## 7. Glassmorphism / Materials

### 7.1 Glass Panel (Sidebar, Header)

```css
.glass-panel {
  background: var(--glass-bg);             /* rgba white/dark */
  backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 24px -1px rgba(0,0,0,0.2);
}
```

### 7.2 Glass Card (Hoverable)

```css
.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
}
.glass-card:hover {
  border-color: rgba(10, 132, 255, 0.4);  /* blue glow */
  box-shadow: 0 8px 30px -4px var(--glass-glow);
}
```

### 7.3 iOS Card (Inset Grouped)

```css
.ios-card {
  background-color: rgba(255,255,255,0.85);
  backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.06);
}
```

---

## 8. Breakpoints

| Name   | Value     | Platform     |
| :----- | :-------- | :----------- |
| Base   | `<640px`  | iOS mobile   |
| `sm`   | `≥640px`  | macOS desktop |

We use a **single breakpoint** (`sm: 640px`) for the mobile↔desktop split.
All responsive utilities follow the pattern: `{mobile} sm:{desktop}`.

---

## 9. iOS Native Controls (CSS Classes)

### 9.1 Segmented Control

```css
.ios-segmented-control {
  padding: 2px;
  border-radius: 12px;
  background-color: rgba(118,118,128, 0.12);  /* light */
  /* dark: rgba(118,118,128, 0.24) */
}
.ios-segment-item.active {
  background-color: #FFFFFF;
  color: #000000;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.04);
}
```

### 9.2 Inset Grouped Table

```css
.ios-inset-group {
  background-color: #FFFFFF;      /* dark: #1C1C1E */
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.ios-inset-row {
  padding: 12px 16px;
  border-bottom: 0.5px solid rgba(60,60,67,0.12);
}
```

### 9.3 Range Slider (UISlider)

- Track: 6 px height, `rgba(120,120,128,0.16)` background
- Thumb: 20 × 20 px, white circle, subtle shadow
- Active: `scale(1.12)` + deeper shadow

### 9.4 Scrollbar (macOS Overlay)

```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-thumb {
  background: rgba(142,142,147, 0.3);
  border-radius: 9999px;
}
```

---

## 10. Z-Index Layers

| Layer            | z-index | Usage                        |
| :--------------- | :------ | :--------------------------- |
| Base content     | `0`     | Normal page flow             |
| Sticky header    | `40`    | Top navigation bar           |
| Sidebar          | `30`    | macOS sidebar                |
| Dropdown         | `50`    | Select menus, popovers       |
| Modal backdrop   | `50`    | `bg-black/40`                |
| Modal content    | `50`    | Centered panel / sheet       |
| Toast            | `60`    | Notification toasts          |

---

## 11. Iconography

- **Library**: Lucide React (line icons, 1.5 px stroke)
- **Default size**: `w-4 h-4` (16 px)
- **In buttons**: `w-3.5 h-3.5` (14 px) with `mr-1.5`
- **Header accent icons**: `w-5 h-5` (20 px)
- **Color**: inherit parent text color, or use `text-ios-{color}`
