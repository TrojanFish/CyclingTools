# Component Patterns Reference

> Canonical recipes for every UI component pattern in yolo-cycling.
> Each pattern shows the **iOS mobile** and **macOS desktop** treatment.

---

## 1. Page Layout Shell

### 1.1 Desktop (≥640 px)

```
┌─────────────────────────────────────────────────────┐
│  Header (glass-panel, h-12, safe-area top)          │
├────────┬────────────────────────────────────────────┤
│ macOS  │                                            │
│ Sidebar│     Content Area (scrollable)              │
│ 240px  │     p-5, max-w constrained                 │
│ frosted│                                            │
│        │                                            │
└────────┴────────────────────────────────────────────┘
```

- Header: `glass-panel` with `backdrop-blur-[28px]`, `h-12`
- Sidebar: `MacosSidebar.tsx`, 240 px fixed width, frosted glass
- Content: scrollable, `p-5` padding

### 1.2 Mobile (<640 px)

```
┌─────────────────────┐
│ Header (safe-area)  │
├─────────────────────┤
│                     │
│   Content Area      │
│   p-4, full width   │
│                     │
│                     │
├─────────────────────┤
│ Bottom TabBar       │
│ (MobileBottomNav)   │
└─────────────────────┘
```

- Header: full-width, `env(safe-area-inset-top)` padding
- Content: `p-4` padding, `pb-20` for bottom nav clearance
- TabBar: `MobileBottomNav.tsx` with `env(safe-area-inset-bottom)`

---

## 2. Cards

### 2.1 Standard Card

```jsx
<div className="ios-card rounded-2xl p-4 sm:p-5">
  {/* content */}
</div>
```

Or using the `IOSCard` component:

```jsx
<IOSCard variant="default" padding="md">
  {/* content */}
</IOSCard>
```

**Variants available:**
- `default` — solid white/dark background, subtle border, `shadow-ios-card`
- `inset` — recessed `bg-slate-50 dark:bg-[#2C2C2E]/60`, minimal shadow
- `glass` — translucent with `backdrop-blur-2xl saturate-180`
- `elevated` — higher shadow for floating cards

### 2.2 Metric Tile (数值/KPI卡片 — `IOSMetricTile`)

For displaying numeric KPIs and analysis metrics. Always use `IOSMetricTile` from `src/components/common/IOSCard.tsx`.
It strictly enforces `tabular-nums`, SF Mono font, accent color tinting, and subtitle alignment.

```jsx
import { IOSMetricTile } from '../common/IOSCard';

<IOSMetricTile
  label="估算功率"
  value={resultPower}
  unit="W"
  subtext="推重比 3.42 W/kg"
  icon={Zap}
  accent="blue"
/>
```

Grid layout standard: `grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4`

### 2.3 Inset Grouped Table (iOS Settings style)

```jsx
<div className="ios-inset-group rounded-2xl overflow-hidden">
  <div className="ios-inset-row">
    <span className="text-sm">{label}</span>
    <span className="text-sm text-ios-blue tabular-nums">{value}</span>
  </div>
  {/* more rows */}
</div>
```

### 2.4 Section Header (卡片与区块标头 — `IOSCardHeader`)

Do NOT hand-roll raw `<h2>` tags with ad-hoc icons. Always use `IOSCardHeader` from `src/components/common/IOSCard.tsx` to maintain unified visual hierarchy:

```jsx
import { IOSCardHeader } from '../common/IOSCard';

<IOSCardHeader
  title="动力学与环境变量输入"
  subtitle="精密计算参数与气象设定"
  icon={Activity}
  iconColor="text-ios-blue bg-ios-blue/10 dark:bg-ios-blue/20"
  action={<button ...>操作</button>}
/>
```

---

## 3. Modals / Panels

### 3.1 Desktop — Centered Panel (macOS style)

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
  
  {/* Panel */}
  <div className="relative w-full max-w-lg rounded-2xl shadow-ios-popover
    bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/8
    max-h-[85vh] overflow-y-auto">
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-display">{title}</h2>
        <button className="apple-touch p-1.5 rounded-full
          bg-slate-100 dark:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Content */}
      {children}
    </div>
  </div>
</div>
```

### 3.2 Mobile — iOS Bottom Sheet (底部抽屉)

```jsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center
  p-0 sm:p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
  
  {/* Sheet */}
  <div className="relative w-full sm:max-w-lg
    rounded-t-[28px] sm:rounded-2xl shadow-ios-popover
    bg-white dark:bg-[#1C1C1E]
    max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
    
    {/* Drag Handle (mobile only) */}
    <div className="flex justify-center pt-2 pb-1 sm:hidden">
      <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
    </div>
    
    <div className="p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-display">{title}</h2>
        <button className="apple-touch p-1.5 rounded-full
          bg-slate-100 dark:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Content */}
      {children}
    </div>
  </div>
