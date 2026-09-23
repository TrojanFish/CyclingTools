import React from 'react';
import {
  Zap,
  Gauge,
  Cog,
  Link,
  Mountain,
  Scale,
  Ruler,
  Activity,
  Compass,
  MapPin,
  Users,
  CloudSun,
  Target,
  HeartPulse,
  LineChart,
  Droplets,
  Disc,
  Sliders,
  Dumbbell,
  LayoutDashboard,
  Calendar,
  LucideIcon
} from 'lucide-react';

export interface NavToolItem {
  id: string;
  title: string;
  titleTw: string;
  shortTitle: string;
  shortTitleTw: string;
  category: 'dynamics' | 'fitting' | 'route' | 'health';
  categoryLabel: string;
  categoryLabelTw: string;
  categoryColor: string;
  icon: LucideIcon;
}

export const ALL_NAV_TOOLS: NavToolItem[] = [
  // 1. Dynamics
  {
    id: 'power-calc',
    title: '功率与速度',
    titleTw: '功率與速度',
    shortTitle: '功率',
    shortTitleTw: '功率',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Zap
  },
  {
    id: 'tire-pressure',
    title: '智能胎压',
    titleTw: '智能胎壓',
    shortTitle: '胎压',
    shortTitleTw: '胎壓',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Gauge
  },
  {
    id: 'gear-calculator',
    title: '齿比与踏频',
    titleTw: '齒比與踏頻',
    shortTitle: '齿比',
    shortTitleTw: '齒比',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Cog
  },
  {
    id: 'chain-calculator',
    title: '链条长度',
    titleTw: '鏈條長度',
    shortTitle: '链长',
    shortTitleTw: '鏈長',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Link
  },
  {
    id: 'climb-pacing',
    title: '爬坡配速',
    titleTw: '爬坡配速',
    shortTitle: '配速',
    shortTitleTw: '配速',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Mountain
  },
  {
    id: 'upgrade-roi',
    title: '改装省瓦 ROI',
    titleTw: '改裝省瓦 ROI',
    shortTitle: '改装',
    shortTitleTw: '改裝',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Scale
  },
  {
    id: 'tubeless-sealant',
    title: '自补液用量',
    titleTw: '自補液用量',
    shortTitle: '自补液',
    shortTitleTw: '自補液',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Droplets
  },
  {
    id: 'spoke-calculator',
    title: '辐条长度',
    titleTw: '輻條長度',
    shortTitle: '辐条',
    shortTitleTw: '輻條',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Disc
  },
  {
    id: 'mtb-suspension',
    title: '避震与 SAG',
    titleTw: '避震與 SAG',
    shortTitle: '避震',
    shortTitleTw: '避震',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Sliders
  },

  // 2. Fitting
  {
    id: 'bike-fitter',
    title: 'Bike Fit',
    titleTw: 'Bike Fit',
    shortTitle: 'Fitting',
    shortTitleTw: 'Fitting',
    category: 'fitting',
    categoryLabel: 'Fitting与工效',
    categoryLabelTw: 'Fitting與工效',
    categoryColor: 'ios-purple',
    icon: Ruler
  },
  {
    id: 'pain-checker',
    title: '骑行痛点诊断',
    titleTw: '騎乘痛點診斷',
    shortTitle: '痛点',
    shortTitleTw: '痛點',
    category: 'fitting',
    categoryLabel: 'Fitting与工效',
    categoryLabelTw: 'Fitting與工效',
    categoryColor: 'ios-purple',
    icon: Activity
  },

  // 3. Route
  {
    id: 'roadbook-library',
    title: '路书航迹库',
    titleTw: '路書航跡庫',
    shortTitle: '路书',
    shortTitleTw: '路書',
    category: 'route',
    categoryLabel: '路线战术气象',
    categoryLabelTw: '路線戰術氣象',
    categoryColor: 'ios-mint',
    icon: Compass
  },
  {
    id: 'gpx-creator',
    title: 'GPX 路线规划',
    titleTw: 'GPX 路線規劃',
    shortTitle: '路线',
    shortTitleTw: '路線',
    category: 'route',
    categoryLabel: '路线战术气象',
    categoryLabelTw: '路線戰術氣象',
    categoryColor: 'ios-mint',
    icon: MapPin
  },
  {
    id: 'group-ride',
    title: '团骑破风战术',
    titleTw: '團騎破風戰術',
    shortTitle: '团骑',
    shortTitleTw: '團騎',
    category: 'route',
    categoryLabel: '路线战术气象',
    categoryLabelTw: '路線戰術氣象',
    categoryColor: 'ios-mint',
    icon: Users
  },
  {
    id: 'weather-advisor',
    title: '天气与风向',
    titleTw: '天氣與風向',
    shortTitle: '天气',
    shortTitleTw: '天氣',
    category: 'route',
    categoryLabel: '路线战术气象',
    categoryLabelTw: '路線戰術氣象',
    categoryColor: 'ios-mint',
    icon: CloudSun
  },

  // 4. Health
  {
    id: 'power-radar',
    title: '功率画像 (MMP)',
    titleTw: '功率畫像 (MMP)',
    shortTitle: '能力雷达',
    shortTitleTw: '能力雷達',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: Target
  },
  {
    id: 'health-calculator',
    title: '健康与能耗',
    titleTw: '健康與能耗',
    shortTitle: '健康能耗',
    shortTitleTw: '健康能耗',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: HeartPulse
  },
  {
    id: 'activity-analyzer',
    title: '活动深度解析',
    titleTw: '活動深度解析',
    shortTitle: '活动解析',
    shortTitleTw: '活動解析',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: LineChart
  },
  {
    id: 'workout-builder',
    title: '间歇课表工坊',
    titleTw: '間歇課表工坊',
    shortTitle: '间歇课表',
    shortTitleTw: '間歇課表',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: Dumbbell
  },
  {
    id: 'strava-cockpit',
    title: 'Strava 罗盘',
    titleTw: 'Strava 羅盤',
    shortTitle: '数据罗盘',
    shortTitleTw: '數據羅盤',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: LayoutDashboard
  },
  {
    id: 'training-calendar',
    title: '训练赛历 (ATP)',
    titleTw: '訓練賽歷 (ATP)',
    shortTitle: '训练赛历',
    shortTitleTw: '訓練賽歷',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: Calendar
  }
];

