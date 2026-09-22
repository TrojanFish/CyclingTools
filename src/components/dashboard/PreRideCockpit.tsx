/**
 * PreRideCockpit — Pre-Ride Weather Decision Dashboard
 *
 * Slim, unified pre-ride weather dashboard strictly aligned with the Post-Ride
 * debrief card:
 *   - Strictly 1 single row for top status bar (badge + search location button + GPS + refresh)
 *   - Precise location display (City + District, e.g. "杭州 · 拱墅区")
 *   - Global & domestic location search via LocationSearchModal (replaces static dropdown)
 *   - 2 columns on mobile (<640px), 3 on tablet, 6 on desktop (matching Post-Ride debrief)
 *   - Unified height (~380px) to eliminate layout shift upon dual-mode switching
 *   - Zero data redundancy
 *   - 3 single-row action buttons (no awkward line breaks)
 *   - Full Apple HIG compliance
 */

import React, { useState } from 'react';
import {
  CloudSun,
  Gauge,
  Dumbbell,
  RefreshCw,
  AlertTriangle,
  Navigation,
  ChevronDown,
  Search,
} from 'lucide-react';
import { usePreRideWeather } from '../../hooks/usePreRideWeather';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { prefetchTool } from '../../utils/toolLoader';
import { LocationSearchModal } from './LocationSearchModal';

interface PreRideCockpitProps {
  onNavigateTool: (id: string) => void;
}

const TINT_BADGE: Record<string, string> = {
  green:  'bg-ios-green/10 text-ios-green border-ios-green/20',
  blue:   'bg-ios-blue/10 text-ios-blue border-ios-blue/20',
  orange: 'bg-ios-orange/10 text-ios-orange border-ios-orange/20',
  red:    'bg-ios-red/10 text-ios-red border-ios-red/20',
};

const TINT_DOT: Record<string, string> = {
  green:  'bg-ios-green',
  blue:   'bg-ios-blue',
  orange: 'bg-ios-orange',
  red:    'bg-ios-red',
};

const TINT_SCORE_TEXT: Record<string, string> = {
  green:  'text-ios-green',
  blue:   'text-ios-blue',
  orange: 'text-ios-orange',
  red:    'text-ios-red',
};

