import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Mountain,
  Download,
  Upload,
  Search,
  Filter,
  Star,
  Clock,
  TrendingUp,
  Share2,
  Bookmark,
  BookmarkCheck,
  Eye,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Layers,
  FileCode,
  Copy,
  Trash2,
  Play,
  Sun,
  Lightbulb
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import L from 'leaflet';
import { IOSCard, IOSMetricTile } from '../common/IOSCard';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { ROADBOOK_DATABASE, RoadbookItem, RoadbookPoint } from '../../data/roadbookDatabase';

interface RoadbookLibraryProps {
  onNavigateTool?: (toolId: string) => void;
}

export const RoadbookLibrary: React.FC<RoadbookLibraryProps> = ({ onNavigateTool }) => {
  const { showToast } = useToast();
  const { language, unitSystem, convertDistance, convertElevation, t } = useLanguageAndUnit();

  // Active collection tab: 'curated' vs 'personal'
  const [activeTab, setActiveTab] = useState<'curated' | 'personal'>('curated');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Personal user-saved roadbooks from localStorage
  const [personalRoutes, setPersonalRoutes] = useState<RoadbookItem[]>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_personal_roadbooks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bookmarked route IDs
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_bookmarked_roadbooks');
      return saved ? JSON.parse(saved) : ['hz-westlake-longjing', 'anji-tianhuangping'];
    } catch {
      return ['hz-westlake-longjing', 'anji-tianhuangping'];
    }
  });

  // Currently selected route for detail preview
  const [selectedRouteId, setSelectedRouteId] = useState<string>(ROADBOOK_DATABASE[0].id);

  // Sync personal routes to localStorage
  useEffect(() => {
    localStorage.setItem('yolo_cycling_personal_roadbooks', JSON.stringify(personalRoutes));
  }, [personalRoutes]);

  // Sync bookmarks
  useEffect(() => {
    localStorage.setItem('yolo_cycling_bookmarked_roadbooks', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarkedIds(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(item => item !== id) : [...prev, id];
      showToast(exists ? '已取消收藏该路书' : '路书已加入我的收藏夹', 'info');
      return next;
    });
  };

  // Combine database based on tab
  const allAvailableRoutes = useMemo(() => {
    return activeTab === 'curated' ? ROADBOOK_DATABASE : personalRoutes;
  }, [activeTab, personalRoutes]);

  // Filtered routes list
  const filteredRoutes = useMemo(() => {
    return allAvailableRoutes.filter(r => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        r.name.toLowerCase().includes(q) ||
        (r.nameEn && r.nameEn.toLowerCase().includes(q)) ||
        r.region.toLowerCase().includes(q) ||
        (r.regionEn && r.regionEn.toLowerCase().includes(q)) ||
        r.sourceCode.toLowerCase().includes(q) ||
        r.highlights.some(h => h.toLowerCase().includes(q));

      // Filters
      const matchProvince = selectedProvince === 'all' || r.province === selectedProvince;
      const matchDifficulty = selectedDifficulty === 'all' || r.difficulty === selectedDifficulty || (r.difficultyEn && r.difficultyEn === selectedDifficulty);
      const matchCategory = selectedCategory === 'all' || r.category === selectedCategory;

      return matchSearch && matchProvince && matchDifficulty && matchCategory;
    });
  }, [allAvailableRoutes, searchQuery, selectedProvince, selectedDifficulty, selectedCategory]);

  // Find active route object
  const activeRoute = useMemo(() => {
    const fromCurated = ROADBOOK_DATABASE.find(r => r.id === selectedRouteId);
    if (fromCurated) return fromCurated;
    const fromPersonal = personalRoutes.find(r => r.id === selectedRouteId);
    if (fromPersonal) return fromPersonal;
    return filteredRoutes[0] || ROADBOOK_DATABASE[0];
  }, [selectedRouteId, personalRoutes, filteredRoutes]);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.22, 120.10],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Map Geometry when activeRoute changes
  useEffect(() => {
    if (!mapInstanceRef.current || !activeRoute || !activeRoute.waypoints.length) return;

    const map = mapInstanceRef.current;
    const latLngs = activeRoute.waypoints.map(w => [w.lat, w.lng] as [number, number]);

    // Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    // Draw route polyline with glowing gradient-like cyan style
    polylineRef.current = L.polyline(latLngs, {
      color: '#00D8FF',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Clear markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      // Add Start Marker (Green)
      const startWp = activeRoute.waypoints[0];
      const startIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${language === 'zh-TW' ? '起' : '起'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([startWp.lat, startWp.lng], { icon: startIcon })
        .bindPopup(`<b>${language === 'zh-TW' ? '起點' : '起点'}: ${startWp.name}</b><br/>海拔: ${convertElevation(startWp.elevation).formatted}`)
        .addTo(markersLayerRef.current);

      // Add End Marker (Red/Amber)
      const endWp = activeRoute.waypoints[activeRoute.waypoints.length - 1];
      const endIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background-color: #f43f5e; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${language === 'zh-TW' ? '終' : '终'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([endWp.lat, endWp.lng], { icon: endIcon })
        .bindPopup(`<b>${language === 'zh-TW' ? '終點' : '终点'}: ${endWp.name}</b><br/>海拔: ${convertElevation(endWp.elevation).formatted}`)
        .addTo(markersLayerRef.current);

      // Add intermediate waypoint dots
      for (let i = 1; i < activeRoute.waypoints.length - 1; i++) {
        const wp = activeRoute.waypoints[i];
        const dotIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div style="background-color: #0284c7; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; border: 1.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);">${i + 1}</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        L.marker([wp.lat, wp.lng], { icon: dotIcon })
          .bindPopup(`<b>${wp.name}</b><br/>海拔: ${convertElevation(wp.elevation).formatted}`)
          .addTo(markersLayerRef.current);
      }
    }

    // Fit Bounds
    map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
  }, [activeRoute, language, convertElevation]);

  // Elevation Profile Chart Data
  const elevationChartData = useMemo(() => {
    if (!activeRoute) return { labels: [], datasets: [] };

    // Calculate approximate cumulative distance per point
    const distanceHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    let cumDist = 0;
    const isImperial = unitSystem === 'imperial';
    const distFactor = isImperial ? 0.621371 : 1;
    const eleFactor = isImperial ? 3.28084 : 1;

    const distLabels: string[] = ['0.0'];
    const elevations: number[] = [Math.round((activeRoute.waypoints[0]?.elevation || 0) * eleFactor)];

    for (let i = 1; i < activeRoute.waypoints.length; i++) {
      const prev = activeRoute.waypoints[i - 1];
      const curr = activeRoute.waypoints[i];
      cumDist += distanceHaversine(prev.lat, prev.lng, curr.lat, curr.lng);
      distLabels.push((cumDist * distFactor).toFixed(1));
      elevations.push(Math.round(curr.elevation * eleFactor));
    }

    return {
      labels: distLabels,
      datasets: [
        {
          label: isImperial ? 'Elevation (ft)' : ('海拔高度 (m)'),
          data: elevations,
          fill: true,
          borderColor: '#00D8FF',
          backgroundColor: 'rgba(0, 216, 255, 0.15)',
          pointBackgroundColor: '#00D8FF',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.35
        }
      ]
    };
  }, [activeRoute, unitSystem, language]);

  // Handle Map Hover from Chart
  const handleChartHover = (event: any, elements: any[]) => {
    if (!mapInstanceRef.current || !activeRoute) return;
    const map = mapInstanceRef.current;

    if (elements && elements.length > 0) {
      const idx = elements[0].index;
      const targetWp = activeRoute.waypoints[idx];
      if (targetWp) {
        if (!hoverMarkerRef.current) {
          hoverMarkerRef.current = L.circleMarker([targetWp.lat, targetWp.lng], {
            radius: 8,
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.9,
            weight: 2
          }).addTo(map);
        } else {
          hoverMarkerRef.current.setLatLng([targetWp.lat, targetWp.lng]);
        }
      }
    } else {
      if (hoverMarkerRef.current) {
        hoverMarkerRef.current.remove();
        hoverMarkerRef.current = null;
      }
    }
  };

  // Export Standard GPX File
  const handleExportGpx = () => {
    if (!activeRoute) return;

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SoloRiderTools - ${activeRoute.name}" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${activeRoute.name}</name>
    <desc>${activeRoute.description} [来源: ${activeRoute.sourceCode}]</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${activeRoute.name}</name>
    <trkseg>
${activeRoute.waypoints.map(wp => `      <trkpt lat="${wp.lat}" lon="${wp.lng}">
        <ele>${wp.elevation}</ele>
        <name>${wp.name}</name>
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeRoute.name.replace(/\s+/g, '_')}_${activeRoute.sourceCode.replace('#', '')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('GPX 轨迹路书已生成并下载！', 'success', '可直接导入 Garmin / 迈金 / 绿犀牛 码表使用');
  };

  // Upload and Parse User GPX / TCX file to Personal Collection
  const handleUserGpxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        let trkpts = xmlDoc.getElementsByTagName('trkpt');
        if (trkpts.length === 0) trkpts = xmlDoc.getElementsByTagName('rtept');
        if (trkpts.length === 0) trkpts = xmlDoc.getElementsByTagName('Trackpoint');

        if (trkpts.length < 2) {
          showToast('未能识别到有效的 GPS 航迹点数据！', 'error');
          return;
        }

        const distanceHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const rawWps: RoadbookPoint[] = [];
        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          let lat = parseFloat(pt.getAttribute('lat') || '0');
          let lon = parseFloat(pt.getAttribute('lon') || '0');
          if (!lat) {
            const pos = pt.getElementsByTagName('Position')[0];
            if (pos) {
              lat = parseFloat(pos.getElementsByTagName('LatitudeDegrees')[0]?.textContent || '0');
              lon = parseFloat(pos.getElementsByTagName('LongitudeDegrees')[0]?.textContent || '0');
            }
          }
          const eleNode = pt.getElementsByTagName('ele')[0] || pt.getElementsByTagName('AltitudeMeters')[0];
          const ele = eleNode ? parseFloat(eleNode.textContent || '20') : 20;
          const nameNode = pt.getElementsByTagName('name')[0];
          const name = nameNode ? nameNode.textContent || `航点 ${i + 1}` : `航点 ${i + 1}`;

          if (lat && lon) {
            rawWps.push({ lat, lng: lon, elevation: ele, name });
          }
        }

        // Downsample to 20 key waypoints for performance
        const targetCount = Math.min(rawWps.length, 24);
        const step = Math.max(1, Math.floor(rawWps.length / targetCount));
        const sampled: RoadbookPoint[] = [];
        for (let i = 0; i < rawWps.length; i += step) {
          sampled.push(rawWps[i]);
        }
        if (sampled[sampled.length - 1] !== rawWps[rawWps.length - 1]) {
          sampled.push(rawWps[rawWps.length - 1]);
        }

        // Compute metrics
        let totalDist = 0;
        let totalEleGain = 0;
        let maxAlt = sampled[0].elevation;

        for (let i = 1; i < sampled.length; i++) {
          totalDist += distanceHaversine(sampled[i - 1].lat, sampled[i - 1].lng, sampled[i].lat, sampled[i].lng);
          const diff = sampled[i].elevation - sampled[i - 1].elevation;
          if (diff > 0) totalEleGain += diff;
          if (sampled[i].elevation > maxAlt) maxAlt = sampled[i].elevation;
        }

        const newRouteName = file.name.replace(/\.[^/.]+$/, '');
        const newRouteId = 'custom-' + Date.now();

        const customRoute: RoadbookItem = {
          id: newRouteId,
          name: newRouteName,
          sourceCode: '本地导入 GPX',
          region: '自定义路线',
          province: '本地',
          category: totalEleGain > 600 ? 'climb' : totalDist > 80 ? 'long-distance' : 'scenic',
          categoryLabel: totalEleGain > 600 ? '高山爬坡' : totalDist > 80 ? '长途耐力' : '自定骑行',
          difficulty: totalEleGain > 1000 ? '终极硬核' : totalEleGain > 500 ? '进阶爬坡' : '入门休闲',
          distanceKm: parseFloat(totalDist.toFixed(1)),
          elevationGainM: Math.round(totalEleGain),
          maxAltitudeM: Math.round(maxAlt),
          avgGradePct: parseFloat(((totalEleGain / (totalDist * 1000 || 1)) * 100).toFixed(1)),
          sceneryRating: 5,
          roadCondition: '导入实测轨迹',
          bestSeason: '四季皆宜',
          description: `车手从行者 / Garmin / 码表导出的个人实测路书 (${file.name})。`,
          highlights: ['实测航迹', '自定义路书', '本地存储'],
          tips: ['请根据实际天气与路面情况安全骑行。'],
          waypoints: sampled
        };

        setPersonalRoutes(prev => [customRoute, ...prev]);
        setActiveTab('personal');
        setSelectedRouteId(newRouteId);
        showToast('自定义 GPX 路书导入成功！', 'success', `已保存至本地路书库，里程 ${customRoute.distanceKm}km，爬升 +${customRoute.elevationGainM}m`);
      } catch (err) {
        showToast('GPX 解析失败，请检查文件！', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Delete personal route
  const deletePersonalRoute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPersonalRoutes(prev => prev.filter(r => r.id !== id));
    showToast('已删除该自定义路书', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ios-card p-6 sm:p-7 rounded-3xl relative overflow-hidden shadow-ios-sm isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-mint/15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-mint/10 border border-ios-mint/20 text-ios-mint text-xs font-semibold mb-2">
              <Compass className="w-3.5 h-3.5" />
              {language === 'zh-TW' ? '精選世界與全國經典單車路書工坊' : '行者实测·全国及世界经典骑行路书精选工坊'}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {language === 'zh-TW' ? '經典單車路書與航跡精選庫' : '经典骑行路书与航迹精选库'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              {language === 'zh-TW'
                ? '匯聚歐洲環法環義傳奇天路與經典實測單車路書，支援互動式地圖漫遊、高程起伏剖面、一鍵匯出 GPX 及與天氣/爬坡工具連動。'
                : '汇聚浙江与全国高热度实测骑行路书及欧洲环法环意传奇天路，支持交互式地图漫游、高程起伏剖面、一键导出 GPX 及与天气/爬坡工具联动。'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 cursor-pointer transition shadow-ios-sm apple-touch">
              <Upload className="w-4 h-4 text-ios-blue" />
              <span>{language === 'zh-TW' ? '匯入 GPX' : '导入 GPX'}</span>
              <input type="file" accept=".gpx,.tcx,.xml" onChange={handleUserGpxUpload} className="hidden" />
            </label>

            <button
              onClick={handleExportGpx}
              className="flex items-center gap-2 px-4 py-2.5 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-2xl font-bold text-xs transition shadow-ios-md apple-touch"
            >
              <Download className="w-4 h-4" />
              {language === 'zh-TW' ? '匯出 GPX' : '导出 GPX'}
            </button>
          </div>
        </div>

        {/* Tabs & Search Filter Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* IOSSegmentedControl Tabs */}
          <div className="w-full sm:w-auto">
            <IOSSegmentedControl
              options={[
                { value: 'curated', label: language === 'zh-TW' ? `精選路書 (${ROADBOOK_DATABASE.length})` : `精选路书 (${ROADBOOK_DATABASE.length})` },
                { value: 'personal', label: language === 'zh-TW' ? `本地匯入 (${personalRoutes.length})` : `本地导入 (${personalRoutes.length})` }
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as any)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'zh-TW' ? '搜尋路書名稱、城市、景點、行者編號...' : '搜索路书名、城市、景点、行者编号...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-ios-blue"
              />
            </div>

            {/* Province Filter */}
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-ios-blue"
            >
              <option value="all">{language === 'zh-TW' ? '全部地區' : '全部地区'}</option>
              <option value="Europe">{language === 'zh-TW' ? '歐洲經典 (阿爾卑斯/馬略卡)' : '欧洲经典 (阿尔卑斯/马略卡)'}</option>
              <option value="浙江">{language === 'zh-TW' ? '浙江省' : '浙江省'}</option>
              <option value="江浙沪">{language === 'zh-TW' ? '江浙滬' : '江浙沪'}</option>
              <option value="北京">{language === 'zh-TW' ? '北京' : '北京'}</option>
              <option value="青海">{language === 'zh-TW' ? '青海省' : '青海省'}</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-ios-blue"
            >
              <option value="all">{language === 'zh-TW' ? '全部難度' : '全部难度'}</option>
              <option value="入门休闲">{language === 'zh-TW' ? '入門休閒' : '入门休闲'}</option>
              <option value="进阶爬坡">{language === 'zh-TW' ? '進階爬坡' : '进阶爬坡'}</option>
              <option value="长途挑战">{language === 'zh-TW' ? '長途挑戰' : '长途挑战'}</option>
              <option value="终极硬核">{language === 'zh-TW' ? '終極硬核' : '终极硬核'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hero Metric Summary for Active Route */}
      {activeRoute && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <IOSMetricTile
            label={language === 'zh-TW' ? '路線總里程' : '路线总里程'}
            value={convertDistance(activeRoute.distanceKm).value}
            unit={convertDistance(activeRoute.distanceKm).unit}
            subValue={activeRoute.region}
            accent="blue"
          />
          <IOSMetricTile
            label={language === 'zh-TW' ? '累計總爬升' : '累计总爬升'}
            value={`+${convertElevation(activeRoute.elevationGainM).value}`}
            unit={convertElevation(activeRoute.elevationGainM).unit}
            subValue={`${language === 'zh-TW' ? '平均坡度' : '平均坡度'} ${activeRoute.avgGradePct}%`}
            accent="orange"
          />
          <IOSMetricTile
            label={language === 'zh-TW' ? '最高海拔點' : '最高海拔点'}
            value={convertElevation(activeRoute.maxAltitudeM).value}
            unit={convertElevation(activeRoute.maxAltitudeM).unit}
            subValue={activeRoute.categoryLabel || activeRoute.category}
            accent="purple"
          />
          <IOSMetricTile
            label={language === 'zh-TW' ? '挑戰難度' : '挑战难度'}
            value={activeRoute.difficulty}
            unit=""
            subValue={`景致 ⭐${activeRoute.sceneryRating}/5`}
            accent="green"
          />
        </div>
      )}

      {/* Main Grid: Left Route Cards + Right Interactive Map & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Cards Matrix */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[860px] overflow-y-auto pr-1">
          {filteredRoutes.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {'未找到符合筛选条件的路书'}
              </p>
              {activeTab === 'personal' && (
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {'立即导入本地 GPX'}
                  <input type="file" accept=".gpx,.tcx,.xml" onChange={handleUserGpxUpload} className="hidden" />
                </label>
              )}
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const isBookmarked = bookmarkedIds.includes(route.id);
              const rName = route.name;
              const rRegion = route.region;
              const rDiff = route.difficulty;

              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`ios-card p-4 rounded-3xl border transition cursor-pointer relative group apple-touch shadow-ios-card ${
                    isSelected
                      ? 'border-ios-blue ring-2 ring-ios-blue/30 bg-ios-blue/5'
                      : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-ios-blue/15 text-ios-blue font-semibold">
                          {route.sourceCode}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium">
                          {rRegion}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          route.difficulty === '终极硬核' ? 'bg-ios-red/15 text-ios-red' :
                          route.difficulty === '长途挑战' ? 'bg-ios-orange/15 text-ios-orange' :
                          route.difficulty === '进阶爬坡' ? 'bg-ios-purple/15 text-ios-purple' :
                          'bg-ios-green/15 text-ios-green'
                        }`}>
                          {rDiff}
                        </span>
                      </div>
                      <h3 className={`text-sm font-bold pt-1 ${isSelected ? 'text-ios-blue' : 'text-slate-900 dark:text-white'}`}>
                        {rName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => toggleBookmark(route.id, e)}
                        className={`p-1.5 rounded-xl transition apple-touch ${
                          isBookmarked
                            ? 'text-ios-orange hover:opacity-80'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={isBookmarked ? ('取消收藏') : ('加入收藏')}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      {activeTab === 'personal' && (
                        <button
                          onClick={(e) => deletePersonalRoute(route.id, e)}
                          className="p-1.5 text-slate-400 hover:text-ios-red transition rounded-xl apple-touch"
                          title={'删除该自定义路书'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Route Key Metric Grid */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 text-center font-mono">
                    <div className="p-1.5 rounded-2xl bg-white/60 dark:bg-white/5">
                      <span className="text-[10px] text-slate-400 block">{language === 'zh-TW' ? '總里程' : '总里程'}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{convertDistance(route.distanceKm).formatted}</span>
                    </div>
                    <div className="p-1.5 rounded-2xl bg-white/60 dark:bg-white/5">
                      <span className="text-[10px] text-slate-400 block">{language === 'zh-TW' ? '累計爬升' : '累计爬升'}</span>
                      <span className="text-xs font-bold text-ios-blue">+{convertElevation(route.elevationGainM).formatted}</span>
                    </div>
                    <div className="p-1.5 rounded-2xl bg-white/60 dark:bg-white/5">
                      <span className="text-[10px] text-slate-400 block">{language === 'zh-TW' ? '最高海拔' : '最高海拔'}</span>
                      <span className="text-xs font-bold text-ios-orange">{convertElevation(route.maxAltitudeM).formatted}</span>
                    </div>
                    <div className="p-1.5 rounded-2xl bg-white/60 dark:bg-white/5">
                      <span className="text-[10px] text-slate-400 block">{language === 'zh-TW' ? '平均坡度' : '平均坡度'}</span>
                      <span className="text-xs font-bold text-ios-green">{route.avgGradePct}%</span>
                    </div>
                  </div>

                  {/* Highlights Pill Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {route.highlights.slice(0, 4).map((h, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Full Interactive Map + Elevation Chart + Deep Notes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Map Card */}
          <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-ios-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ios-blue" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeRoute.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-ios-blue font-bold">
                  {convertDistance(activeRoute.distanceKm).formatted} / +{convertElevation(activeRoute.elevationGainM).formatted}
                </span>
              </div>
            </div>

            {/* Leaflet Map Box */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 z-10 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-80 bg-slate-900"></div>
            </div>

            {/* Quick Waypoints sequence */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs scrollbar-none">
              <span className="text-slate-400 text-[11px] shrink-0 font-medium">
                {'途经断面:'}
              </span>
              {activeRoute.waypoints.map((wp, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 shrink-0 text-[11px]"
                >
                  {idx + 1}. {wp.name.split(' ')[0]} ({convertElevation(wp.elevation).formatted})
                </span>
              ))}
            </div>
          </div>

          {/* Elevation Profile Chart */}
          <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-ios-card">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mountain className="w-4 h-4 text-ios-blue" />
                {'全线高程起伏与地形剖面 (交互联动)'}
              </h3>
              <span className="text-[11px] text-slate-400">
                {'鼠标悬浮图表可在地图上定位对应点'}
              </span>
            </div>
            <div className="h-44 w-full">
              <Line
                data={elevationChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  onHover: handleChartHover,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        title: (items) => `${language === 'zh-TW' ? '里程點' : '里程点'}: ${items[0].label} ${unitSystem === 'imperial' ? 'mi' : 'km'}`,
                        label: (item) => `海拔: ${item.raw} ${unitSystem === 'imperial' ? 'ft' : 'm'}`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(150, 150, 150, 0.08)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    y: {
                      grid: { color: 'rgba(150, 150, 150, 0.08)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Route Deep Intel & Tips */}
          <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 shadow-ios-card">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-ios-orange" />
              {'路线实测指引与安全贴士'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeRoute.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-ios-blue" />
                  <span>{language === 'zh-TW' ? '路況與通行情況:' : '路况与通行情况:'}</span>
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed block">
                  {activeRoute.roadCondition}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-ios-orange" />
                  <span>{language === 'zh-TW' ? '最佳騎行季節與時段:' : '最佳骑行季节与时段:'}</span>
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed block">
                  {activeRoute.bestSeason}
                </span>
              </div>
            </div>

            {/* Practical Advice Tips */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-ios-orange flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-ios-orange" />
                <span>{language === 'zh-TW' ? '老鳥車手避坑與補給經驗:' : '老鸟车手避坑与补给经验:'}</span>
              </span>
              {activeRoute.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-2xl bg-ios-orange/10 border border-ios-orange/20 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-ios-orange mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>

            {/* Cross-Tool Actions */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onNavigateTool && (
                  <>
                    <button
                      onClick={() => onNavigateTool('weather-advisor')}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
                    >
                      <Compass className="w-3.5 h-3.5 text-ios-blue" />
                      {language === 'zh-TW' ? '沿途天氣' : '沿途天气'}
                    </button>
                    <button
                      onClick={() => onNavigateTool('climb-pacing')}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
                    >
                      <Mountain className="w-3.5 h-3.5 text-amber-500" />
                      {language === 'zh-TW' ? '爬坡規劃' : '爬坡规划'}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={handleExportGpx}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md shadow-cyan-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                {language === 'zh-TW' ? '下載 GPX 檔' : '下载 GPX 文件'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
