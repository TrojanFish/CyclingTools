/**
 * Pre-Ride Cycling Locations — Popular Chinese & Taiwan Cycling Destinations
 * Used by usePreRideWeather hook for city selection & geolocation nearest-city matching.
 */

export interface PreRideLocation {
  id: string;
  name: string;      // City/area name (zh-CN)
  nameTw?: string;   // Traditional Chinese name (optional)
  desc: string;      // Landmark / route descriptor
  lat: number;
  lng: number;
  isGps?: boolean;   // True when this location represents user's actual GPS location
}

export const PRE_RIDE_LOCATIONS: PreRideLocation[] = [
  // ── 华东 ──────────────────────────────────────────────────────────────
  {
    id: 'hangzhou',
    name: '杭州',
    nameTw: '杭州',
    desc: '西湖 / 龙井',
    lat: 30.2741,
    lng: 120.1551,
  },
  {
    id: 'shanghai',
    name: '上海',
    nameTw: '上海',
    desc: '崇明 / 临港',
    lat: 31.2304,
    lng: 121.4737,
  },
  {
    id: 'nanjing',
    name: '南京',
    nameTw: '南京',
    desc: '紫金山 / 明孝陵',
    lat: 32.0603,
    lng: 118.7969,
  },
  {
    id: 'suzhou',
    name: '苏州',
    nameTw: '蘇州',
    desc: '太湖 / 阳澄湖',
    lat: 31.2990,
    lng: 120.5853,
  },
  {
    id: 'qiandao',
    name: '千岛湖',
    nameTw: '千島湖',
    desc: '环湖骑行赛道',
    lat: 29.6049,
    lng: 119.0078,
  },
  {
    id: 'ningbo',
    name: '宁波',
    nameTw: '寧波',
    desc: '天童 / 象山港',
    lat: 29.8683,
    lng: 121.5440,
  },
  // ── 华北 ──────────────────────────────────────────────────────────────
  {
    id: 'beijing',
    name: '北京',
    nameTw: '北京',
    desc: '妙峰山 / 戒台寺',
    lat: 39.9042,
    lng: 116.4074,
  },
  {
    id: 'tianjin',
    name: '天津',
    nameTw: '天津',
    desc: '蓟州 / 独乐寺',
    lat: 39.3434,
    lng: 117.3616,
  },
  // ── 华南 ──────────────────────────────────────────────────────────────
  {
    id: 'shenzhen',
    name: '深圳',
    nameTw: '深圳',
    desc: '大鹏半岛 / 盐田',
    lat: 22.5431,
    lng: 114.0579,
  },
  {
    id: 'guangzhou',
    name: '广州',
    nameTw: '廣州',
    desc: '从化 / 流溪河',
    lat: 23.1291,
    lng: 113.2644,
  },
  {
    id: 'xiamen',
    name: '厦门',
    nameTw: '廈門',
    desc: '环岛路 / 同安',
    lat: 24.4798,
    lng: 118.0894,
  },
  // ── 西南 ──────────────────────────────────────────────────────────────
  {
    id: 'chengdu',
    name: '成都',
    nameTw: '成都',
    desc: '天府绿道 / 都江堰',
    lat: 30.5728,
    lng: 104.0668,
  },
  {
    id: 'kunming',
    name: '昆明',
    nameTw: '昆明',
    desc: '滇池环线 / 大理',
    lat: 25.0452,
    lng: 102.7098,
  },
  {
    id: 'zhangjiajie',
    name: '张家界',
    nameTw: '張家界',
    desc: '大峡谷 / 天门山',
    lat: 29.1170,
    lng: 110.4794,
  },
  // ── 台湾 ──────────────────────────────────────────────────────────────
  {
    id: 'wuling',
    name: '武岭',
    nameTw: '武嶺',
    desc: '合欢山 / 台14甲',
    lat: 24.1350,
    lng: 121.2752,
  },
  {
    id: 'taipei',
    name: '台北',
    nameTw: '台北',
    desc: '阳明山 / 北海岸',
    lat: 25.0330,
    lng: 121.5654,
  },
];
