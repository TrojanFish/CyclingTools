---
name: cycling-terminology-system
description: Authoritative cycling domain terminology and localization taxonomy for Yolo Cycling. Governs the separation between global technical acronyms (CTL, ATL, TSB, FTP, Stack, Reach), authentic Chinese terminology, and i18n localization readiness.
---

# Cycling Terminology & Localization System (Domain Standard)

This skill formalizes the terminology standards, UI display rules, and localization taxonomy for **Yolo Cycling**.

---

## 1. Guiding Philosophy: Respect the Peloton

Cycling is a data-driven sport with deep subcultural and scientific traditions. Serious cyclists worldwide (including in the Sinosphere) communicate using universal physiological, mechanical, and geometric abbreviations.

- **Bad (Clunky & Space-Wasting)**: `功能阈值功率 (FTP)`, `车手长期体能管理 (CTL)`, `车架前伸距离 (Reach)`
- **Bad (Inauthentic Translation)**: 把 `CTL` 硬译为"慢性负荷"，把 `Stack` 硬译为"堆叠高度"
- **Bad (Over-Anglicization)**: `有效上管 (ETT)`, `前叉 (FORK)`, `下沉量 (SAG)`, `回弹阻尼 (Rebound)`, `自补液 (Sealant)`
- **Good (Clean & Professional)**:
  - Metric Titles / Chart Axes: `CTL`, `TSB`, `FTP`, `Stack`, `Reach`, `CdA`
  - Metric Subtext: `42天长期体能`, `竞技状态`, `垂直高度`
  - Functional Components: `前叉`, `下沉量`, `回弹阻尼`, `自补液`, `双盘`, `世巡职业级`

---

## 2. Four-Tier Terminology Taxonomy (四级术语体系)

### Tier 1: Global Technical Acronyms (核心通用国际缩写 —— 强制纯英文大写)
**Usage**: Metric Tiles, Chart Axes, Formulas, KPI readouts.  
**Rule**: Never translate into pure Chinese, and never wrap in brackets. Universal across `zh-CN`, `zh-TW`, `en`, and all future languages.

| Category | Standard Acronyms | Cycling Context |
| :--- | :--- | :--- |
| **PMC / Physiology** | `FTP`, `CTL`, `ATL`, `TSB`, `TSS`, `NP`, `IF`, `VI`, `EF` | Coggan Training Dynamics & threshold power |
| **Cardiopulmonary** | `VO₂max`, `HRV`, `HRmax`, `HRrest`, `HRR` | Cardiovascular fitness & Karvonen heart rate zones |
| **Critical Power** | `CP`, `W'`, `Pmax`, `TTE`, `FatMax`, `LT1`, `LT2` | Morton 3-Parameter & Monod energetics model |
| **Geometry & Fit** | `Stack`, `Reach`, `ETT`, `Drop`, `Setback`, `BB Drop`, `KOPS`, `RC` | Frame coordinate geometry & biomechanics |
| **Aerodynamics** | `CdA`, `Crr`, `VAM`, `PR`, `KOM`, `QOM` | Wind resistance, rolling resistance, climbing velocity |
| **Platforms & Files** | `Strava`, `Garmin`, `Wahoo`, `FIT`, `GPX`, `TCX` | Sensor formats & ecosystem sync |

> **Note on `EF` (Efficiency Factor)**: Less universally recognized than `FTP`/`CTL`. When first introducing it in a tooltip or description card, pair with a short Chinese explanation: `EF（效率因子）`; subsequently use plain `EF`.

### Tier 2: Authentic Chinese Terminology (地道行业中文术语 —— 强制纯中文)
**Usage**: Form inputs, navigation menus, component catalogs, mechanic tutorials, diagnostics.  
**Rule**: Use natural, established cycling parlance in Chinese. Do NOT append English words or use bracketed redundancy.

