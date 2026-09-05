import React, { useState, useEffect, useRef } from 'react';
import { CloudSun, Wind, Navigation, AlertTriangle, Droplets, Sun, Compass, Play, ArrowRight, ShieldCheck, Thermometer, MapPin, Download, Upload, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';
import { ZHEJIANG_XINGZHE_ROUTES } from '../../data/zhejiangRoutes';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

interface SegmentWeather {
  pointIndex: number;
  lat: number;
  lng: number;
  distanceKm: number;
  estimatedTimeStr: string;
  temp: number;
  feelsLike: number;
  precipProb: number;
  humidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windRelation: string;
  uvIndex: number;
}

export const CyclingWeatherAdvisor: React.FC = () => {
  const { showToast } = useToast();
  const { unitSystem } = useLanguageAndUnit();
  const isImperial = unitSystem === 'imperial';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [customRouteName, setCustomRouteName] = useState<string>('西湖龙井起伏路线');
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>(
    ZHEJIANG_XINGZHE_ROUTES[0].waypoints.map(w => ({ lat: w.lat, lng: w.lng, name: w.name }))
  );

  const [departureTime, setDepartureTime] = useState<string>('07:30');
  const [avgSpeedKmh, setAvgSpeedKmh] = useState<number>(25);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [weatherSegments, setWeatherSegments] = useState<SegmentWeather[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.22, 120.15],
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      setRoutePoints(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng, name: `航点 #${prev.length + 1}` }]);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    if (routePoints.length >= 2) {
      const latLngs = routePoints.map(p => [p.lat, p.lng] as [number, number]);
      const polyline = L.polyline(latLngs, {
        color: '#00AFFF',
        weight: 4,
        opacity: 0.85
      }).addTo(map);
      routePolylineRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }
  }, [routePoints]);

  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);
    return ((theta * 180) / Math.PI + 360) % 360;
  };

  const getWindRelation = (ridingBearing: number, windFromDeg: number) => {
    const diff = Math.abs(ridingBearing - windFromDeg) % 360;
    const angle = diff > 180 ? 360 - diff : diff;
    if (angle <= 45) return '💨 强烈顶风 (Headwind)';
    if (angle <= 80) return '💨 侧顶风 (Cross-Headwind)';
    if (angle <= 100) return '💨 垂直侧风 (Crosswind)';
    if (angle <= 135) return '🚀 侧顺风 (Cross-Tailwind)';
    return '🚀 顺风推进 (Tailwind)';
  };

  // Handle Manual GPX / TCX Route File Upload
  const handleGpxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        
        // Find trackpoints in GPX or TCX
        let trkpts = xmlDoc.getElementsByTagName('trkpt');
        if (trkpts.length === 0) {
          trkpts = xmlDoc.getElementsByTagName('rtept');
        }
        if (trkpts.length === 0) {
          trkpts = xmlDoc.getElementsByTagName('Trackpoint');
        }

        if (trkpts.length === 0) {
          showToast('未在文件中找到有效的路线轨迹点！', 'error', '请确认上传的是标准 .gpx / .tcx 路线文件');
          return;
        }

        const rawPoints: RoutePoint[] = [];
        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          let lat = 0;
          let lng = 0;

          if (pt.getAttribute('lat')) {
            lat = parseFloat(pt.getAttribute('lat') || '0');
            lng = parseFloat(pt.getAttribute('lon') || '0');
          } else {
            const pos = pt.getElementsByTagName('Position')[0];
            if (pos) {
              const latNode = pos.getElementsByTagName('LatitudeDegrees')[0];
              const lngNode = pos.getElementsByTagName('LongitudeDegrees')[0];
              if (latNode && lngNode) {
                lat = parseFloat(latNode.textContent || '0');
                lng = parseFloat(lngNode.textContent || '0');
              }
            }
          }

          if (lat && lng) {
            rawPoints.push({ lat, lng });
          }
        }

        if (rawPoints.length === 0) {
          showToast('无法解析坐标经纬度数据！', 'error');
          return;
        }

        // Downsample to 12~24 evenly spaced sampling waypoints for high accuracy & responsive API query
        const targetCount = Math.min(24, Math.max(8, Math.floor(rawPoints.length / 8)));
        const sampledPoints: RoutePoint[] = [];
        const step = Math.max(1, Math.floor(rawPoints.length / targetCount));

        for (let i = 0; i < rawPoints.length; i += step) {
          sampledPoints.push({
            lat: rawPoints[i].lat,
            lng: rawPoints[i].lng,
            name: i === 0 ? '出发起点' : `沿途航点 #${sampledPoints.length + 1}`
          });
        }
        if (rawPoints.length > 1 && sampledPoints[sampledPoints.length - 1] !== rawPoints[rawPoints.length - 1]) {
          sampledPoints.push({
            lat: rawPoints[rawPoints.length - 1].lat,
            lng: rawPoints[rawPoints.length - 1].lng,
            name: '终点目的地'
          });
        }

        setRoutePoints(sampledPoints);
        const parsedName = file.name.replace(/\.[^/.]+$/, '');
        setCustomRouteName(parsedName);
        setSelectedRouteId('custom');
        showToast('GPX 路线导入成功！', 'success', `成功解析 ${rawPoints.length} 个轨迹点，已生成 ${sampledPoints.length} 个气象监测断面`);
      } catch (err) {
        showToast('文件解析失败，请检查文件格式！', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const fetchWeatherAdvice = async () => {
    if (routePoints.length < 2) {
      alert('请至少在地图上选定 2 个路段航点！');
      return;
    }

    setIsLoading(true);
    try {
      let accumulatedDistanceKm = 0;
      const segmentsToQuery: { pt: RoutePoint; distKm: number; bearing: number }[] = [];

      for (let i = 0; i < routePoints.length; i++) {
        const curr = routePoints[i];
        let bearing = 90;
        if (i > 0) {
          const prev = routePoints[i - 1];
          const p1 = L.latLng(prev.lat, prev.lng);
          const p2 = L.latLng(curr.lat, curr.lng);
          accumulatedDistanceKm += p1.distanceTo(p2) / 1000;
          bearing = calculateBearing(prev.lat, prev.lng, curr.lat, curr.lng);
        }
        segmentsToQuery.push({
          pt: curr,
          distKm: parseFloat(accumulatedDistanceKm.toFixed(1)),
          bearing
        });
      }

      // Query Open-Meteo Forecast API
      const [depHour, depMin] = departureTime.split(':').map(Number);
      const departureDate = new Date();
      departureDate.setHours(depHour || 7, depMin || 30, 0, 0);

      const segmentResults: SegmentWeather[] = [];

      for (let i = 0; i < segmentsToQuery.length; i++) {
        const seg = segmentsToQuery[i];
        const elapsedHours = seg.distKm / Math.max(10, avgSpeedKmh);
        const arrivalDate = new Date(departureDate.getTime() + elapsedHours * 3600 * 1000);
        const arrivalHour = arrivalDate.getHours();

        const timeStr = `${arrivalHour.toString().padStart(2, '0')}:${arrivalDate.getMinutes().toString().padStart(2, '0')}`;

        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${seg.pt.lat.toFixed(4)}&longitude=${seg.pt.lng.toFixed(4)}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,wind_direction_10m,uv_index&timezone=auto`
          );
          const data = await res.json();
          const hourly = data.hourly;

          if (hourly && hourly.temperature_2m) {
            const temp = Math.round(hourly.temperature_2m[arrivalHour] ?? 22);
            const feelsLike = Math.round(hourly.apparent_temperature[arrivalHour] ?? temp);
            const precipProb = Math.round(hourly.precipitation_probability[arrivalHour] ?? 0);
            const humidity = Math.round(hourly.relative_humidity_2m[arrivalHour] ?? 60);
            const windSpeedKmh = Math.round(hourly.wind_speed_10m[arrivalHour] ?? 12);
            const windDirectionDeg = Math.round(hourly.wind_direction_10m[arrivalHour] ?? 90);
            const uvIndex = Math.round(hourly.uv_index[arrivalHour] ?? 4);

            const windRel = getWindRelation(seg.bearing, windDirectionDeg);

            segmentResults.push({
              pointIndex: i,
              lat: seg.pt.lat,
              lng: seg.pt.lng,
              distanceKm: seg.distKm,
              estimatedTimeStr: timeStr,
              temp,
              feelsLike,
              precipProb,
              humidity,
              windSpeedKmh,
              windDirectionDeg,
              windRelation: windRel,
              uvIndex
            });
          }
        } catch (e) {
          // Fallback simulation
          segmentResults.push({
            pointIndex: i,
            lat: seg.pt.lat,
            lng: seg.pt.lng,
            distanceKm: seg.distKm,
            estimatedTimeStr: timeStr,
            temp: 24,
            feelsLike: 25,
            precipProb: 10,
            humidity: 65,
            windSpeedKmh: 14,
            windDirectionDeg: 120,
            windRelation: getWindRelation(seg.bearing, 120),
            uvIndex: 5
          });
        }
      }

      setWeatherSegments(segmentResults);
      showToast('沿途气象顾问分析完毕！', 'success', `已推演全程 ${segmentsToQuery.length} 个断面的天气与风向`);
    } catch (err) {
      showToast('气象数据获取异常，请检查网络！', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedRouteId, setSelectedRouteId] = useState<string>(ZHEJIANG_XINGZHE_ROUTES[0].id);

  const loadPresetRoute = (routeId: string) => {
    const found = ZHEJIANG_XINGZHE_ROUTES.find(r => r.id === routeId);
    if (found) {
      setSelectedRouteId(found.id);
      setCustomRouteName(found.name);
      setRoutePoints(found.waypoints.map(w => ({ lat: w.lat, lng: w.lng, name: w.name })));
      showToast(`已载入路书: ${found.name}`, 'info');
    }
  };

  // Weather overview summary
  const maxTemp = weatherSegments.length ? Math.max(...weatherSegments.map(s => s.temp)) : 25;
  const maxUv = weatherSegments.length ? Math.max(...weatherSegments.map(s => s.uvIndex)) : 5;

  const displayAvgSpeed = isImperial ? Math.round(avgSpeedKmh * 0.621371) : avgSpeedKmh;
  const handleAvgSpeedChange = (val: number) => {
    setAvgSpeedKmh(isImperial ? Math.round((val / 0.621371) * 10) / 10 : val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <CloudSun className="w-3.5 h-3.5" />
              高精度气象与风向研判
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">骑行天气与路线气象顾问</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              结合实时气象与顺逆风判定，精准计算沿途各路段到达时刻的气温、降雨概率、风阻及出行穿衣建议。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 cursor-pointer transition shadow-xs">
              <Upload className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span>导入 GPX / TCX 路线</span>
              <input type="file" accept=".gpx,.tcx,.xml" onChange={handleGpxUpload} className="hidden" />
            </label>

            <button
              onClick={fetchWeatherAdvice}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-sm transition shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              {isLoading ? '正在获取沿途气象...' : '生成全路段天气顾问'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs & Map */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                路线与出发参数
              </h2>
              <span className="text-xs text-cyan-600 dark:text-cyan-400 font-mono font-medium truncate max-w-[180px]" title={customRouteName}>
                {customRouteName}
              </span>
            </div>

            {/* Departure Time & Speed */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">计划出发时间</label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-600 dark:text-cyan-400 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  预计均速 ({isImperial ? 'mph' : 'km/h'})
                </label>
                <input
                  type="number"
                  value={displayAvgSpeed}
                  onChange={(e) => handleAvgSpeedChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">行者精选·浙江经典实测路线:</span>
                <label className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 cursor-pointer font-medium flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  自定义 GPX
                  <input type="file" accept=".gpx,.tcx,.xml" onChange={handleGpxUpload} className="hidden" />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ZHEJIANG_XINGZHE_ROUTES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => loadPresetRoute(r.id)}
                    className={`px-2 py-1.5 rounded-lg border text-left text-xs transition ${
                      selectedRouteId === r.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate block font-medium">{r.name.split('-')[0].replace('宁波', '').replace('德清', '').replace('舟山', '').replace('安吉', '')}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                      {isImperial ? `${Math.round(r.distanceKm * 0.621371)}mi` : `${r.distanceKm}km`} | {r.city}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Map Canvas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>在地图上点击添加/微调路线航点</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">{routePoints.length} 个航点</span>
              </div>
              <div ref={mapContainerRef} className="w-full h-72 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner"></div>
            </div>
          </div>
        </div>

        {/* Right Segment Weather Details */}
        <div className="lg:col-span-7 space-y-6">
          {weatherSegments.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <CloudSun className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">暂无路段气象数据</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                请在左侧设定出发时间与均速，点击上方「生成全路段天气顾问」按钮获取实时气象分析。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cycling Gear & Hydration Recommendations Card */}
              <div className="glass-panel p-4 rounded-xl border border-cyan-200 dark:border-slate-800 bg-cyan-500/10 dark:bg-cyan-950/20 flex items-start gap-3 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-cyan-700 dark:text-cyan-300 block">智能装备与补水补给建议</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    全程最高气温约 <strong>{isImperial ? `${Math.round(maxTemp * 9/5 + 32)}°F` : `${maxTemp}°C`}</strong>，紫外线峰值 <strong>UV {maxUv}</strong>。
                    {maxTemp > 28 ? '建议携带双水壶，每小时饮水补给 600~800ml 并补充电解质泡腾片。' : '气温舒适，建议每小时补充 500ml 水分。'}
                    {maxUv >= 6 ? ' 紫外线较强，请涂抹 SPF50+ 运动防晒霜或穿戴冰丝袖套。' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {weatherSegments.map((seg) => (
                  <div key={seg.pointIndex} className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                          {seg.pointIndex}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                          {seg.distanceKm === 0 ? '出发起点' : `路程 ${isImperial ? `${(seg.distanceKm * 0.621371).toFixed(1)} mi` : `${seg.distanceKm} km`} 处`}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          预计 {seg.estimatedTimeStr} 到达
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                        {seg.windRelation}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">气温 / 体感</span>
                          <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold">
                            {isImperial
                              ? `${Math.round(seg.temp * 9/5 + 32)}°F / ${Math.round(seg.feelsLike * 9/5 + 32)}°F`
                              : `${seg.temp}°C / ${seg.feelsLike}°C`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">风速风向</span>
                          <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold">
                            {isImperial
                              ? `${Math.round(seg.windSpeedKmh * 0.621371)} mph`
                              : `${seg.windSpeedKmh} km/h`} ({seg.windDirectionDeg}°)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">湿度 / 降水率</span>
                          <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold">{seg.humidity}% / {seg.precipProb}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">紫外线指数</span>
                          <span className="text-slate-900 dark:text-slate-200 font-mono font-semibold">UV {seg.uvIndex} ({seg.uvIndex >= 6 ? '强' : '中等'})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