</div>
```

**Key differences & Detents:**
- Mobile: `items-end`, `rounded-t-[28px]`, drag handle visible (`w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600`)
- Desktop: `items-center`, `rounded-2xl`, no drag handle
- **Sheet Detents**:
  - **Medium detent** (`max-h-[50vh]`): For quick pickers, unit selectors, or brief confirmations.
  - **Large detent** (`max-h-[90vh]`): For full calculators, scrollable form inputs, and parameter sheets.

---

## 4. Header Banner (Tool Page Hero — `IOSToolHeader`)

All tool pages MUST use the unified `IOSToolHeader` from `src/components/common/IOSToolHeader.tsx` to ensure uniform layout rhythm, frosted glass treatment, background glow sphere, and standard action placement:

```jsx
import { IOSToolHeader } from '../common/IOSToolHeader';

<IOSToolHeader
  category="滚阻与形变算法"
  categoryIcon={Gauge}
  title="公路/全地形智能胎压计算器"
  description="综合车手体重、真空胎结构、实测胎宽与路面状况，精准计算前后轮最佳气压。"
  tint="blue"
  actions={
    <>
      <button onClick={handleShare} className="apple-touch h-9 px-3.5 rounded-xl bg-ios-blue text-white text-xs font-semibold shadow-ios-sm flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5" />
        <span>生成海报</span>
      </button>
      <IOSSegmentedControl ... />
    </>
  }
/>
```

---

## 5. Buttons & Control Hierarchy (Apple 3-Tier Rule)

Apple HIG enforces clear visual hierarchy. **Never place multiple Prominent buttons side-by-side.**

### 5.1 Prominent Button (实色强调按钮 — 严控最多 1 个)

Reserved for the single primary call-to-action in a card or modal (e.g. "计算", "导出", "确认").

```jsx
<button className="apple-touch h-9 px-4 rounded-xl
  bg-ios-blue text-white text-sm font-medium shadow-ios-sm
  hover:bg-ios-blue/90 active:scale-[0.975]
  transition-all ease-apple-spring flex items-center gap-2">
  <Zap className="w-4 h-4" />
  <span>立即计算</span>
</button>
```

### 5.2 Bordered / Tonal Button (次要操作按钮)

Used for secondary actions (e.g. "重置", "加载示例", "复制").

```jsx
{/* Tonal variant */}
<button className="apple-touch h-9 px-4 rounded-xl
  bg-ios-blue/10 text-ios-blue text-sm font-medium
  hover:bg-ios-blue/15 transition-all ease-apple-spring">
  {label}
</button>

{/* Outline variant */}
<button className="apple-touch h-9 px-4 rounded-xl
  bg-white dark:bg-white/5 border border-black/10 dark:border-white/10
  text-slate-700 dark:text-slate-300 text-sm font-medium
  hover:bg-slate-50 dark:hover:bg-white/10 transition-all ease-apple-spring">
  {label}
</button>
```

### 5.3 Plain / Ghost Button (纯文字/取消操作)

For low-frequency auxiliary actions or dismissals.

```jsx
<button className="apple-touch h-9 px-3 rounded-xl
  text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
  hover:bg-black/5 dark:hover:bg-white/5
  transition-all ease-apple-spring">
  取消
</button>
```

### 5.4 Icon Button (Close / Quick Action)

```jsx
{/* Compact round */}
<button className="apple-touch p-1.5 rounded-full
  bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white
  transition-all ease-apple-spring">
  <X className="w-4 h-4" />
</button>

{/* Unified control row height */}
<button className="apple-touch h-9 w-9 rounded-xl flex items-center justify-center
  bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300
  transition-all ease-apple-spring">
  <Settings className="w-4 h-4" />
</button>
```

### 5.5 Tactile Feedback (Haptics)

Call vibration / haptics on physical taps on mobile web:

```ts
import { triggerHaptic } from '../../utils/haptics';