| Domain | Standard Chinese (zh-CN) | Standard Chinese (zh-TW) | Anti-Pattern to Avoid |
| :--- | :--- | :--- | :--- |
| **Drivetrain** | 牙盘, 曲柄, 单盘, 双盘, 大盘, 小盘, 飞轮, 链条, 魔术扣 | 大盤, 曲柄, 單盤, 雙盤, 大盤, 小盤, 飛輪, 鏈條, 快扣 | `1x (单盘)`, `2x (双盘)`, `Crank (曲柄)` |
| **Shifting** | 前拨, 后拨, 电子变速 | 前變速器, 後變速器, 電子變速 | `Front Derailleur`, `Di2 / SRAM (电变)` |
| **Suspension** | 下沉量, 回弹阻尼, 压缩阻尼, 低速压缩, 高速压缩, 气室垫块 | 下沉量, 回彈阻尼, 壓縮阻尼, 低速壓縮, 高速壓縮, 容積墊塊 | `下沉量 (SAG)`, `回弹 (Rebound)`, `Token` |
| **Wheel & Tire** | 真空胎, 开口胎, 管胎, 补胎液/自补液, 补胎胶条, 偏心圈, 辐条, 条帽, 花鼓, 塔基 | 無內胎, 開口胎, 管胎, 自補液, 補胎膠條, 偏心框, 輻條, 銅頭, 花鼓, 棘輪座 | `Tubeless (真空胎)`, `Sealant`, `Asymmetric` |
| **Cockpit / Frame** | 车架, 前叉, 把立, 弯把, 坐垫, 座管, 碗组, 垫圈 | 車架, 前叉, 龍頭, 彎把, 座墊, 座管, 車頭碗, 墊圈 | `Stem (把立)`, `Handlebar`, `Fork` |
| **Category & Level**| 世巡职业级, 国家精英级, 省级健将级, 俱乐部高阶, 进阶骑手, 业余入门 | 世巡職業級, 國家精英級, 省級健將級, 俱樂部高階, 進階騎士, 業餘入門 | `WorldTour (世巡职业)`, `Cat 1` |
| **Road Conditions** | 柏油路, 碎石路, 泥土路, 鹅卵石, 砂砾, 湿滑路面, 积水路段 | 瀝青路, 碎石路, 泥土路, 鵝卵石, 砂礫, 濕滑路面, 積水路段 | `Gravel (碎石)`, `Tarmac`, `Cobbles` |

### Tier 3: Hierarchical Presentation Architecture (双层解耦模式)
**Usage**: `IOSMetricTile`, `IOSCardHeader`, complex tooltips.  
**Rule**:
- **Primary Label**: Tier 1 Standard Acronym (e.g. `CTL`, `TSB`, `Stack`, `Reach`).
- **Secondary Subtext**: Clean Chinese pedagogical explanation (e.g. `42天长期体能`, `竞技状态`, `车架垂直高度`).

```tsx
// ✅ Correct — IOSMetricTile pattern
<IOSMetricTile
  label="CTL"
  value={ctl}
  unit=""
  subtext={language === 'zh-TW' ? '42天長期體能積澱' : '42天长期体能积淀'}
  accentColor="blue"
/>

<IOSMetricTile
  label="Stack"
  value={stackMm}
  unit="mm"
  subtext={language === 'zh-TW' ? '車架垂直高度' : '车架垂直高度'}
  accentColor="purple"
/>

// ✅ Correct — IOSCardHeader pattern
<IOSCardHeader
  title="体能动力学"       // Pure Chinese section name — no (PMC) bracket
  subtitle="CTL · ATL · TSB 三维管理"  // Acronyms used directly as identifiers
/>

// ❌ Wrong — bracket redundancy
<IOSCardHeader title="体能动力学 (PMC)" />
<IOSMetricTile label="CTL (长期体能)" />
```

#### Chart Legend Special Case
Chart.js / Recharts legends have limited width and no subtext row. In this context, using concise Chinese labels in the `dataset.label` field is **acceptable and preferred** over cryptic acronyms alone:

```ts
// ✅ Acceptable for chart.js dataset label (legend space is constrained)
label: language === 'zh-TW' ? '長期體能' : '长期体能'  // renders as CTL line legend
label: language === 'zh-TW' ? '急性疲勞' : '急性疲劳'  // renders as ATL line legend

// ❌ Wrong — bracket hybrid in legend
label: 'CTL (长期体能)'
label: 'CTL(体能)'
```

