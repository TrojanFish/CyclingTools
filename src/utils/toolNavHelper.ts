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
    title: '骑行功率与速度计算器',
    titleTw: '單車功率與速度計算器',
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
    title: '智能胎压与滚阻计算器',
    titleTw: '公路/全地形智能胎壓計算器',
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
    title: '齿比-速度-踏频多功能计算器',
    titleTw: '齒比-速度-踏頻多功能計算器',
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
    title: '链条长度与传动链节计算器',
    titleTw: '鏈條長度與傳動鏈節計算器',
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
    title: '爬坡路段分段配速与功率规划器',
    titleTw: '爬坡路段分段配速與功率規劃器',
    shortTitle: '爬坡',
    shortTitleTw: '爬坡',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Mountain
  },
  {
    id: 'upgrade-roi',
    title: '零件减重与气动升级省瓦推算器',
    titleTw: '零件減重與空力升級省瓦推算器',
    shortTitle: '省瓦ROI',
    shortTitleTw: '省瓦ROI',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳動',
    categoryColor: 'ios-blue',
    icon: Scale
  },
  {
    id: 'tubeless-sealant',
    title: '真空胎自补液与维护周期计算器',
    titleTw: '無內胎補胎液加注量與週期計算器',
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
    title: '自行车编轮与辐条长度计算器',
    titleTw: '自行車編輪與輻條長度計算器',
    shortTitle: '编轮辐条',
    shortTitleTw: '編輪輻條',
    category: 'dynamics',
    categoryLabel: '动力学与传动',
    categoryLabelTw: '動力學與傳动',
    categoryColor: 'ios-blue',
    icon: Disc
  },

  // 2. Fitting
  {
    id: 'bike-fitter',
    title: '专业公路车 Fitting 拟合器',
    titleTw: '專業公路車 Fitting 擬合器',
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
    title: '骑行疼痛排查与自诊指南',
    titleTw: '騎行疼痛排查與自診指南',
    shortTitle: '疼痛自查',
    shortTitleTw: '疼痛自查',
    category: 'fitting',
    categoryLabel: 'Fitting与工效',
    categoryLabelTw: 'Fitting與工效',
    categoryColor: 'ios-purple',
    icon: Activity
  },

  // 3. Route
  {
    id: 'roadbook-library',
    title: '经典骑行路书与航迹精选库',
    titleTw: '經典騎乘路書與航跡精選庫',
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
    title: 'GPX 路线规划与路书生成器',
    titleTw: 'GPX 路線規劃與路書生成器',
    shortTitle: 'GPX规划',
    shortTitleTw: 'GPX規劃',
    category: 'route',
    categoryLabel: '路线战术气象',
    categoryLabelTw: '路線戰術氣象',
    categoryColor: 'ios-mint',
    icon: MapPin
  },
  {
    id: 'group-ride',
    title: '团骑跟骑阻力与战术模拟',
    titleTw: '團騎跟騎風阻與戰術模擬',
    shortTitle: '团骑模拟',
    shortTitleTw: '團騎模擬',
    category: 'route',
    categoryLabel: '路线战术气象',
    categoryLabelTw: '路線戰術氣象',
    categoryColor: 'ios-mint',
    icon: Users
  },
  {
    id: 'weather-advisor',
    title: '骑行天气与路线气象顾问',
    titleTw: '騎乘天氣與路線氣象顧問',
    shortTitle: '天气顾问',
    shortTitleTw: '天氣顧問',
    category: 'route',
    categoryLabel: '路线战术气象',
    categoryLabelTw: '路線戰術氣象',
    categoryColor: 'ios-mint',
    icon: CloudSun
  },

  // 4. Health
  {
    id: 'power-radar',
    title: '功率能力雷达与极化训练区间',
    titleTw: '功率能力雷達與極化訓練區間',
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
    title: '骑行与运动健康综合计算器',
    titleTw: '騎乘與運動健康綜合計算器',
    shortTitle: '健康补给',
    shortTitleTw: '健康補給',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: HeartPulse
  },
  {
    id: 'activity-analyzer',
    title: '码表活动与 FIT 航迹深度解析器',
    titleTw: '碼表活動與 FIT 航跡深度解析器',
    shortTitle: 'FIT解析',
    shortTitleTw: 'FIT解析',
    category: 'health',
    categoryLabel: '生理与代谢',
    categoryLabelTw: '生理與代謝',
    categoryColor: 'ios-red',
    icon: LineChart
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
    icon: '🌟',
    tools: ['power-calc', 'tire-pressure', 'roadbook-library', 'bike-fitter']
  },
  {
    id: 'racing',
    name: '竞训破风',
    nameTw: '競訓破風',
    icon: '⚡',
    tools: ['power-calc', 'power-radar', 'activity-analyzer', 'group-ride']
  },
  {
    id: 'touring',
    name: '长途探索',
    nameTw: '長途探索',
    icon: '🗺️',
    tools: ['weather-advisor', 'roadbook-library', 'gpx-creator', 'health-calculator']
  },
  {
    id: 'mechanic',
    name: '车店技师',
    nameTw: '車店技師',
    icon: '🔧',
    tools: ['gear-calculator', 'chain-calculator', 'tubeless-sealant', 'spoke-calculator']
  }
];

export const getNavToolById = (id: string): NavToolItem | undefined => {
  return ALL_NAV_TOOLS.find(t => t.id === id);
};
