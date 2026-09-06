import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Mountain, Download, Upload, RefreshCw, Navigation, Play, Plus, Trash2, Search, ArrowRightLeft, ArrowUp, ArrowDown, FileCode, CheckCircle2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import L from 'leaflet';
import { useToast } from '../../context/ToastContext';
import { IOSCard, IOSMetricTile } from '../common/IOSCard';

interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  elevation: number;
  name?: string;
}

import { ZHEJIANG_XINGZHE_ROUTES } from '../../data/zhejiangRoutes';

export const GpxRouteCreator: React.FC = () => {
  const { showToast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const hoverMarkerRef = useRef<L.CircleMarker | null>(null);

  const [waypoints, setWaypoints] = useState<Waypoint[]>(ZHEJIANG_XINGZHE_ROUTES[0].waypoints);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(ZHEJIANG_XINGZHE_ROUTES[0].id);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>(ZHEJIANG_XINGZHE_ROUTES[0].name);

  // Check for route transferred from RoadbookLibrary
  useEffect(() => {
    try {
      const pendingRaw = localStorage.getItem('solorider_pending_gpx_route');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        if (pending && Array.isArray(pending.waypoints) && pending.waypoints.length > 0) {
          const mapped: Waypoint[] = pending.waypoints.map((wp: any, idx: number) => ({
            id: 'wp-' + Date.now() + '-' + idx,
            lat: wp.lat,
            lng: wp.lng,
            elevation: wp.elevation || 20,
            name: wp.name || `航点 #${idx + 1}`
          }));
          setWaypoints(mapped);
          if (pending.name) {
            setRouteName(pending.name);
          }
          setSelectedPresetId('custom');
          showToast(`已成功载入路书「${pending.name}」共 ${mapped.length} 个航点，可自由编辑！`, 'success');
        }
        localStorage.removeItem('solorider_pending_gpx_route');
      }
    } catch (e) {
      console.warn('Failed to parse incoming route from RoadbookLibrary:', e);
    }
  }, [showToast]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.22, 120.10],
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      let elevation = 20;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat.toFixed(5)}&longitude=${lng.toFixed(5)}`);
        const data = await res.json();
        if (data.elevation && data.elevation[0]) {
          elevation = Math.round(data.elevation[0]);
        }
      } catch (err) {
        elevation = Math.round(15 + Math.random() * 50);
      }

      setWaypoints(prev => [
        ...prev,
        { id: Date.now().toString(), lat, lng, elevation, name: `航点 #${prev.length + 1}` }
      ]);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map polyline & markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
    }
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (waypoints.length >= 1) {
      const latLngs = waypoints.map(w => [w.lat, w.lng] as [number, number]);

      if (waypoints.length >= 2) {
        const polyline = L.polyline(latLngs, {
          color: '#00AFFF',
          weight: 4,
          opacity: 0.85
        }).addTo(map);
        polylineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
      }

      // Add Start & End Markers
      if (waypoints[0]) {
        const startMarker = L.marker([waypoints[0].lat, waypoints[0].lng]).addTo(map).bindPopup('起点: ' + (waypoints[0].name || '起点'));
        markersRef.current.push(startMarker);
      }
      if (waypoints.length > 1) {
        const endW = waypoints[waypoints.length - 1];
        const endMarker = L.marker([endW.lat, endW.lng]).addTo(map).bindPopup('终点: ' + (endW.name || '终点'));
        markersRef.current.push(endMarker);
      }
    }
  }, [waypoints]);

  // Elevation Profile Chart & Distance Metrics
  const routeStats = useMemo(() => {
    let totalDistKm = 0;
    let totalClimbM = 0;
    let totalDescentM = 0;
    const profilePoints: { distKm: number; elevation: number; lat: number; lng: number }[] = [];

    for (let i = 0; i < waypoints.length; i++) {
      const curr = waypoints[i];
      if (i > 0) {
        const prev = waypoints[i - 1];
        const p1 = L.latLng(prev.lat, prev.lng);
        const p2 = L.latLng(curr.lat, curr.lng);
        const d = p1.distanceTo(p2) / 1000;
        totalDistKm += d;

        const eleDiff = curr.elevation - prev.elevation;
        if (eleDiff > 0) totalClimbM += eleDiff;
        else totalDescentM += Math.abs(eleDiff);
      }
      profilePoints.push({
        distKm: parseFloat(totalDistKm.toFixed(1)),
        elevation: curr.elevation,
        lat: curr.lat,
        lng: curr.lng
      });
    }

    return {
      totalDistKm: parseFloat(totalDistKm.toFixed(1)),
      totalClimbM: Math.round(totalClimbM),
      totalDescentM: Math.round(totalDescentM),
      profilePoints
    };
  }, [waypoints]);

  // Elevation Chart Data
  const chartData = useMemo(() => {
    return {
      labels: routeStats.profilePoints.map(p => `${p.distKm} km`),
      datasets: [
        {
          label: '海拔 (m)',
          data: routeStats.profilePoints.map(p => p.elevation),
          borderColor: '#00AFFF',
          backgroundColor: 'rgba(0, 175, 255, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#00AFFF'
        }
      ]
    };
  }, [routeStats]);

  // Hover chart sync marker on map
  const handleChartHover = (event: any, activeElements: any[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeElements && activeElements.length > 0) {
      const index = activeElements[0].index;
      const pt = routeStats.profilePoints[index];
      if (pt) {
        if (!hoverMarkerRef.current) {
          hoverMarkerRef.current = L.circleMarker([pt.lat, pt.lng], {
            radius: 7,
            color: '#ffffff',
            fillColor: '#00AFFF',
            fillOpacity: 1,
            weight: 2
          }).addTo(map);
        } else {
          hoverMarkerRef.current.setLatLng([pt.lat, pt.lng]);
        }
      }
    } else if (hoverMarkerRef.current) {
      hoverMarkerRef.current.remove();
      hoverMarkerRef.current = null;
    }
  };

  // Load Preset Route from Xingzhe Database
  const loadPresetRoute = (routeId: string) => {
    const targetRoute = ZHEJIANG_XINGZHE_ROUTES.find(r => r.id === routeId);
    if (targetRoute) {
      setSelectedPresetId(targetRoute.id);
      setRouteName(targetRoute.name);
      setWaypoints(targetRoute.waypoints);
      showToast(`已加载行者实测路书: ${targetRoute.name}`, 'success', `路书编号: ${targetRoute.xingzheRoadbookId} | 全长 ${targetRoute.distanceKm}km`);
    }
  };

  // Search Location via Nominatim
  const handleSearchLocation = async () => {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        mapInstanceRef.current.setView([lat, lng], 14);
        showToast('已定位至地名位置', 'success', first.display_name);
      } else {
        showToast('未找到该地点，请换个关键词重试', 'warning');
      }
    } catch (e) {
      showToast('地名搜索失败，请检查网络连接', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse route
  const handleReverseRoute = () => {
    setWaypoints(prev => [...prev].reverse());
    showToast('已成功反转路书航迹方向！', 'info');
  };

  // Import GPX File
  const handleGpxFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const trkpts = xmlDoc.getElementsByTagName('trkpt');

        if (trkpts.length === 0) {
          showToast('无法识别 GPX 航点数据，请确认文件格式！', 'error');
          return;
        }

        const parsedWaypoints: Waypoint[] = [];
        // Sample points if too dense (max 50 points for smooth map editing)
        const step = Math.max(1, Math.floor(trkpts.length / 50));

        for (let i = 0; i < trkpts.length; i += step) {
          const pt = trkpts[i];
          const lat = parseFloat(pt.getAttribute('lat') || '0');
          const lng = parseFloat(pt.getAttribute('lon') || '0');
          const eleNode = pt.getElementsByTagName('ele')[0];
          const elevation = eleNode ? Math.round(parseFloat(eleNode.textContent || '0')) : 30;

          if (lat && lng) {
            parsedWaypoints.push({
              id: Date.now().toString() + i,
              lat,
              lng,
              elevation,
              name: `导入点 #${parsedWaypoints.length + 1}`
            });
          }
        }

        setWaypoints(parsedWaypoints);
        setRouteName(file.name.replace(/\.[^/.]+$/, ''));
        showToast('GPX 文件解析导入成功！', 'success', `共导入 ${parsedWaypoints.length} 个核心航迹点`);
      } catch (err) {
        showToast('GPX 解析失败，请检查文件格式！', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Export GPX XML
  const handleExportGpx = () => {
    if (waypoints.length < 2) {
      showToast('航点数量不足，请在地图上至少添加 2 个点！', 'warning');
      return;
    }

    const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SoloRiderTools PRO Roadbook" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${routeName}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${routeName}</name>
    <trkseg>
${waypoints.map(w => `      <trkpt lat="${w.lat}" lon="${w.lng}">
        <ele>${w.elevation}</ele>
        <time>${new Date().toISOString()}</time>
      </trkpt>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxXml], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${routeName.replace(/\s+/g, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('GPX 路书已生成并下载！', 'success');
  };

  // Waypoint operations
  const deleteWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(w => w.id !== id));
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === waypoints.length - 1) return;

    setWaypoints(prev => {
      const copy = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ios-card p-6 sm:p-7 rounded-3xl relative overflow-hidden shadow-ios-sm isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-mint/15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-mint/10 border border-ios-mint/20 text-ios-mint text-xs font-semibold mb-2">
              <Navigation className="w-3.5 h-3.5" />
              GIS 地理拓扑与路书工坊
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">GPX 路线规划与路书工坊</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              地名智能搜索、已有 GPX 导入解析、海拔剖面图联动定位与专业标准 GPX 文件导出。
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 cursor-pointer shadow-xs apple-touch transition">
              <Upload className="w-3.5 h-3.5 text-ios-blue" />
              导入 GPX
              <input type="file" accept=".gpx,.xml" onChange={handleGpxFileUpload} className="hidden" />
            </label>
            <button
              onClick={handleReverseRoute}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 shadow-xs apple-touch transition"
              title="一键反转起点与终点"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-ios-blue" />
              反转路线
            </button>
            <button
              onClick={handleExportGpx}
              className="flex items-center gap-2 px-4 py-2 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full font-semibold text-xs transition shadow-ios-sm apple-touch"
            >
              <Download className="w-4 h-4" />
              导出 .GPX
            </button>
          </div>
        </div>
      </div>

      {/* Xingzhe Verified Zhejiang Routes Showcase Bar */}
      <div className="ios-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-ios-blue" />
              行者精选·浙江实测经典路书 (6条经典高频):
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0">当前路书:</label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs text-ios-blue font-bold focus:outline-none focus:border-ios-blue truncate"
            />
          </div>
        </div>

        {/* 6 Route Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ZHEJIANG_XINGZHE_ROUTES.map((route) => {
            const isSelected = selectedPresetId === route.id;
            return (
              <button
                key={route.id}
                onClick={() => loadPresetRoute(route.id)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between apple-touch ${
                  isSelected
                    ? 'bg-ios-blue text-white border-ios-blue ring-2 ring-ios-blue/30 shadow-ios-md scale-[1.01]'
                    : 'bg-white/70 dark:bg-white/5 border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                    }`}>
                      {route.city}
                    </span>
                    <span className={`text-[9px] font-mono ${isSelected ? 'text-white/90' : 'text-ios-blue'}`}>
                      {route.xingzheRoadbookId}
                    </span>
                  </div>
                  <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : ''}`} title={route.name}>
                    {route.name.split('-')[0].replace('宁波', '').replace('德清', '').replace('舟山', '').replace('安吉', '')}
                  </div>
                </div>

                <div className={`flex items-center justify-between text-[10px] font-mono mt-2 pt-1.5 border-t ${
                  isSelected
                    ? 'border-white/20 text-white/80'
                    : 'border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400'
                }`}>
                  <span>{route.distanceKm}km</span>
                  <span className={isSelected ? 'text-amber-200 font-bold' : 'text-ios-orange font-semibold'}>+{route.elevationGainM}m</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Map Area */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索定位地名/山峰 (如: 杭州西湖, 莫干山, 雁荡山)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                className="w-full bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-ios-blue shadow-xs"
              />
            </div>
            <button
              onClick={handleSearchLocation}
              disabled={isSearching}
              className="px-4 py-2.5 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-2xl text-xs font-semibold shadow-ios-sm shrink-0 transition apple-touch"
            >
              {isSearching ? '搜索中...' : '定位'}
            </button>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="ios-card p-2 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-96 rounded-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden"></div>
          </div>
        </div>

        {/* Right Route Stats & Elevation Profile */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Distance & Elevation Stats */}
          <div className="grid grid-cols-3 gap-3">
            <IOSMetricTile
              label="全程总距离"
              value={routeStats.totalDistKm}
              unit="km"
              subtext={`${waypoints.length} 个航迹点`}
              theme="blue"
            />
            <IOSMetricTile
              label="累计爬升"
              value={`+${routeStats.totalClimbM}`}
              unit="m"
              subtext="坡度海拔增益"
              theme="green"
            />
            <IOSMetricTile
              label="累计下降"
              value={`-${routeStats.totalDescentM}`}
              unit="m"
              subtext="下坡缓释段"
              theme="amber"
            />
          </div>

          {/* Elevation Profile Chart with Hover Sync */}
          <div className="ios-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-ios-blue" />
                全路段海拔剖面与地图悬浮联动
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">*悬浮联动地图坐标</span>
            </div>

            <div className="h-48">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  onHover: handleChartHover,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      titleColor: '#38bdf8',
                      bodyColor: '#f8fafc',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderWidth: 1,
                      padding: 8
                    }
                  },
                  scales: {
                    x: { grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: '海拔 (m)' } }
                  }
                }}
              />
            </div>
          </div>

          {/* Waypoints List with Move/Delete Operations */}
          <div className="ios-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800 dark:text-white">航点序列明细:</span>
              <span className="text-slate-500 text-[11px]">可调整顺序或重命名</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {waypoints.map((w, idx) => (
                <div key={w.id} className="p-2.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 truncate flex-1">
                    <span className="w-5 h-5 rounded-full bg-ios-blue/15 text-ios-blue flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={w.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaypoints(prev => prev.map(item => item.id === w.id ? { ...item, name: val } : item));
                      }}
                      className="bg-transparent text-slate-800 dark:text-white text-xs truncate focus:outline-none focus:text-ios-blue w-full"
                      placeholder={`航点 #${idx + 1}`}
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-ios-blue font-semibold text-[11px]">
                      {w.elevation}m
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveWaypoint(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition apple-touch"
                        title="上移"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveWaypoint(idx, 'down')}
                        disabled={idx === waypoints.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition apple-touch"
                        title="下移"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteWaypoint(w.id)}
                        className="p-1 rounded text-slate-400 hover:text-ios-red transition apple-touch"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