#### Chart Axis & Tooltip Rules
- **Y-axis title**: Use the Tier 1 acronym directly — `title.text: 'CTL'`, `'FTP (W)'` where unit is appended with standard symbol.
- **Tooltip labels**: Prefer format `CTL: 82` or `FTP: 285 W` — the label key is the acronym, value carries the unit.
- **X-axis labels**: Dates use locale format; segment names use pure Chinese (Tier 2).

#### Inline Prose Text Rules
When mentioning Tier 1 terms in longer description strings, card subtitles, or tooltip body text:
- **First mention** in a paragraph: use `CTL（长期体能积淀指数）` — full-width parentheses, Chinese gloss only on first occurrence.
- **Subsequent mentions**: use bare `CTL`.
- **Do NOT** repeat the gloss: `CTL（长期体能）上升，ATL（急性疲劳）下降` is wrong — gloss only the first new term.

### Tier 4: International Standard Physical Units (独立物理量计量单位)
**Usage**: Input field adornments, table columns, chart axes.  
**Rule**: Strictly use international symbols. Never write out Chinese characters for units.

- Power: `W`, `W/kg` (Never 瓦特, 瓦)
- Cadence & Heart Rate: `rpm`, `bpm` (Never 转/分, 次/分)
- Speed & Distance: `km/h`, `km`, `m`, `mm` (Never 公里/小时, 米)
- Mass: `kg`, `g` (Never 公斤, 克)
- Pressure: `PSI`, `Bar` (Never 磅/平方英寸)
- Angles & Temp: `°`, `°C`
- Volume & Energy: `ml`, `L`, `kJ`, `kcal`

---

## 3. Localization (i18n) Readiness Strategy

1. **Zero Translation for Tier 1**:  
   `FTP`, `CTL`, `ATL`, `TSB`, `Stack`, `Reach`, `CdA`, `VO₂max` are identical across all locales (`en`, `zh-CN`, `zh-TW`, `ja`, `de`). This significantly reduces translation overhead and avoids awkward localized portmanteaus.

2. **Systematic Locale Mapping for Tier 2**:  
   Map pure Chinese terminology directly to authentic regional cycling vocabulary:
   - Simplified Chinese: 把立, 牙盘, 前拨, 自补液
   - Traditional Chinese: 龍頭, 大盤, 前變, 自補液
   - English: Stem, Crankset, Front Derailleur, Tire Sealant

3. **Decoupled Subtexts for Tier 3**:  
   Only the explanatory subtexts require localization, preserving compact layouts across desktop and mobile:
   ```ts
   // Pattern for all Tier 3 subtexts
   subtext={language === 'zh-TW' ? '繁體中文釋義' : '简体中文释义'}
   ```

4. **Tier 4 units are locale-invariant** — `W`, `rpm`, `km/h` need no translation in any locale.

---

## 4. Anti-Pattern Quick Reference

Use this table for fast agent audit and code review:

| ❌ Anti-Pattern | ✅ Correct Pattern | Tier |
| :--- | :--- | :--- |
| `CTL (长期体能)` | `label="CTL"` + `subtext="42天长期体能积淀"` | 3 |
| `ATL (急性疲劳)` | `label="ATL"` + `subtext="7天急性疲劳负荷"` | 3 |
| `体能动力学 (PMC)` | `体能动力学` | 3 |
| `功率持续曲线 (MMP)` | `功率持续曲线` | 3 |
| `个人最佳 (PR)` | `个人最佳` | 3 |
| `全网纪录 (KOM)` | `全网纪录` | 3 |
| `爱丁顿数 (E)` | `爱丁顿数` | 3 |
| `峰值功率 (Watts)` | `峰值功率 (W)` | 4 |
| `下沉量 (SAG)` | `下沉量` | 2 |
| `回弹 (Rebound)` | `回弹阻尼` | 2 |
| `前叉 (FORK)` | `前叉` | 2 |
| `1x (单盘)` | `单盘` | 2 |
| `Gravel (碎石)` | `碎石路` | 2 |
| `label: 'CTL (体能)'` in Chart | `label: '长期体能'` | Chart |
| `W/kg (推重比)` | `W/kg` | 4 |
| `格 (Clicks)` | `格` | 2 |
| `枚 (Spacers)` | `枚` | 2 |
