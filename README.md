# Rouleur Pro 🚴‍♂️⚡
### Modern Precision Cycling Science & Performance Platform
#### 现代专业数据驱动骑行科学与性能工具站

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Strava](https://img.shields.io/badge/Strava-Integrated-FC4C02?logo=strava)](https://www.strava.com)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87%20%7C%20%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87-brightgreen)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-10b981?logo=pwa)]()
[![Units](https://img.shields.io/badge/Units-Metric%20%7C%20Imperial-orange)]()
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-success)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 📖 Introduction / 项目简介

**Rouleur Pro** is an open-source, high-precision, client-side cycling engineering and sports physiology platform. Built upon classical fluid dynamics, biomechanics, wheelbuilding trigonometry, and modern endurance exercise physiology, it equips amateur cyclists, bike fitters, mechanics, and WorldTour racers with **20 purpose-built calculation and simulation engines**.

**Rouleur Pro** 是一个现代化、纯前端高精度运行的专业公路车运动科学与工程数据计算站。以流体空气动力学、经典牛顿力学、轮圈几何空间三角学、人体工效学与现代耐力运动生理学为数学底层，提供 **20 款严谨的计算器与仿真模拟工坊**，助力车手科学训练、精准改装、合理备赛与技师装车。

---

## 🌟 Key Architectural Features / 核心系统特性

### 1. 📱 Apple iOS HIG Native Design & PWA Architecture / iOS 原生设计哲学与离线 PWA
- **iOS Human Interface Guidelines (HIG)**: 
  - 纯粹的毛玻璃材质 (`backdrop-blur-2xl`)、SF Pro 原生排版层次与动效曲线 (`apple-spring`)。
  - **四大科学领域专属色彩体系**：
    - 🔵 **动力学与传动** (`ios-blue` - `#007AFF`)
    - 🟣 **Fitting 与工效** (`ios-purple` - `#AF52DE`)
    - 🟢 **路线、战术与气象** (`ios-mint` - `#00C7BE`)
    - 🔴 **生理、训练与代谢** (`ios-red` - `#FF3B30`)
- **PWA (Progressive Web App)**:
  - 支持在 iOS (Safari "添加到主屏幕")、Android、macOS 及 Windows 上作为原生桌面独立应用运行。
  - Service Worker 本地强缓存，断网与深山无信号环境下秒级冷启动与全离线运算。
- **Responsive Adaptive UX & Safe Area**:
  - 移动端专属底部悬浮导航岛 (`MobileBottomNav`)，完美兼容 iPhone 底部横条与安全区 (`env(safe-area-inset-bottom)`)，触摸靶心尺寸符合 Apple HIG 最小 44×44 pt 规范。
  - 桌面端支持快捷键聚焦 (`/` 聚焦搜索、`ESC` 退出、`Ctrl+P` 打印导出)、面包屑导航与多列数据折叠展开。
- **System Reactive Dark Mode**:
  - 自适应手机系统暗黑模式切换 (`prefers-color-scheme`)，同时支持持久化手动锁定（系统/深色/浅色）。

### 2. ⚡ Strava 5D Bi-directional Cloud Ecosystem / Strava 五维云端互联体系
全站与 Strava API v3 深度整合，实现 5 大核心工具的双向云端联动，免除用户手动输参负担：
- 🗺️ **经典骑行路书库 (`roadbook-library`)**: 一键同步并导入 Strava 星标路线 (Starred Routes)，自动拉取高精海拔与转弯航迹点。
- ⛰️ **爬坡配速规划器 (`climb-pacing`)**: 实时检索并导入 Strava 赛段与 KOM 路段，自动拆解细化各坡度分段数据。
- 🎯 **功率能力雷达 (`power-radar`)**: 基于滑动窗口 MMP 算法，一键从 Strava 历史真实骑行中提取近期的 5s、1min、5min、20min 峰值功率，精准诊断车手类型画像。
- 📈 **FIT 活动深度解析器 (`activity-analyzer`)**: 一键流式载入 Strava 历史活动记录，免去到处导出下载文件的繁琐，直接进行离线 NP/IF/TSS 复盘与 42 天 PMC 训练负荷分析。
- 📊 **车手全景数据罗盘 (`strava-cockpit`)**: 深度聚合全周期、年度与近30天骑行资产，解算爱丁顿骑行数 (E)、91天出勤热力墙、PMC 体能疲劳走势与战车机队零部件耗损管家。

### 3. 🚴‍♂️ Peloton Aerodynamics & TTT Simulator / 团骑风阻与车队计时赛秒级推演
- **Bert Blocken CFD 风洞阻力模型**: 精确模拟跟骑破风气动减阻效果（前轮贴附、位置衰减与侧风偏航角）。
- **TTT 车队计时赛模式**: 支持多名车手自定义 FTP、体能储备与领骑秒数，精确推演领骑轮转周期、W' 无氧电池耗尽与恢复、掉队风险警报及整队最优完赛均速。

### 4. 🌐 Global Trilingual Support / 全球三语无缝支持 (i18n)
- 完美支持 **简体中文**、**繁體中文 (台灣/香港專業術語)**、以及 **English**。
- 支持浏览器系统语言自动侦测与毫秒级即时热切换，术语库经由资深公路车技师与运动生理学学者审校（如：飞轮/飛輪、牙盘/大盤、上管/上管、胎压/胎壓、真空胎/無內胎）。

### 5. ⚖️ Dual Unit Engine / 全参公英制换算引擎
- 全站 20 款工具无死角公英制双向联动切换：
  - 体重/车重: `kg` ↔ `lbs`
  - 距离: `km` ↔ `miles (mi)`
  - 海拔/爬升: `meters (m)` ↔ `feet (ft)`
  - 速度: `km/h` ↔ `mph`
  - 气温: `°C` ↔ `°F`
  - 胎压/避震气压: `bar` ↔ `psi`
  - 弹簧磅数: `lbs/in` ↔ `N/mm`

### 6. 🔒 100% Client-Side Privacy / 纯前端本地隐私安全 (GDPR/CCPA)
- 零外部打点，零隐私遥测，零服务端数据库。
- 所有的车手体征数据、功率文件、FIT/GPX 航迹以及 Strava Token 均纯本地存储于用户的浏览器 `localStorage` 与 `IndexedDB` 中，数据绝对安全。

---

## 🧮 Tool Suite Matrix / 20 大核心科学工具全矩阵

Rouleur Pro 包含 20 款针对骑行不同专业领域的科学工具，划分为四大核心板块：

### I. 动力学与传动工程 (Dynamics & Gearing) · 9 款工具
> 主题色：`ios-blue` · 涵盖经典空气动力学、传动比数学、链条几何、编轮空间几何与双避震连杆工程。

| # | 工具名称 (EN / 中文) | 核心科学理论与算法底层 | 关键输出与实战应用 | Strava |
|---|---|---|---|:---:|
| 01 | **Cycling Power & Speed Dynamics**<br/>骑行功率与速度计算器 | 牛顿-拉夫逊迭代法 (Newton-Raphson Iteration)、经典流体风阻公式 $P_{aero} = \frac{1}{2} \rho C_d A v^3$、滚动阻力 $P_{rr} = C_{rr} m g v$、重力分量 $P_{climb} = m g v \sin(\arctan(G))$ | 功率 ↔ 速度双向秒级解算、全速域功率曲线可视化、Coggan 7 区功率靶心、平路巡航省瓦测算 | ✕ |
| 02 | **Smart Tire Pressure & Crr Optimizer**<br/>公路/全地形智能胎压计算器 | Frank Berto 15% Tire Drop 轮胎下沉形变模型、胎体编织密度 (TPI) 刚度系数、车圈内宽对实测胎宽修正算法、路面粗糙度破损临界点判定 | 前后轮独立推荐气压 (PSI/Bar)、干湿地与负重微调、内胎/真空胎/管胎差异化适配、滚动阻力与颠簸阻抗平衡 | ✕ |
| 03 | **Gear Ratio, Cadence & Speed**<br/>齿比-速度-踏频多功能计算器 | 传动比 $R = \frac{T_{front}}{T_{rear}}$、米进 (Meters of Development)、齿比英寸 (Gear Inches)、极差阶跃比矩阵、链条交叉对角损耗矩阵 | 踏频 ↔ 速度双向换算矩阵表、全档位速比折线图、档位重复率诊断、爬坡最小齿比适用度评估 | ✕ |
| 04 | **Chain Length & Derailleur Capacity**<br/>链条长度与传动链节计算器 | Rigby 经典经验公式、Shimano 官方严选公式、SRAM 1x 大飞轮公式、后拨总齿容量公式 $C = (T_{big} - T_{small}) + (C_{big} - C_{small})$ | 最佳链条截取链节数 (Links)、后拨总容量超限安全校核、后下叉 (RC) 长度公差冗余预警 | ✕ |
| 05 | **Climb Pacing & Gradient Power Planner**<br/>爬坡路段分段配速与功率规划器 | 坡度微段切片离散动力学模型、垂直上升速率 (VAM)、$W'$ 无氧储备做功耗竭方程、重力势能与代谢功率平衡 | 各分段目标功率分配策略、登顶耗时与均速预估、防爆缸心率预警、环法名山预设（阿尔普迪埃、风秃山等） | **✓** |
| 06 | **Component Upgrade ROI & Aero Wattage**<br/>零件减重与气动升级省瓦推算器 | 风洞实测 $C_d A$ 边际减阻基准、转动惯量与静止质量爬坡等效系数、元/瓦性价比指数 ($ROI = \frac{\Delta Cost}{\Delta Watt}$) | 轮组/气动弯把/连体服/TPU内胎改装省瓦推算、平路与爬坡省时 (秒)、改装性价比排行榜 | ✕ |
| 07 | **Tubeless Sealant Volume & Interval**<br/>真空胎自补液加注量与补液周期计算器 | 外胎环面 (Torus) 内部容积微积分算法、胎体内壁微孔吸附经验模型、环境温湿度与骑行频次表面挥发动力学方程 | 前后轮精准加注量 (ml/fl oz)、整车维护成本评估、补液周期倒计时提醒、公路/Gravel/山地全场景 | ✕ |
| 08 | **Wheelbuilding & Spoke Length Calculator**<br/>自行车编轮与辐条长度计算器 | Jobst Brandt 编轮空间三角几何学、有效轮圈内径 (ERD)、花鼓法兰距与孔圆直径 (PCD)、非对称偏心圈 (Asymmetric Offset) 修正、法兰张力平衡比 | 驱动侧与非驱动侧辐条精确毫米级长度、市售整数规格推荐、张力平衡百分比、交叉编法扭矩安全校核 | ✕ |
| 09 | **MTB Dual Suspension & SAG Tuning Wizard**<br/>山地车避震与 SAG 智能调校顾问 | 空气弹簧渐进曲线与容积垫块 (Tokens/Volume Spacers) 关系、车架连杆杠杆比 (Leverage Ratio)、钢簧弹簧磅数公式 ($K = \frac{Weight \times Ratio}{Stroke \times SAG\%}$)、动态阻尼点位衰减模型 | 前叉与后避震气压推荐 (PSI)、钢簧磅数 (lbs/in)、动静态 SAG 刻度下沉标尺、回弹/压缩阻尼点击位 (Clicks)、技师疑难排解 | ✕ |

---

### II. Fitting 与人体工效学 (Fitting & Ergonomics) · 2 款工具
> 主题色：`ios-purple` · 结合生物力学拟合计算与骑行运动医学疼痛排查。

| # | 工具名称 (EN / 中文) | 核心科学理论与算法底层 | 关键输出与实战应用 | Strava |
|---|---|---|---|:---:|
| 10 | **Road Bike Ergonomic Fitting Calculator**<br/>专业公路车 Fitting 拟合器 | Greg LeMond 坐高公式 ($H_{saddle} = Inseam \times 0.883$)、Hamley-Thomas 踏板轴心法、躯干臂长比值回归方程、等效上管 (ETT) 几何拟合 | 推荐等效上管 (ETT)、坐垫高度与后飘量 (Setback)、把立长度与落差 (Drop)、车把宽度及曲柄长度建议 | ✕ |
| 11 | **Cycling Pain Diagnostic & Adjustment Guide**<br/>公路车骑行疼痛排查自诊指南 | 人体运动解剖学与生物力学代偿连锁机制、神经压迫病理学（坐骨神经、尺神经、正中神经） | 膝关节（前/后/内/外）、下背腰椎、颈肩、手腕发麻、坐垫压迫及脚底灼痛 6 大解剖区域排查、车辆微调方案与运动康复指南 | ✕ |

---

### III. 路线、战术与气象 (Tactics, Routes & Weather) · 4 款工具
> 主题色：`ios-mint` · 涵盖 GIS 航迹规划、流体力学破风风阻编队、车队计时赛与路线矢量气象。

| # | 工具名称 (EN / 中文) | 核心科学理论与算法底层 | 关键输出与实战应用 | Strava |
|---|---|---|---|:---:|
| 12 | **Curated Roadbook & GPX Track Explorer**<br/>经典骑行路书与航迹精选库 | 大圆高程算法 (Haversine Formula)、Leaflet 交互地图与高程剖面动态联动渲染、GPX 1.1 规范解析 | 环法传奇赛段（阿尔普迪埃、斯泰尔维奥、旺图山等）与国内实测精品航迹库、一键下载标准 GPX、个人航迹本地导入 | **✓** |
| 13 | **GPX Route Studio & Elevation Profiler**<br/>GPX 路线规划与路书生成器 | OSRM 道路自动吸附算法、交互式航点折线拓扑生成、高程起伏联动定位与爬升坡度平滑计算 | 在线绘制路线、地名与 POI 搜索、已有 GPX 导入与再编辑、一键导出标准 `.gpx` 码表导航文件 | ✕ |
| 14 | **Peloton Drafting & Race Tactics Simulator**<br/>公路车团骑/跟骑阻力与战术模拟 | Bert Blocken CFD 风洞阻力位置衰减模型、梯队破风函数、Skiba $W'_{bal}$ 动态恢复动力学方程、TTT 轮转秒级推演矩阵 | 编队跟骑省瓦测算、突围进攻生存概率、TTT 车队计时赛秒级轮转推演、车手掉队风险警报、全队最优不掉队均速解算 | ✕ |
| 15 | **Cycling Weather & Wind Vector Advisor**<br/>骑行天气与路线气象顾问 | 航向角与风向角二维矢量点积投影公式 ($v_{headwind} = v_{wind} \cos(\theta_{route} - \theta_{wind})$)、Open-Meteo 全球高精度气象 REST API | 顺风/逆风/侧风矢量分解判定、沿途到达时刻气温湿度降水预测、侧风安全隐患预警、骑行穿衣保暖指南 | ✕ |

---

### IV. 生理、训练与代谢 (Physiology, Training & Health) · 5 款工具
> 主题色：`ios-red` · 涵盖 Coggan 功率时长曲线、极化训练、能量补给代谢、FIT 二进制离线分析、结构化课表工坊与车手数据罗盘。

| # | 工具名称 (EN / 中文) | 核心科学理论与算法底层 | 关键输出与实战应用 | Strava |
|---|---|---|---|:---:|
| 16 | **Power Profile Radar & 80/20 Polarized Zones**<br/>功率能力雷达与极化训练区间 | 猎豹-柴油机能力画像模型 (Hunter Allen & Andrew Coggan)、MMP 峰值功率包络线、Stephen Seiler 80/20 极化三区生理模型 | 六维能力雷达图 (5s, 1m, 5m, 20m, FTP, W/kg)、车手表型智能分类（冲刺手/爬坡手/突围手/全能型）、极化三区与甜点 (SST) 靶心 | **✓** |
| 17 | **Cycling Nutrition, Heart Rate & Energy**<br/>骑行与运动健康综合计算器 | 外源性碳水化合物最大氧化率 (60-90g/h)、Karvonen 储备心率 (HRR) 公式、Mifflin-St Jeor 基础代谢率 (BMR) 与 TDEE 方程、美国海军体脂率 (BFP) 公式 | 每小时补水与碳水补充建议、储备靶心率 5 区划分、每日总能量消耗与减脂热量缺口计算 | ✕ |
| 18 | **Cycling FIT & Activity File Deep Analyzer**<br/>码表活动与 FIT 航迹深度解析器 | 二进制 FIT/TCX 离线纯前端流式解码器、加权标准化功率 (NP, 4次方移动平均)、强度系数 (IF)、训练压力分 (TSS)、变异指数 (VI)、效率因子 (EF)、有氧解耦率 (Pw:HR)、42天滚动 PMC (CTL, ATL, TSB) | 离线解析 Garmin/Wahoo/迈金/行者/iGPSPORT 码表文件、Coggan 7 区与心率驻留时间分布、全活动 MMP 曲线、42天体能疲劳走势图 | **✓** |
| 19 | **Structured Interval Workout Builder**<br/>科学间歇训练课表工坊 | Coggan 结构化负荷建模、NP/IF/TSS 实时积分预估算法、标准 Zwift ZWO XML 结构与 Garmin/Wahoo MRC 语法生成器 | 内置 6 大名将科学课表（Rønnestad 30/15s 微间歇、挪威 4x4 VO₂max、2x20min 阈值巡航、Over-Under 乳酸清除、Tabata 极限冲刺、Z2 耐力基底）、可视化段落编排、一键导出 `.zwo` 与 `.mrc` 文件直接载入骑行台与码表 | ✕ |
| 20 | **Strava Performance Cockpit & Fleet Hub**<br/>车手全景数据罗盘与看板 | 爱丁顿骑行数 ($E$) 递推模型、91天出勤热力图、Coggan 42天滚动 PMC (CTL, ATL, TSB) 表现管理、全域 MMP 功率曲线与 eFTP 动态拟合、机队链条与刹车皮损耗折算 | Dreeve 宏观体能资产看板、爱丁顿升级预测、Apple Fitness 运动三环、战车机队零部件里程损耗预警 | **✓** |

---

### 伴侣功能：🎶 Liquid Lo-Fi Cadence Music Player (流动骑行伴音播放器)
- 浮动式玻璃拟态 Lo-Fi 音频播放器，预置 90 RPM Techno Drive、Sweetspot 95 BPM 与 Zone 2 Chill Ride 经典踏频节拍音轨。
- 支持自定义外部音频 URL 载入、后台悬浮播放与踏频节奏同频律动。

---

## 🛠️ Technology Stack / 前端技术栈与工程架构

- **Core Framework**: React 18.2 + TypeScript 5.2 (严格类型安全模式)
- **Build Engine**: Vite 5.4 (Rollup `manualChunks` 代码分块优化，极速冷启动)
- **Design System & Styling**: Tailwind CSS 3.4 + Tailwind Merge + CLSX
  - 深度定制 Apple iOS HIG 色彩语义层 (`ios-blue`, `ios-purple`, `ios-mint`, `ios-red`, `ios-card`, `ios-popover`)
- **Mapping & GIS**: Leaflet 1.9 + OpenStreetMap Tile Layer (无 Key、全球可用、支持平滑切片)
- **Data Visualization**: Chart.js 4.4 + React-Chartjs-2 (动态功率折线图、极化雷达图、PMC 堆叠面积图)
- **Binary & FIT Parser**: 自研纯前端二进制流解码器 (支持 `.fit`, `.gpx`, `.tcx` 离线秒级解析)
- **External API**: Open-Meteo REST API (全球无限制免费气象源，免 API Key，原生支持 HTTPS)
- **Icons**: Lucide React (高保真线性矢量图标库)
- **PWA Runtime**: Service Worker + Web App Manifest (全离线缓存策略)

---

## 🚀 Quick Start & Local Development / 本地开发指南

### 1. 克隆代码仓库 (Clone Repository)
```bash
git clone https://github.com/TrojanFish/CyclingTools.git
cd CyclingTools
```

### 2. 安装依赖项 (Install Dependencies)
```bash
npm install
```

### 3. 启动本地开发服务器 (Start Dev Server)
```bash
npm run dev
```
打开浏览器访问：`http://localhost:3000`

### 4. 生产构建与类型检查 (Production Build)
```bash
npm run build
```
构建产物将输出至 `dist/` 目录。可使用 `npm run preview` 进行本地生产预览。

---

## 🌐 Production Deployment / 生产投放指南

### 方案 1：Vercel 部署 (推荐 · 零配置即开即用)
本项目根目录已内置适配好的 `vercel.json`，包含了单页应用 (SPA) 重定向规则与安全标头：
1. 将本仓库推送到 GitHub。
2. 登录 [Vercel](https://vercel.com)，点击 **Add New...** -> **Project** 并导入该仓库。
3. Vercel 会自动识别 Vite 框架并执行 `npm run build`，几十秒内全球 CDN 自动化上线。

### 方案 2：Cloudflare Pages
1. 登录 Cloudflare 控制台，进入 **Workers & Pages** -> **Create application** -> **Pages**。
2. 关联 GitHub 仓库。
3. 构建命令填入：`npm run build`，构建输出目录填入：`dist`。
4. 环境变量根据需要填入 `VITE_STRAVA_CLIENT_ID`（如启用 Strava 联动的自定义 Client）。

### 方案 3：Docker / Nginx 容器化运行
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📋 Pre-Production Launch Checklist / 投放前全面核验清单

| 核验维度 | 检查项 | 状态 | 详细说明 |
|---|---|---|---|
| **代码与类型** | TypeScript 严格编译 | ✅ PASS | `tsc` 编译通过，0 类型错误与警告 |
| **构建优化** | Vite Bundle Splitting | ✅ PASS | React、Leaflet、Chart.js 独立分包，体积极致优化 |
| **路由与刷新** | SPA 路由深度链接 | ✅ PASS | `vercel.json` rewrite 配置完成，任意刷新不 404 |
| **多语言完整度** | i18n 三语字典一致性 | ✅ PASS | 20 款工具全量覆盖简中、繁中与英文，术语对齐 |
| **双单位引擎** | Metric ↔ Imperial 换算 | ✅ PASS | 体重、距离、高度、速度、胎压、温度双向联动 |
| **GIS与气象** | OpenStreetMap & Open-Meteo | ✅ PASS | 全站 HTTPS 协议，无跨域阻碍，免 API Key 限制 |
| **云端互联** | Strava OAuth 与五维拉取 | ✅ PASS | 路书、赛段、峰值功率、FIT活动与全景罗盘五重读取正常 |
| **PWA 与离线** | Manifest & Service Worker | ✅ PASS | 支持桌面与手机添加到主屏幕，离线秒级启动 |
| **设计规范** | Apple iOS HIG 色彩统一 | ✅ PASS | 4 大分类配色规范对齐，消除任何遗留杂色 |
| **隐私合规** | GDPR / CCPA 零数据回传 | ✅ PASS | 纯本地 `localStorage` 计算，无服务器存留 |
| **免责声明** | 非医疗/非处方运动科学声明 | ✅ PASS | 底栏与 Fitting/疼痛诊断工具均包含免责提示 |

---

## ⚖️ Legal & Sports Science Disclaimer / 免责与运动科学声明

1. **非医疗诊断声明 (Non-Medical Sports Science Advisory)**: 本平台提供的所有计算算法、身体拟合尺寸建议（Bike Fitting）、骑行疼痛自查建议以及能量补给方案均基于公开的运动生理学文献与经典力学数学模型，仅供日常训练、长途骑行与车辆改装参考，**不构成任何医疗诊断、处方建议或商业装车担保**。如遇急性膝盖滑囊炎、韧带损伤或心血管不适，请立即停止骑行并前往医院运动医学科就诊。
2. **知识产权与隐私 (Privacy & Intellectual Property)**: Rouleur Pro 严格遵循无打点、无追踪原则。Strava 是 Strava, Inc. 的注册商标，本项目仅通过官方公开的 API 实现车手授权下的数据提取展示。

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.  
Made with 🚴‍♂️ & ⚡ for the global cycling community.
