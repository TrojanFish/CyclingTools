/**
 * PreRideCockpit — Pre-Ride Weather Decision Dashboard
 *
 * Displays a real-time weather & air quality snapshot for the rider's current
 * location with a Cycling Readiness Score, gear advice, risk flags, and
 * quick-action deep links to related tools.
 *
 * Follows Apple HIG dual-platform rules:
 *   - Mobile (<640px): stacked layout, full-width grid
 *   - Desktop (≥640px): compact 6-column metric grid
 *   - All controls: h-9 rounded-xl apple-touch
 *   - Colors: ios-* tokens only
 */

import React, { useState } from 'react';
import {
  CloudSun,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Navigation,
  Leaf,
  ChevronDown,
} from 'lucide-react';
import { usePreRideWeather } from '../../hooks/usePreRideWeather';
import { PRE_RIDE_LOCATIONS, PreRideLocation } from '../../data/preRideLocations';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { prefetchTool } from '../../utils/toolLoader';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreRideCockpitProps {
  onNavigateTool: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TINT_GRADIENT: Record<string, string> = {
  green:  'from-ios-green/10 via-ios-mint/5 to-transparent border-ios-green/25',
  blue:   'from-ios-blue/10 via-ios-purple/5 to-transparent border-ios-blue/25',
  orange: 'from-ios-orange/10 via-amber-500/5 to-transparent border-ios-orange/25',
  red:    'from-ios-red/10 via-rose-500/5 to-transparent border-ios-red/25',
};

const TINT_SCORE_TEXT: Record<string, string> = {
  green:  'text-ios-green',
  blue:   'text-ios-blue',
  orange: 'text-ios-orange',
  red:    'text-ios-red',
};

const TINT_BADGE: Record<string, string> = {
  green:  'bg-ios-green/10 text-ios-green border-ios-green/20',
  blue:   'bg-ios-blue/10 text-ios-blue border-ios-blue/20',
  orange: 'bg-ios-orange/10 text-ios-orange border-ios-orange/20',
  red:    'bg-ios-red/10 text-ios-red border-ios-red/20',
  yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  purple: 'bg-ios-purple/10 text-ios-purple border-ios-purple/20',
  mint:   'bg-ios-mint/10 text-ios-mint border-ios-mint/20',
};

const FLAG_ICON: Record<string, React.ReactNode> = {
  green:  <CheckCircle2 className="w-3 h-3 shrink-0" />,
  blue:   <CheckCircle2 className="w-3 h-3 shrink-0" />,
  mint:   <CheckCircle2 className="w-3 h-3 shrink-0" />,
  yellow: <AlertCircle className="w-3 h-3 shrink-0" />,
  orange: <AlertTriangle className="w-3 h-3 shrink-0" />,
  red:    <XCircle className="w-3 h-3 shrink-0" />,
  purple: <XCircle className="w-3 h-3 shrink-0" />,
};

/** Rotates the Navigation arrow icon to visually show wind direction */
const WindArrow: React.FC<{ deg: number }> = ({ deg }) => (
  <Navigation
    className="w-3.5 h-3.5 shrink-0 inline-block"
    style={{ transform: `rotate(${deg}deg)` }}
  />
);

/** Skeleton placeholder tile while loading */
const SkeletonTile: React.FC = () => (
  <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] animate-pulse">
    <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded mb-2" />
    <div className="h-6 w-10 bg-slate-200 dark:bg-white/10 rounded mb-1.5" />
    <div className="h-2 w-14 bg-slate-200 dark:bg-white/10 rounded" />
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const PreRideCockpit: React.FC<PreRideCockpitProps> = ({ onNavigateTool }) => {
  const { language, convertTemp } = useLanguageAndUnit();
  const isTw = language === 'zh-TW';

  const { data, status, error, selectedLocation, setLocation, requestCurrentLocation, refresh } = usePreRideWeather();

  const [showCityPicker, setShowCityPicker] = useState(false);

  const isLoading = status === 'loading' || status === 'locating';

  // ── City Picker ────────────────────────────────────────────────────────────

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'current-gps') {
      requestCurrentLocation();
      setShowCityPicker(false);
      return;
    }
    const loc = PRE_RIDE_LOCATIONS.find(l => l.id === e.target.value);
    if (loc) {
      setLocation(loc);
      setShowCityPicker(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderMetricTile = (
    label: string,
    valueNode: React.ReactNode,
    subtext: string,
    accentBg: string,
    accentText: string,
    icon: React.ReactNode
  ) => (
    <div className={`group p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]`}>
      <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
        <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</span>
        <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${accentBg} ${accentText}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1 font-mono tabular-nums">
        {valueNode}
      </div>
      <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-tight truncate">
        {subtext}
      </div>
    </div>
  );

  const tempDisplay = (c: number) => {
    const conv = convertTemp(c);
    return <><span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{conv.value}</span><span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{conv.unit}</span></>;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const cur = data?.current;
  const aq  = data?.airQuality;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Location label */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            selectedLocation.isGps
              ? 'bg-ios-green/15 text-ios-green'
              : 'bg-ios-blue/15 text-ios-blue'
          }`}>
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            {selectedLocation.name}
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1 hidden sm:inline">
              · {selectedLocation.desc}
            </span>
          </span>
          {selectedLocation.isGps && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ios-green/10 text-ios-green font-medium border border-ios-green/20 shrink-0">
              GPS 当地
            </span>
          )}
          {data && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden sm:block">
              {cur?.weatherLabel}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* One-click GPS Location button */}
          <button
            type="button"
            onClick={requestCurrentLocation}
            disabled={isLoading}
            className={`h-9 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition apple-touch shadow-ios-sm disabled:opacity-50 ${
              selectedLocation.isGps
                ? 'bg-ios-green/15 text-ios-green border-ios-green/30 hover:bg-ios-green/25 font-semibold'
                : 'bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:text-ios-blue hover:border-ios-blue/40'
            }`}
            aria-label={isTw ? '讀取當地 GPS 天氣' : '读取当地 GPS 天气'}
            title={isTw ? '自動取得目前所在地的即時 GPS 天氣與空氣品質' : '自动读取当前所在地的实时 GPS 天气与空气质量'}
          >
            <Navigation className={`w-3.5 h-3.5 ${status === 'locating' ? 'animate-spin text-ios-blue' : selectedLocation.isGps ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline sm:inline">
              {status === 'locating' ? (isTw ? '定位中...' : '定位中...') : selectedLocation.isGps ? (isTw ? '當地位置' : '当地位置') : (isTw ? '定位我' : '定位我')}
            </span>
          </button>

          {/* City selector */}
          <div className="relative">
            <select
              value={selectedLocation.isGps ? 'current-gps' : selectedLocation.id}
              onChange={handleCityChange}
              onClick={() => setShowCityPicker(true)}
              className="h-9 pl-2.5 pr-7 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-ios-blue appearance-none cursor-pointer apple-touch shadow-ios-sm"
              aria-label={isTw ? '切換城市' : '切换城市'}
            >
              {selectedLocation.isGps && (
                <option value="current-gps">
                  📍 {selectedLocation.name} ({isTw ? '目前定位' : '当前定位'})
                </option>
              )}
              {PRE_RIDE_LOCATIONS.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {isTw && loc.nameTw ? loc.nameTw : loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh button */}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="h-9 w-9 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-ios-blue dark:hover:text-ios-blue hover:border-ios-blue/40 transition apple-touch shadow-ios-sm disabled:opacity-40"
            aria-label={isTw ? '刷新氣象' : '刷新气象'}
            title={isTw ? '刷新氣象數據' : '刷新气象数据'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-ios-blue' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Readiness Score Banner / Locating Banner ──────────────────────── */}
      {status === 'locating' ? (
        <div className="rounded-2xl border p-4 bg-ios-blue/5 border-ios-blue/20 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ios-blue/15 text-ios-blue flex items-center justify-center shrink-0">
              <Navigation className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {isTw ? '正在自動讀取您當地的 GPS 精準氣象...' : '正在自动读取您当地的 GPS 精准气象...'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isTw ? '獲取經緯度、即時風向、降水機率及 AQI 空氣品質' : '获取精准经纬度、实时风向、降水概率及 AQI 空气质量'}
              </p>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border p-4 bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/10" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-48 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
          </div>
        </div>
      ) : data ? (
        <div className={`rounded-2xl border bg-gradient-to-r ${TINT_GRADIENT[data.readinessTint]} p-4 sm:p-4`}>
          <div className="flex items-start gap-3">
            {/* Score circle */}
            <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center border-2 ${
              data.readinessTint === 'green'  ? 'border-ios-green/40 bg-ios-green/10' :
              data.readinessTint === 'blue'   ? 'border-ios-blue/40 bg-ios-blue/10' :
              data.readinessTint === 'orange' ? 'border-ios-orange/40 bg-ios-orange/10' :
              'border-ios-red/40 bg-ios-red/10'
            }`}>
              <span className={`text-lg sm:text-xl font-bold tabular-nums font-mono leading-none ${TINT_SCORE_TEXT[data.readinessTint]}`}>
                {data.readinessScore}
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">分</span>
            </div>

            {/* Label & advice */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm sm:text-base font-bold ${TINT_SCORE_TEXT[data.readinessTint]}`}>
                  {data.readinessLabel}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${TINT_BADGE[data.readinessTint]}`}>
                  {isTw ? '出騎決策' : '出骑决策'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                <span className="font-semibold">{isTw ? '穿著建議: ' : '穿衣建议: '}</span>
                {data.gearAdvice}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold">{isTw ? '補水: ' : '补水: '}</span>
                {data.hydrationAdvice}
              </p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-ios-red/20 bg-ios-red/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-ios-red shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{isTw ? '氣象數據獲取失敗' : '气象数据获取失败'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        </div>
      ) : null}

      {/* ── 6-Metric Tile Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i} />)
        ) : cur && aq ? (
          <>
            {/* Temperature */}
            {renderMetricTile(
              isTw ? '氣溫 / 體感' : '气温 / 体感',
              tempDisplay(cur.temp),
              `${isTw ? '體感' : '体感'} ${convertTemp(cur.feelsLike).formatted}`,
              'bg-ios-orange/10 dark:bg-ios-orange/20',
              'text-ios-orange',
              <Thermometer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}

            {/* Wind */}
            {renderMetricTile(
              isTw ? '風速 / 陣風' : '风速 / 阵风',
              <>
                <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{cur.windSpeedKmh}</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">km/h</span>
              </>,
              `${cur.windDirectionLabel}风 · 阵风 ${cur.windGustKmh}`,
              'bg-ios-blue/10 dark:bg-ios-blue/20',
              'text-ios-blue',
              <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}

            {/* Precipitation */}
            {renderMetricTile(
              isTw ? '降水概率' : '降水概率',
              <>
                <span className={`text-xl sm:text-3xl font-bold tracking-tight tabular-nums ${cur.precipProb >= 60 ? 'text-ios-orange' : cur.precipProb >= 40 ? 'text-yellow-500 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>{cur.precipProb}</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">%</span>
              </>,
              cur.precipProb < 20 ? (isTw ? '全程無雨' : '全程无雨') : cur.precipProb < 60 ? (isTw ? '有雨可能' : '有雨可能') : (isTw ? '降雨預警' : '降雨预警'),
              cur.precipProb >= 60 ? 'bg-ios-orange/10 dark:bg-ios-orange/20' : 'bg-ios-blue/10 dark:bg-ios-blue/20',
              cur.precipProb >= 60 ? 'text-ios-orange' : 'text-ios-blue',
              <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}

            {/* AQI */}
            {renderMetricTile(
              'AQI · PM2.5',
              <>
                <span className={`text-xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                  aq.aqiColorToken === 'green'  ? 'text-ios-green' :
                  aq.aqiColorToken === 'yellow' ? 'text-yellow-500 dark:text-yellow-400' :
                  aq.aqiColorToken === 'orange' ? 'text-ios-orange' :
                  aq.aqiColorToken === 'purple' ? 'text-ios-purple' :
                  'text-ios-red'
                }`}>{aq.aqi}</span>
              </>,
              `${aq.aqiLabel} · PM2.5: ${aq.pm25}μg`,
              aq.aqiColorToken === 'green' ? 'bg-ios-green/10 dark:bg-ios-green/20' :
              aq.aqiColorToken === 'orange' ? 'bg-ios-orange/10 dark:bg-ios-orange/20' :
              aq.aqiColorToken === 'red' || aq.aqiColorToken === 'purple' ? 'bg-ios-red/10 dark:bg-ios-red/20' :
              'bg-yellow-500/10 dark:bg-yellow-500/20',
              aq.aqiColorToken === 'green' ? 'text-ios-green' :
              aq.aqiColorToken === 'orange' ? 'text-ios-orange' :
              aq.aqiColorToken === 'red' || aq.aqiColorToken === 'purple' ? 'text-ios-red' :
              'text-yellow-600 dark:text-yellow-400',
              <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}

            {/* UV Index */}
            {renderMetricTile(
              isTw ? '紫外線指數' : '紫外线指数',
              <>
                <span className={`text-xl sm:text-3xl font-bold tracking-tight tabular-nums ${cur.uvIndex >= 8 ? 'text-ios-red' : cur.uvIndex >= 6 ? 'text-ios-orange' : 'text-slate-900 dark:text-white'}`}>
                  {cur.uvIndex}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">UV</span>
              </>,
              cur.uvIndex >= 8 ? (isTw ? '強烈·需防曬' : '强烈·需防晒') : cur.uvIndex >= 4 ? (isTw ? '中等防晒' : '中等防晒') : (isTw ? '溫和' : '温和'),
              cur.uvIndex >= 6 ? 'bg-ios-orange/10 dark:bg-ios-orange/20' : 'bg-ios-orange/10 dark:bg-ios-orange/20',
              'text-ios-orange',
              <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}

            {/* Humidity */}
            {renderMetricTile(
              isTw ? '相對濕度' : '相对湿度',
              <>
                <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">{cur.humidity}</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">%</span>
              </>,
              cur.humidity > 80 ? (isTw ? '潮濕悶熱' : '潮湿闷热') : cur.humidity < 30 ? (isTw ? '乾燥補水' : '干燥补水') : (isTw ? '適中' : '适中'),
              'bg-ios-mint/10 dark:bg-ios-mint/20',
              'text-ios-mint',
              <CloudSun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
          </>
        ) : null}
      </div>

      {/* ── Risk Flags Row ───────────────────────────────────────────────── */}
      {data && data.riskFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.riskFlags.map((flag, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${TINT_BADGE[flag.tint] ?? TINT_BADGE['blue']}`}
            >
              {FLAG_ICON[flag.tint] ?? FLAG_ICON['blue']}
              {flag.label}
            </span>
          ))}
        </div>
      )}

      {/* ── Wind Direction Visual ────────────────────────────────────────── */}
      {cur && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <WindArrow deg={cur.windDirectionDeg} />
          <span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{cur.windDirectionLabel}风</span>
            {' '}{cur.windSpeedKmh} km/h
            {cur.windGustKmh > cur.windSpeedKmh + 5 && (
              <> · {isTw ? '陣風' : '阵风'} <span className="font-semibold">{cur.windGustKmh}</span> km/h</>
            )}
          </span>
          <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
          <span className={`font-mono font-semibold ${
            aq && (aq.aqiColorToken === 'green' ? 'text-ios-green' :
            aq.aqiColorToken === 'yellow' ? 'text-yellow-500 dark:text-yellow-400' :
            aq.aqiColorToken === 'orange' ? 'text-ios-orange' :
            'text-ios-red')
          }`}>
            {aq && `AQI ${aq.aqi} (${aq.aqiLabel})`}
          </span>
        </div>
      )}

      {/* ── Quick-Link Action Buttons ─────────────────────────────────────── */}
      <div className="pt-0.5 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onNavigateTool('weather-advisor')}
          onMouseEnter={() => prefetchTool('weather-advisor')}
          onTouchStart={() => prefetchTool('weather-advisor')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-ios-mint text-slate-950 text-xs font-bold shadow-ios-sm hover:bg-ios-mint/90 active:scale-95 transition apple-touch"
        >
          <CloudSun className="w-4 h-4" />
          <span>{isTw ? '路線氣象推演' : '路线气象推演'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onNavigateTool('tire-pressure')}
          onMouseEnter={() => prefetchTool('tire-pressure')}
          onTouchStart={() => prefetchTool('tire-pressure')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition apple-touch text-xs font-semibold shadow-ios-sm"
        >
          <span>{isTw ? '胎壓推薦' : '胎压推荐'}</span>
        </button>

        <button
          onClick={() => onNavigateTool('training-calendar')}
          onMouseEnter={() => prefetchTool('training-calendar')}
          onTouchStart={() => prefetchTool('training-calendar')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition apple-touch text-xs font-semibold shadow-ios-sm"
        >
          <span>{isTw ? '今日訓練計劃' : '今日训练计划'}</span>
        </button>
      </div>

      {/* ── Data timestamp footer ────────────────────────────────────────── */}
      {data && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          {isTw ? '數據更新: ' : '数据更新: '}
          {new Date(data.fetchedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          {isTw ? '每 20 分鐘自動刷新' : '每 20 分钟自动刷新'}
        </p>
      )}
    </div>
  );
};