const handleClick = () => {
  triggerHaptic('selection'); // or 'impact', 'notification'
  // proceed with action
};
```

---

## 6. Form Controls

### 6.1 Input Field

```jsx
<div className="space-y-1.5">
  <label className="text-xs text-slate-400">{label}</label>
  <input
    type="number"
    className="w-full h-10 px-3.5 rounded-xl text-sm tabular-nums
      bg-white dark:bg-[#1C1C1E]
      border border-black/10 dark:border-white/10
      focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue
      transition-all ease-apple-spring"
  />
</div>
```

### 6.2 NumberStepper

Use the `NumberStepper` component for numeric inputs with ± controls.
Located at `src/components/common/NumberStepper.tsx`.

### 6.3 Select / Dropdown

```jsx
<select className="h-10 px-3 rounded-xl text-sm
  bg-white dark:bg-[#1C1C1E]
  border border-black/10 dark:border-white/10
  focus:ring-2 focus:ring-ios-blue/30">
  <option>{...}</option>
</select>
```

### 6.4 Segmented Control (分段选择胶囊 — `IOSSegmentedControl`)

Always use the `IOSSegmentedControl` component (`src/components/common/IOSSegmentedControl.tsx`).
- **Mobile (<640px)**: Automatically expands full-width (`w-full`), each segment takes equal width (`flex-1 min-w-0`), maximizing touch targets and filling cards horizontally matching iOS 18 `UISegmentedControl`.
- **Desktop (≥640px)**: Retains compact inline width (`sm:w-auto`), or can be full-width via `fullWidth={true}`.
- If wrapping in a container, avoid fixed width like `max-w-xs`; use `w-full sm:max-w-xs`.

```jsx
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';

<IOSSegmentedControl
  options={[
    { id: 'psi', label: 'PSI' },
    { id: 'bar', label: 'BAR' },
    { id: 'kpa', label: 'KPA' },
  ]}
  value={unit}
  onChange={setUnit}
  size="sm"
/>
```

---

## 7. Tags & Badges

### 7.1 Category Tag

```jsx
<span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full
  bg-ios-{color}/10 text-ios-{color}">
  {label}
</span>
```

### 7.2 Status Badge

```jsx
<span className="inline-flex items-center gap-1 px-2 py-0.5
  text-[11px] font-medium rounded-full
  bg-ios-green/10 text-ios-green">
  <span className="w-1.5 h-1.5 rounded-full bg-current" />
  {status}
</span>
```

---

## 8. Navigation

### 8.1 macOS Sidebar (`MacosSidebar.tsx`)

Structure:
- Search filter input at top
- Categories with disclosure triangles (`ChevronDown` / `ChevronRight`)
- Tool items: icon (16 px) + label (13 px SF Pro)
- Active state: `bg-ios-blue/15 text-ios-blue` with `rounded-lg`
- Profile card at bottom
- Collapsed mode: icons only, 56 px width

### 8.2 Mobile Bottom Tab Bar (`MobileBottomNav.tsx`)

- Fixed bottom, safe-area padding
- 4-5 tabs with icons (20 px) + labels (10 px)
- Active tab: `text-ios-blue`
- Inactive tab: `text-ios-gray`

---

## 9. Charts (Chart.js)

### 9.1 Styling Guidelines

```js
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { family: '-apple-system, "SF Pro Text", system-ui', size: 11 },
        usePointStyle: true,
        pointStyleWidth: 8,
      }
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { font: { size: 10 } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { font: { size: 10 } }
    }
  }
};
```

### 9.2 Color Palette for Charts

Use iOS system colors in order:
1. `#0A84FF` (Blue)
2. `#30D158` (Green)
3. `#FF9F0A` (Orange)
4. `#BF5AF2` (Purple)
5. `#FF453A` (Red)
6. `#40C8E0` (Teal)
7. `#FFD60A` (Yellow)
8. `#FF375F` (Pink)

---

## 10. Responsive Grid Patterns

### 10.1 Metric Grid

```jsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
  {metrics.map(m => <MetricTile key={m.id} {...m} />)}
</div>
```

### 10.2 Tool Card Grid (Dashboard)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
  {tools.map(t => <ToolCard key={t.id} {...t} />)}
</div>
```

### 10.3 Two-Column Form Layout (Desktop)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
  <div className="space-y-4">{/* Left column inputs */}</div>
  <div className="space-y-4">{/* Right column inputs */}</div>
</div>
```

---

## 11. Loading & Empty States

### 11.1 Loading Skeleton

```jsx
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4" />
  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2" />
</div>
```

### 11.2 Empty State

```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
  <p className="text-sm text-slate-400">{emptyMessage}</p>
</div>
```

---

## 12. Accessibility Checklist

- All interactive elements must have `aria-label` or visible text
- Focus rings: `focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue`
- Contrast: text on bg must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Reduced motion: respect `prefers-reduced-motion` for animations
- Tab order: logical, top-to-bottom, left-to-right