export const PreRideCockpit: React.FC<PreRideCockpitProps> = ({ onNavigateTool }) => {
  const { language, convertTemp } = useLanguageAndUnit();
  const isTw = language === 'zh-TW';

  const {
    data,
    status,
    error,
    selectedLocation,
    setLocation,
    requestCurrentLocation,
    refresh
  } = usePreRideWeather();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const isLoading = status === 'loading' || status === 'locating';

  const cur = data?.current;
  const aq = data?.airQuality;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── 1. Top Status Row (Strictly 1 single horizontal row on mobile and desktop) ── */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        {/* Left: Readiness Score Tag */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold tracking-wide shrink-0 ${
          data ? TINT_BADGE[data.readinessTint] : 'bg-ios-mint/10 text-ios-mint border-ios-mint/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            data ? TINT_DOT[data.readinessTint] : 'bg-ios-mint'
          }`} />
          <span>
            {data ? (
              <>
                <span className="sm:hidden">{data.readinessScore}分 · {data.readinessLabel.replace('出骑时机', '').replace('骑行', '')}</span>
                <span className="hidden sm:inline">{data.readinessScore}分 · {data.readinessLabel}</span>
              </>
            ) : (isTw ? '適宜度計算中' : '适宜度计算中')}
          </span>
        </span>

        {/* Right: Location Search Pill + Quick GPS Re-center + Refresh (Shrink-proof single row) */}
        <div className="flex items-center gap-1 shrink-0 min-w-0">
          {/* Location Search Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="h-7 pl-2 pr-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition apple-touch max-w-[100px] xs:max-w-[125px] sm:max-w-[180px] min-w-0"
            title={isTw ? '點擊搜尋城市或區縣' : '点击搜索城市或区县'}
            aria-label={isTw ? '搜尋地點' : '搜索地点'}
          >
            <Search className="w-3 h-3 text-ios-mint shrink-0" />
            <span className="truncate">{selectedLocation.name}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
          </button>

          {/* GPS Quick Relocate Button */}
          <button
            type="button"
            onClick={requestCurrentLocation}
            disabled={isLoading}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition apple-touch shrink-0 disabled:opacity-50 ${
              selectedLocation.isGps
                ? 'bg-ios-mint/20 text-ios-mint border border-ios-mint/30'
                : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-ios-mint'
            }`}
            title={isTw ? '使用目前 GPS 定位' : '使用当前 GPS 精准定位'}
            aria-label={isTw ? '定位我' : '定位我'}
          >
            <Navigation className={`w-3.5 h-3.5 ${status === 'locating' ? 'animate-spin text-ios-mint' : selectedLocation.isGps ? 'fill-current' : ''}`} />
          </button>

          {/* Weather Refresh Button */}
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="h-7 w-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-ios-mint transition apple-touch shrink-0 disabled:opacity-40"
            title={isTw ? '刷新氣象數據' : '刷新气象数据'}
            aria-label={isTw ? '刷新' : '刷新'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-ios-mint' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 2. Headline & Dynamic Advice (Mirrors Title & Vehicle Info) ── */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white font-display flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="truncate max-w-[210px] sm:max-w-none">{selectedLocation.name} · {cur?.weatherLabel || (isTw ? '環境研判' : '环境研判')}</span>
          {selectedLocation.isGps && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ios-mint/15 text-ios-mint font-semibold border border-ios-mint/30 shrink-0">
              GPS 当地
            </span>
          )}
          {data && (
            <span className={`text-base font-bold tabular-nums font-mono shrink-0 ${TINT_SCORE_TEXT[data.readinessTint]}`}>
              ({data.readinessScore}分)
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{isTw ? '穿著: ' : '穿衣: '}</span>
          {data?.gearAdvice || (isTw ? '舒適排汗騎行服' : '舒适排汗骑行服')}
          <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{isTw ? '補水: ' : '补水: '}</span>
          {data?.hydrationAdvice || (isTw ? '每小時約 500ml' : '每小时约 500ml')}
        </p>
      </div>

      {/* ── 3. 6-Grid Tactical Metrics (2 cols mobile, 3 cols tablet, 6 cols desktop — identical to Post-Ride debrief) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-0.5">
        {/* Tile 1: 气温 / 体感 */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{isTw ? '氣溫 / 體感' : '气温 / 体感'}</div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums font-mono mt-0.5">
            {cur ? convertTemp(cur.temp).value : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">{convertTemp(20).unit}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {isTw ? '體感' : '体感'} {cur ? convertTemp(cur.feelsLike).formatted : '--'}
          </div>
        </div>

        {/* Tile 2: 风向 / 阵风 */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{isTw ? '風速 / 陣風' : '风速 / 阵风'}</div>
          <div className="text-base sm:text-lg font-bold text-ios-blue tabular-nums font-mono mt-0.5">
            {cur ? cur.windSpeedKmh : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">km/h</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {cur ? `${cur.windDirectionLabel}风 · 阵风${cur.windGustKmh}` : (isTw ? '實時風向' : '实时风向')}
          </div>
        </div>

        {/* Tile 3: 降水概率 */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{isTw ? '降水概率' : '降水概率'}</div>
          <div className={`text-base sm:text-lg font-bold tabular-nums font-mono mt-0.5 ${
            cur && cur.precipProb >= 50 ? 'text-ios-orange' : 'text-slate-900 dark:text-white'
          }`}>
            {cur ? cur.precipProb : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {cur ? (cur.precipProb < 20 ? (isTw ? '未來無雨' : '未来无雨') : cur.precipProb < 50 ? (isTw ? '微小概率' : '微小概率') : (isTw ? '降雨預警' : '降雨预警')) : (isTw ? '降雨機率' : '降雨概率')}
          </div>
        </div>

        {/* Tile 4: 空气质量 AQI */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{isTw ? '空氣質量 AQI' : '空气质量 AQI'}</div>
          <div className={`text-base sm:text-lg font-bold tabular-nums font-mono mt-0.5 ${
            aq?.aqiColorToken === 'green' ? 'text-ios-green' :
            aq?.aqiColorToken === 'orange' ? 'text-ios-orange' :
            aq?.aqiColorToken === 'red' || aq?.aqiColorToken === 'purple' ? 'text-ios-red' :
            'text-yellow-500 dark:text-yellow-400'
          }`}>
            {aq ? aq.aqi : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              {aq?.aqiLabel || ''}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            PM2.5: {aq ? `${aq.pm25}μg` : '--'}
          </div>
        </div>

        {/* Tile 5: 紫外线 UV */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{isTw ? '紫外線 UV' : '紫外线 UV'}</div>
          <div className={`text-base sm:text-lg font-bold tabular-nums font-mono mt-0.5 ${
            cur && cur.uvIndex >= 6 ? 'text-ios-orange' : 'text-slate-900 dark:text-white'
          }`}>
            {cur ? cur.uvIndex : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">UV</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {cur ? (cur.uvIndex >= 8 ? (isTw ? '強防護必備' : '强防护必备') : cur.uvIndex >= 4 ? (isTw ? '中等需防曬' : '中等需防晒') : (isTw ? '溫和微弱' : '温和微弱')) : (isTw ? '防曬評估' : '防晒评估')}
          </div>
        </div>

        {/* Tile 6: 相对湿度 */}
        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{isTw ? '相對濕度' : '相对湿度'}</div>
          <div className="text-base sm:text-lg font-bold text-ios-mint tabular-nums font-mono mt-0.5">
            {cur ? cur.humidity : '--'}{' '}
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">%</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {cur ? (cur.humidity >= 75 ? (isTw ? '潮濕悶熱' : '潮湿闷热') : cur.humidity <= 35 ? (isTw ? '乾燥需補水' : '干燥需补水') : (isTw ? '體感舒適' : '体感舒适')) : (isTw ? '環境濕度' : '环境湿度')}
          </div>
        </div>
      </div>

      {/* ── 4. Quick Action Navigation Buttons (strictly 1 single row on all devices) ── */}
      <div className="pt-1.5 flex items-center gap-2 sm:gap-2.5">
        {/* Button 1: 路线推演 (Primary Prominent Button) */}
        <button
          onClick={() => onNavigateTool('weather-advisor')}
          onMouseEnter={() => prefetchTool('weather-advisor')}
          onTouchStart={() => prefetchTool('weather-advisor')}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 flex-1 sm:flex-initial rounded-xl bg-ios-mint text-slate-950 text-xs font-semibold shadow-ios-sm hover:bg-ios-mint/90 active:scale-95 transition apple-touch whitespace-nowrap"
        >
          <CloudSun className="w-4 h-4 shrink-0" />
          <span>{isTw ? '路線推演' : '路线推演'}</span>
        </button>

        {/* Button 2: 胎压建议 */}
        <button
          onClick={() => onNavigateTool('tire-pressure')}
          onMouseEnter={() => prefetchTool('tire-pressure')}
          onTouchStart={() => prefetchTool('tire-pressure')}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 flex-1 sm:flex-initial rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition apple-touch text-xs font-semibold shadow-ios-sm whitespace-nowrap"
        >
          <Gauge className="w-4 h-4 text-ios-mint shrink-0" />
          <span>{isTw ? '胎壓建議' : '胎压建议'}</span>
        </button>

        {/* Button 3: 训练计划 */}
        <button
          onClick={() => onNavigateTool('training-calendar')}
          onMouseEnter={() => prefetchTool('training-calendar')}
          onTouchStart={() => prefetchTool('training-calendar')}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 flex-1 sm:flex-initial rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition apple-touch text-xs font-semibold shadow-ios-sm whitespace-nowrap"
        >
          <Dumbbell className="w-4 h-4 text-ios-mint shrink-0" />
          <span>{isTw ? '訓練計劃' : '训练计划'}</span>
        </button>
      </div>

      {/* Error / Offline Alert (Non-intrusive) */}
      {error && (
        <div className="p-2.5 rounded-xl bg-ios-red/10 border border-ios-red/20 text-ios-red text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Location Search Modal / Bottom Sheet */}
      <LocationSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentLocation={selectedLocation}
        onSelectLocation={setLocation}
        onRequestGps={requestCurrentLocation}
        isGpsLocating={status === 'locating'}
      />
    </div>
  );
};
