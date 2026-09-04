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
  Play
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import L from 'leaflet';
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
        html: `<div style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${language === 'en' ? 'S' : '起'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([startWp.lat, startWp.lng], { icon: startIcon })
        .bindPopup(`<b>${language === 'en' ? 'Start' : '起点'}: ${startWp.name}</b><br/>${language === 'en' ? 'Elevation' : '海拔'}: ${convertElevation(startWp.elevation).formatted}`)
        .addTo(markersLayerRef.current);

      // Add End Marker (Red/Amber)
      const endWp = activeRoute.waypoints[activeRoute.waypoints.length - 1];
      const endIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background-color: #f43f5e; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${language === 'en' ? 'F' : '终'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker([endWp.lat, endWp.lng], { icon: endIcon })
        .bindPopup(`<b>${language === 'en' ? 'Finish' : '终点'}: ${endWp.name}</b><br/>${language === 'en' ? 'Elevation' : '海拔'}: ${convertElevation(endWp.elevation).formatted}`)
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
          .bindPopup(`<b>${wp.name}</b><br/>${language === 'en' ? 'Elevation' : '海拔'}: ${convertElevation(wp.elevation).formatted}`)
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
          label: isImperial ? 'Elevation (ft)' : (language === 'en' ? 'Elevation (m)' : '海拔高度 (m)'),
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
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <Compass className="w-3.5 h-3.5" />
              {language === 'en' ? 'Curated Grand Tour & Domestic Iconic Climbs & Roadbooks' : language === 'zh-TW' ? '精選世界與全國經典單車路書工坊' : '行者实测·全国及世界经典骑行路书精选工坊'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {language === 'en' ? 'Iconic Roadbooks & GPX Track Library' : language === 'zh-TW' ? '經典單車路書與航跡精選庫' : '经典骑行路书与航迹精选库'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {language === 'en'
                ? 'Featuring legendary European Grand Tour climbs (Alpe d\'Huez, Stelvio, Sa Calobra) alongside premier domestic routes. Interactive maps, elevation profiles, 1-click GPX export, and live weather integration.'
                : language === 'zh-TW'
                ? '匯聚歐洲環法環義傳奇天路與經典實測單車路書，支援互動式地圖漫遊、高程起伏剖面、一鍵匯出 GPX 及與天氣/爬坡工具連動。'
                : '汇聚浙江与全国高热度实测骑行路书及欧洲环法环意传奇天路，支持交互式地图漫游、高程起伏剖面、一键导出 GPX 及与天气/爬坡工具联动。'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 text-xs font-semibold border border-cyan-500/30 cursor-pointer transition shadow-sm">
              <Upload className="w-4 h-4 text-cyan-500" />
              <span>{language === 'en' ? 'Import My GPX' : language === 'zh-TW' ? '匯入我的 GPX 路書' : '导入我的 GPX 路书'}</span>
              <input type="file" accept=".gpx,.tcx,.xml" onChange={handleUserGpxUpload} className="hidden" />
            </label>

            <button
              onClick={handleExportGpx}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-xs transition shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              {language === 'en' ? 'Export Current GPX' : language === 'zh-TW' ? '匯出當前路書 GPX' : '导出当前路书 GPX'}
            </button>
          </div>
        </div>

        {/* Tabs & Search Filter Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
            <button
              onClick={() => setActiveTab('curated')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'curated'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {language === 'en' ? `Curated Classics (${ROADBOOK_DATABASE.length})` : language === 'zh-TW' ? `精選經典路書 (${ROADBOOK_DATABASE.length})` : `精选经典路书 (${ROADBOOK_DATABASE.length})`}
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'personal'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {language === 'en' ? `My Imported GPX (${personalRoutes.length})` : language === 'zh-TW' ? `我的本地匯入路書 (${personalRoutes.length})` : `我的本地导入路书 (${personalRoutes.length})`}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search route name, climb, Alps, code...' : language === 'zh-TW' ? '搜尋路書名稱、城市、景點、行者編號...' : '搜索路书名、城市、景点、行者编号...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Province Filter */}
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{language === 'en' ? 'All Regions' : language === 'zh-TW' ? '全部地區' : '全部地区'}</option>
              <option value="Europe">{language === 'en' ? 'Europe (Alps & Mallorca)' : language === 'zh-TW' ? '歐洲經典 (阿爾卑斯/馬略卡)' : '欧洲经典 (阿尔卑斯/马略卡)'}</option>
              <option value="浙江">{language === 'en' ? 'Zhejiang Province' : language === 'zh-TW' ? '浙江省' : '浙江省'}</option>
              <option value="江浙沪">{language === 'en' ? 'Shanghai & Jiangzhe' : language === 'zh-TW' ? '江浙滬' : '江浙沪'}</option>
              <option value="北京">{language === 'en' ? 'Beijing' : language === 'zh-TW' ? '北京' : '北京'}</option>
              <option value="青海">{language === 'en' ? 'Qinghai' : language === 'zh-TW' ? '青海省' : '青海省'}</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{language === 'en' ? 'All Difficulties' : language === 'zh-TW' ? '全部難度' : '全部难度'}</option>
              <option value="入门休闲">{language === 'en' ? 'Intro & Leisure' : language === 'zh-TW' ? '入門休閒' : '入门休闲'}</option>
              <option value="进阶爬坡">{language === 'en' ? 'Medium Climb' : language === 'zh-TW' ? '進階爬坡' : '进阶爬坡'}</option>
              <option value="长途挑战">{language === 'en' ? 'Endurance Epic' : language === 'zh-TW' ? '長途挑戰' : '长途挑战'}</option>
              <option value="终极硬核">{language === 'en' ? 'Hardcore HC' : language === 'zh-TW' ? '終極硬核' : '终极硬核'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Route Cards + Right Interactive Map & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Cards Matrix */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[860px] overflow-y-auto pr-1">
          {filteredRoutes.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'No routes matched the selected criteria' : '未找到符合筛选条件的路书'}
              </p>
              {activeTab === 'personal' && (
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Import Local GPX Now' : '立即导入本地 GPX'}
                  <input type="file" accept=".gpx,.tcx,.xml" onChange={handleUserGpxUpload} className="hidden" />
                </label>
              )}
            </div>
          ) : (
            filteredRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const isBookmarked = bookmarkedIds.includes(route.id);
              const rName = (language === 'en' && route.nameEn) ? route.nameEn : route.name;
              const rRegion = (language === 'en' && route.regionEn) ? route.regionEn : route.region;
              const rDiff = (language === 'en' && route.difficultyEn) ? route.difficultyEn : route.difficulty;

              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative group ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500/40 shadow-md'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/20">
                          {route.sourceCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {rRegion}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          route.difficulty === '终极硬核' ? 'bg-rose-500/15 text-rose-500' :
                          route.difficulty === '长途挑战' ? 'bg-amber-500/15 text-amber-500' :
                          route.difficulty === '进阶爬坡' ? 'bg-purple-500/15 text-purple-500' :
                          'bg-emerald-500/15 text-emerald-500'
                        }`}>
                          {rDiff}
                        </span>
                      </div>
                      <h3 className={`text-sm font-bold pt-1 ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-slate-200'}`}>
                        {rName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => toggleBookmark(route.id, e)}
                        className={`p-1.5 rounded-lg transition ${
                          isBookmarked
                            ? 'text-amber-500 hover:text-amber-400'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={isBookmarked ? (language === 'en' ? 'Remove bookmark' : '取消收藏') : (language === 'en' ? 'Bookmark' : '加入收藏')}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      {activeTab === 'personal' && (
                        <button
                          onClick={(e) => deletePersonalRoute(route.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg"
                          title={language === 'en' ? 'Delete custom roadbook' : '删除该自定义路书'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Route Key Metric Grid */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block">{language === 'en' ? 'Distance' : language === 'zh-TW' ? '總里程' : '总里程'}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{convertDistance(route.distanceKm).formatted}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block">{language === 'en' ? 'Elevation' : language === 'zh-TW' ? '累計爬升' : '累计爬升'}</span>
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">+{convertElevation(route.elevationGainM).formatted}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block">{language === 'en' ? 'Max Alt' : language === 'zh-TW' ? '最高海拔' : '最高海拔'}</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{convertElevation(route.maxAltitudeM).formatted}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60">
                      <span className="text-[10px] text-slate-400 block">{language === 'en' ? 'Avg Grade' : language === 'zh-TW' ? '平均坡度' : '平均坡度'}</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{route.avgGradePct}%</span>
                    </div>
                  </div>

                  {/* Highlights Pill Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {route.highlights.slice(0, 4).map((h, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
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
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {(language === 'en' && activeRoute.nameEn) ? activeRoute.nameEn : activeRoute.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  {convertDistance(activeRoute.distanceKm).formatted} / +{convertElevation(activeRoute.elevationGainM).formatted}
                </span>
              </div>
            </div>

            {/* Leaflet Map Box */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 z-10 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-80 bg-slate-900"></div>
            </div>

            {/* Quick Waypoints sequence */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs scrollbar-none">
              <span className="text-slate-400 text-[11px] shrink-0 font-medium">
                {language === 'en' ? 'Key Waypoints:' : '途经断面:'}
              </span>
              {activeRoute.waypoints.map((wp, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0 text-[11px]"
                >
                  {idx + 1}. {wp.name.split(' ')[0]} ({convertElevation(wp.elevation).formatted})
                </span>
              ))}
            </div>
          </div>

          {/* Elevation Profile Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Mountain className="w-4 h-4 text-cyan-500" />
                {language === 'en' ? 'Terrain & Elevation Profile (Interactive)' : '全线高程起伏与地形剖面 (交互联动)'}
              </h3>
              <span className="text-[11px] text-slate-400">
                {language === 'en' ? 'Hover on graph to locate point on map' : '鼠标悬浮图表可在地图上定位对应点'}
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
                        title: (items) => `${language === 'en' ? 'Distance' : '里程点'}: ${items[0].label} ${unitSystem === 'imperial' ? 'mi' : 'km'}`,
                        label: (item) => `${language === 'en' ? 'Elevation' : '海拔'}: ${item.raw} ${unitSystem === 'imperial' ? 'ft' : 'm'}`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(150, 150, 150, 0.1)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    y: {
                      grid: { color: 'rgba(150, 150, 150, 0.1)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Route Deep Intel & Tips */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              {language === 'en' ? 'Route Guidance & Safety Tips' : '路线实测指引与安全贴士'}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {(language === 'en' && activeRoute.descriptionEn) ? activeRoute.descriptionEn : activeRoute.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {language === 'en' ? '🛣️ Road Surface & Conditions:' : '🛣️ 路况与通行情况:'}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed block">
                  {(language === 'en' && activeRoute.roadConditionEn) ? activeRoute.roadConditionEn : activeRoute.roadCondition}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {language === 'en' ? '☀️ Prime Season & Riding Hours:' : '☀️ 最佳骑行季节与时段:'}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed block">
                  {activeRoute.bestSeason}
                </span>
              </div>
            </div>

            {/* Practical Advice Tips */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">
                {language === 'en' ? '💡 Pro Rider Tips & Resupply Logistics:' : '💡 老鸟车手避坑与补给经验:'}
              </span>
              {activeRoute.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>

            {/* Cross-Tool Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onNavigateTool && (
                  <>
                    <button
                      onClick={() => onNavigateTool('weather-advisor')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                    >
                      <Compass className="w-3.5 h-3.5 text-cyan-500" />
                      {language === 'en' ? 'Live Weather' : '去查实时沿途天气'}
                    </button>
                    <button
                      onClick={() => onNavigateTool('climb-pacing')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                    >
                      <Mountain className="w-3.5 h-3.5 text-amber-500" />
                      {language === 'en' ? 'Pacing Calculator' : '去规划爬坡功率'}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={handleExportGpx}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md shadow-cyan-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                {language === 'en' ? 'Download GPX Roadbook' : '下载本路书 GPX 码表文件'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