export const DEFAULT_NAV_SHORTCUTS: string[] = [
  'power-calc',
  'tire-pressure',
  'roadbook-library',
  'bike-fitter'
];

export interface NavPreset {
  id: string;
  name: string;
  nameTw: string;
  icon: string;
  tools: string[];
}

export const NAV_PRESETS: NavPreset[] = [
  {
    id: 'default',
    name: '标准综合',
    nameTw: '標準綜合',
    icon: 'Sparkles',
    tools: ['power-calc', 'tire-pressure', 'roadbook-library', 'bike-fitter']
  },
  {
    id: 'racing',
    name: '竞训破风',
    nameTw: '競訓破風',
    icon: 'Zap',
    tools: ['power-calc', 'power-radar', 'activity-analyzer', 'group-ride']
  },
  {
    id: 'touring',
    name: '长途探索',
    nameTw: '長途探索',
    icon: 'MapPin',
    tools: ['weather-advisor', 'roadbook-library', 'gpx-creator', 'health-calculator']
  },
  {
    id: 'mechanic',
    name: '车店技师',
    nameTw: '車店技師',
    icon: 'Wrench',
    tools: ['gear-calculator', 'chain-calculator', 'tubeless-sealant', 'spoke-calculator']
  }
];

export const getNavToolById = (id: string): NavToolItem | undefined => {
  return ALL_NAV_TOOLS.find(t => t.id === id);
};

export const smoothScrollToTop = () => {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const mainEl = document.getElementById('main-content-scroll');
  if (mainEl) {
    mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
