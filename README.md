# SoloRiderTools Pro 🚴‍♂️⚡
### Modern Precision Cycling Science & Performance Platform
#### 现代专业数据驱动骑行科学与性能工具站

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87%20%7C%20%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87-brightgreen)]()
[![Units](https://img.shields.io/badge/Units-Metric%20%7C%20Imperial-orange)]()
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-success)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 📖 Introduction / 项目简介

**SoloRiderTools Pro** is an open, high-precision, client-side cycling engineering and sports physiology platform. Built upon classical fluid dynamics, biomechanics, and endurance physiology, it equips amateur cyclists, bike fitters, and WorldTour racers with 14 purpose-built calculation engines.

**SoloRiderTools Pro** 是一个现代化、纯前端运行的专业公路车运动科学与工程数据计算站。以流体空气动力学、经典力学、人体工学与运动生理学为数学底层，提供 14 款严谨的计算器与仿真工具，助力车手科学训练、精准改装与理性备赛。

---

## 🌟 Key Architectural Features / 核心特性

- 🌐 **Global Trilingual Support (i18n)**: Instant zero-flicker toggle between **English**, **简体中文**, and **繁體中文**. Automatically detects user browser locale (`zh-TW`, `zh-HK`, `zh-CN`, `en`).
- ⚖️ **Dual Unit Engine (Metric ↔ Imperial)**:
  - Weight: `kg` ↔ `lbs`
  - Distance: `km` ↔ `miles (mi)`
  - Elevation: `meters (m)` ↔ `feet (ft)`
  - Speed: `km/h` ↔ `mph`
  - Temperature: `°C` ↔ `°F`
  - Pressure: `bar` ↔ `psi`
- 🏔️ **Grand Tour & Domestic Roadbook Matrix**: Built-in interactive routes for legendary climbs (Alpe d'Huez 🇫🇷, Passo dello Stelvio 🇮🇹, Sa Calobra 🇪🇸) alongside premier domestic classics, with synchronized Leaflet maps and elevation profiles.
- 🔒 **100% Client-Side Privacy (GDPR & CCPA Compliant)**: Zero external analytics trackers, zero data telemetry. All rider parameters and uploaded GPX files stay strictly within your local browser (`localStorage`).
- ⚡ **Zero-Latency PWA/SPA Architecture**: Powered by Vite 5 code splitting (`manualChunks` for React, Leaflet, and Chart.js). Instant sub-second initial load.

---

## 🧮 Tool Suite Matrix / 14 大核心科学工具矩阵

| # | Tool Name (EN / 中文) | Category | Scientific Methodology & Algorithm |
|---|---|---|---|
| 01 | **Cycling Power & Speed Dynamics**<br/>骑行功率与速度计算器 | Dynamics | Newton-Raphson aerodynamic iteration, rolling resistance ($C_{rr}$), slope drag, Coggan 7 FTP zones |
| 02 | **Smart Tire Pressure & Crr Optimizer**<br/>公路/全地形智能胎压计算器 | Dynamics | Frank Berto 15% tire drop model, casing stiffness coefficient, internal rim width adjustment |
| 03 | **Gear Ratio, Cadence & Speed**<br/>齿比-速度-踏频多功能计算器 | Dynamics | Development meters, Gear Inches, cross-chaining penalty matrix, cadence-to-speed bidirectional solving |
| 04 | **Chain Length & Derailleur Capacity**<br/>链条长度与传动链节计算器 | Dynamics | Rigby formula, Shimano/SRAM standards, rear derailleur total capacity verification |
| 05 | **Climb Pacing & Gradient Power Planner**<br/>爬坡路段分段配速与功率规划器 | Dynamics | Segment-by-segment gradient slicing, VAM estimation, anaerobic capacity protection |
| 06 | **Component Upgrade ROI & Aero Wattage**<br/>零件减重与气动升级省瓦推算器 | Dynamics | Real-world aerodynamic CdA reduction vs. rotating mass inertia, dollar-per-watt efficiency |
| 07 | **Road Bike Ergonomic Fitting Calculator**<br/>专业公路车 Fitting 拟合器 | Fitting | Greg LeMond & Hamley-Thomas formulas, anthropometric ratios, effective top tube (ETT) |
| 08 | **Cycling Pain Diagnostic & Adjustment Guide**<br/>公路车骑行疼痛排查自诊指南 | Fitting | Biomechanical cause-and-effect mapping (knee, lower back, neck, wrist, saddle, foot) |
| 09 | **Curated Roadbook & GPX Track Explorer**<br/>经典骑行路书与航迹精选库 | Routes | Haversine elevation modeling, interactive Leaflet polyline snapping, Grand Tour stage database |
| 10 | **GPX Route Studio & Elevation Profiler**<br/>GPX 路线规划与路书生成器 | Routes | Interactive waypoint drawing, OSRM snapping, GPX 1.1 compliant XML generation |
| 11 | **Peloton Drafting & Race Tactics Simulator**<br/>公路车团骑/跟骑阻力与战术模拟 | Routes | Blocken wind tunnel drafting coefficients, paceline rotation, $W'$ anaerobic battery depletion |
| 12 | **Cycling Weather & Wind Vector Advisor**<br/>骑行天气与路线气象顾问 | Routes | Vector angle wind decomposition (headwind/tailwind/crosswind), Open-Meteo real-time API |
| 13 | **Power Profile Radar & 80/20 Polarized Zones**<br/>功率能力雷达与极化训练区间 | Physiology | 6-axis MMP profiling (5s, 1m, 5m, 20m), phenotype classification, Stephen Seiler 80/20 model |
| 14 | **Cycling Nutrition, Heart Rate & Energy**<br/>骑行与运动健康综合计算器 | Physiology | Carbohydrate oxidation rates, Karvonen HRR, Mifflin-St Jeor BMR, TDEE & body composition |

---

## 🛠️ Technology Stack / 技术架构

- **UI Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4 (Tailwind Merge + CLSX)
- **Map & GIS**: Leaflet 1.9 + OpenStreetMap Tile Layer
- **Charts**: Chart.js 4.4 + React-Chartjs-2
- **Weather Services**: Open-Meteo REST API (Global, HTTPS, Free tier, zero API key required)
- **Icons**: Lucide React

---

## 🚀 Quick Start & Local Development / 本地启动

### 1. Clone the repository
```bash
git clone https://github.com/your-username/soloridertools.git
cd soloridertools
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start local development server
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

### 4. Build for production
```bash
npm run build
```
Production assets will be output to the `dist/` directory.

---

## 🌐 Production Deployment / 生产投放指南

### Option 1: Vercel (Recommended 1-Click Zero-Config)
The repository includes a ready-to-use `vercel.json` configured with SPA rewrites and HTTP security headers.
1. Push your repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and click **Import Project**.
3. Vercel automatically detects Vite and executes `npm run build`. Your site will be live worldwide in seconds.

### Option 2: Cloudflare Pages
1. Go to the Cloudflare dashboard -> **Workers & Pages** -> **Create application** -> **Pages**.
2. Connect your Git repository.
3. Set **Build command** to `npm run build` and **Build output directory** to `dist`.

### Option 3: Docker / Nginx
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

## 📋 Pre-Production Launch Checklist / 投放前检查清单

| Category | Item | Status | Note |
|---|---|---|---|
| **Build & Compilation** | TypeScript Type Check | ✅ PASS | `tsc` passed with 0 errors |
| **Bundle Splitting** | Vite Chunks Optimization | ✅ PASS | Clean separation of React, Leaflet, and Chart.js |
| **Routing** | SPA Refresh & Deep Linking | ✅ PASS | `vercel.json` rewrite configured |
| **Localization** | i18n Dictionary Integrity | ✅ PASS | Complete bilingual support across all 14 tools |
| **Unit Engine** | Metric ↔ Imperial Conversions | ✅ PASS | Weight, distance, elevation, speed, temp, pressure |
| **GIS & Weather** | OpenStreetMap & Open-Meteo | ✅ PASS | Global HTTPS, no CORS or API key bottlenecks |
| **SEO & Social Cards**| OpenGraph & Twitter Tags | ✅ PASS | Pre-configured in `index.html` |
| **Compliance** | GDPR & Privacy Statement | ✅ PASS | 100% Client-side local storage only |
| **Legal** | Sports Science Disclaimer | ✅ PASS | Prominent non-medical advisory in Footer |
| **Cross-Platform** | Responsive Mobile & Desktop | ✅ PASS | Mobile touch targets and flexible grid layouts |

---

## ⚖️ Legal & Disclaimer / 免责与合规声明

1. **Non-Medical Advisory**: All calculations, bike fitting outputs, and pain checking recommendations are for sports science simulation and tuning reference only. They do not constitute medical advice or diagnosis. Consult a certified sports physician or professional bike fitter for personalized assessments.
2. **Privacy Notice**: SoloRiderTools operates entirely client-side. No personal health records, rider weights, or GPX tracks are uploaded to any server.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
