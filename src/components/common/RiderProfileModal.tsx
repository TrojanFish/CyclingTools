import React, { useState } from 'react';
import { useRiderProfile, TeamRider, BikeProfile } from '../../context/RiderProfileContext';
import { useStrava } from '../../context/StravaContext';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import {
  User,
  X,
  RotateCcw,
  Activity,
  ShieldCheck,
  Gauge,
  Globe,
  Sun,
  Moon,
  Smartphone,
  SlidersHorizontal,
  Home,
  Lock,
  Bike,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Zap,
  Flame,
  Award,
  Cloud,
  RefreshCw,
  ExternalLink,
  Key,
  Eye,
  EyeOff,
  Check,
  Database,
  LogOut
} from 'lucide-react';
import { PoweredByStravaBadge } from './PoweredByStravaBadge';
import { NumberStepper } from './NumberStepper';
import { IOSSegmentedControl } from './IOSSegmentedControl';
import {
  ALL_NAV_TOOLS,
  NAV_PRESETS,
  getNavToolById
} from '../../utils/toolNavHelper';

interface RiderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode?: 'system' | 'dark' | 'light';
  setThemeMode?: (mode: 'system' | 'dark' | 'light') => void;
}

export const RiderProfileModal: React.FC<RiderProfileModalProps> = ({
  isOpen,
  onClose,
  themeMode,
  setThemeMode
}) => {
  const {
    profile,
    updateProfile,
    resetProfile,
    roster,
    activeRiderId,
    activeRider,
    switchRider,
    addRider,
    deleteRider,
    updateRider,
    bikes,
    activeBikeId,
    activeBike,
    switchBike,
    addBike,
    deleteBike,
    updateBike,
    navShortcuts,
    setNavShortcut,
    setAllNavShortcuts,
    resetNavShortcuts
  } = useRiderProfile();

  const { unitSystem, setUnitSystem, language, setLanguage } = useLanguageAndUnit();
  const { showToast } = useToast();

  const {
    apiKeys,
    tokenData,
    athlete,
    isConnected: isStravaConnected,
    isSyncing: isStravaSyncing,
    syncProgress: stravaSyncProgress,
    lastSyncTime: stravaLastSyncTime,
    activities: stravaActivities,
    syncSettings: stravaSyncSettings,
    saveApiKeys: saveStravaApiKeys,
    initiateAuth: initiateStravaAuth,
    disconnect: disconnectStrava,
    clearCache: clearStravaCache,
    syncActivities: syncStravaActivities,
    updateSettings: updateStravaSettings
  } = useStrava();

  const [modalTab, setModalTab] = useState<'profile' | 'roster' | 'garage' | 'strava' | 'system'>('profile');
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const [clientIdInput, setClientIdInput] = useState(apiKeys?.clientId || '');
  const [clientSecretInput, setClientSecretInput] = useState(apiKeys?.clientSecret || '');
  const [showSecret, setShowSecret] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    resetProfile();
    resetNavShortcuts();
    showToast(
      language === 'zh-TW'
        ? '車手檔案與底部導航已重置為標準預設值'
        : '车手档案与底部导航已重置为标准默认值',
      'info'
    );
  };

  const isImperial = unitSystem === 'imperial';

  // Imperial weight conversions (1 kg = 2.20462 lbs)
  const currentWeightLbs = parseFloat((profile.weightKg * 2.20462).toFixed(1));
  const currentBikeWeightLbs = parseFloat((profile.bikeWeightKg * 2.20462).toFixed(1));

  // Height feet/inches calculation
  const heightFeet = Math.floor(profile.heightCm / 30.48);
  const heightInches = Math.round((profile.heightCm % 30.48) / 2.54);

  const roleLabelMap: Record<string, { label: string; labelTw: string; color: string }> = {
    gc: { label: '总成绩主将 GC', labelTw: '總成績主將 GC', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    sprinter: { label: '终点冲刺手 Sprinter', labelTw: '終點衝刺手 Sprinter', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
    climber: { label: '纯血爬坡手 Climber', labelTw: '純血爬坡手 Climber', color: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
    rouleur: { label: '计时突围手 TT Specialist', labelTw: '計時突圍手 TT Specialist', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
    domestique: { label: '勤务破风副将 Domestique', labelTw: '勤務破風副將 Domestique', color: 'bg-slate-500/15 text-slate-600 border-slate-500/30' },
    custom: { label: '自定义车手', labelTw: '自訂車手', color: 'bg-purple-500/15 text-purple-600 border-purple-500/30' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-ios-bg-grouped-light dark:bg-[#121214] p-5 sm:p-6 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-ios-popover space-y-4 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-ios-blue/15 text-ios-blue dark:text-ios-blue-dark flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {language === 'zh-TW' ? '車隊管理與車手檔案' : '车队管理与车手档案'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-ios-blue/10 text-ios-blue font-bold">
                  Pro Team
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'zh-TW' ? '多車手/多戰車配置即時聯動全站 18 款計算工具' : '多车手/多战车配置即时联动全站 18 款计算工具'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white apple-touch transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Segmented Navigation Tabs */}
        <IOSSegmentedControl
          options={[
            { id: 'profile', label: language === 'zh-TW' ? '當前數據' : '当前数据', icon: Activity },
            { id: 'roster', label: language === 'zh-TW' ? `車隊 (${roster.length})` : `车队 (${roster.length})`, icon: Users },
            { id: 'garage', label: language === 'zh-TW' ? `戰車 (${bikes.length})` : `战车 (${bikes.length})`, icon: Bike },
            { id: 'strava', label: 'Strava', icon: Cloud, badge: isStravaConnected ? '已连' : undefined },
            { id: 'system', label: language === 'zh-TW' ? '偏好導航' : '偏好导航', icon: SlidersHorizontal }
          ]}
          value={modalTab}
          onChange={(val) => setModalTab(val as any)}
          fullWidth
          size="sm"
        />

        {/* TAB 1: CURRENT ACTIVE PROFILE DETAILS */}
        {modalTab === 'profile' && (
          <div className="space-y-4">
            {/* Active Rider & Bike Hero Card */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between shadow-xs">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {activeRider.name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full border font-semibold ${roleLabelMap[activeRider.role || 'custom']?.color}`}>
                    {language === 'zh-TW' ? roleLabelMap[activeRider.role || 'custom']?.labelTw : roleLabelMap[activeRider.role || 'custom']?.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                  <span>推重比: <strong className="text-ios-blue font-bold">{(activeRider.weightKg > 0 ? (activeRider.ftpWatts / activeRider.weightKg).toFixed(2) : '--')} W/kg</strong></span>
                  <span>•</span>
                  <span>战车: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeBike.name.split('/')[0]}</strong> ({activeBike.weightKg}kg)</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setModalTab('roster')}
                  className="px-2.5 py-1 text-[11px] font-semibold text-ios-blue bg-ios-blue/10 hover:bg-ios-blue/15 rounded-xl transition apple-touch"
                >
                  换车手
                </button>
                <button
                  onClick={() => setModalTab('garage')}
                  className="px-2.5 py-1 text-[11px] font-semibold text-ios-blue bg-ios-blue/10 hover:bg-ios-blue/15 rounded-xl transition apple-touch"
                >
                  换车
                </button>
              </div>
            </div>

            {/* Inset Group: Rider Physical & Bike Specs */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-4.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 pb-1 border-b border-black/[0.04] dark:border-white/[0.06]">
                <Activity className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {language === 'zh-TW' ? '車手身體與心率生理基準' : '车手身体与心率生理基准'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {language === 'zh-TW' ? '身高' : '身高'}
                    </label>
                    {isImperial && (
                      <span className="text-[10px] text-ios-blue dark:text-ios-blue-dark font-mono">
                        {heightFeet}'{heightInches}"
                      </span>
                    )}
                  </div>
                  <NumberStepper
                    value={profile.heightCm}
                    onChange={(v) => updateProfile({ heightCm: v })}
                    step={0.5}
                    min={120}
                    max={220}
                    unit="cm"
                    decimals={1}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    {language === 'zh-TW' ? '跨高 (Inseam)' : '跨高 (Inseam)'}
                  </label>
                  <NumberStepper
                    value={profile.inseamCm}
                    onChange={(v) => updateProfile({ inseamCm: v })}
                    step={0.5}
                    min={50}
                    max={110}
                    unit="cm"
                    decimals={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {language === 'zh-TW' ? '車手淨體重' : '车手净体重'}
                    </label>
                    {isImperial && (
                      <span className="text-[10px] text-ios-blue dark:text-ios-blue-dark font-mono">
                        {currentWeightLbs} lbs
                      </span>
                    )}
                  </div>
                  <NumberStepper
                    value={profile.weightKg}
                    onChange={(v) => updateProfile({ weightKg: v })}
                    step={0.5}
                    min={35}
                    max={150}
                    unit="kg"
                    decimals={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {language === 'zh-TW' ? '整車裝備重量' : '整车装备重量'}
                    </label>
                    {isImperial && (
                      <span className="text-[10px] text-ios-blue dark:text-ios-blue-dark font-mono">
                        {currentBikeWeightLbs} lbs
                      </span>
                    )}
                  </div>
                  <NumberStepper
                    value={profile.bikeWeightKg}
                    onChange={(v) => {
                      updateProfile({ bikeWeightKg: v });
                      updateBike(activeBikeId, { weightKg: v });
                    }}
                    step={0.1}
                    min={4}
                    max={30}
                    unit="kg"
                    decimals={1}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    {language === 'zh-TW' ? '乳酸閾值功率 (FTP)' : '乳酸阈值功率 (FTP)'}
                  </label>
                  <NumberStepper
                    value={profile.ftpWatts}
                    onChange={(v) => updateProfile({ ftpWatts: v })}
                    step={5}
                    min={100}
                    max={600}
                    unit="W"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    {language === 'zh-TW' ? '最大心率 (HRmax)' : '最大心率 (HRmax)'}
                  </label>
                  <NumberStepper
                    value={profile.maxHr}
                    onChange={(v) => updateProfile({ maxHr: v })}
                    step={1}
                    min={140}
                    max={230}
                    unit="BPM"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    {language === 'zh-TW' ? '靜息心率 (HRrest)' : '静息心率 (HRrest)'}
                  </label>
                  <NumberStepper
                    value={profile.restingHr}
                    onChange={(v) => updateProfile({ restingHr: v })}
                    step={1}
                    min={30}
                    max={100}
                    unit="BPM"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    {language === 'zh-TW' ? '年齡' : '年龄'}
                  </label>
                  <NumberStepper
                    value={profile.age}
                    onChange={(v) => updateProfile({ age: v })}
                    step={1}
                    min={12}
                    max={90}
                    unit="岁"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEAM ROSTER (MULTI-RIDER MANAGEMENT) */}
        {modalTab === 'roster' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'zh-TW' ? '車隊現役車手名單 (點擊立即切換出賽)' : '车队现役车手名单 (点击立即切换出赛)'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const newId = `rider-${Date.now()}`;
                  addRider({
                    id: newId,
                    name: `新车手 ${roster.length + 1}`,
                    role: 'domestique',
                    heightCm: 175,
                    inseamCm: 81,
                    weightKg: 68,
                    bikeWeightKg: 7.5,
                    ftpWatts: 300,
                    restingHr: 50,
                    maxHr: 190,
                    gender: 'male',
                    age: 24,
                  });
                  showToast('已创建并载入新车手档案', 'success');
                }}
                className="flex items-center gap-1 text-xs text-ios-blue hover:text-ios-blue/80 font-semibold apple-touch"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'zh-TW' ? '添加車手' : '添加车手'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {roster.map((rider) => {
                const isActive = activeRiderId === rider.id;
                const roleMeta = roleLabelMap[rider.role || 'custom'];
                const wkg = rider.weightKg > 0 ? (rider.ftpWatts / rider.weightKg).toFixed(2) : '--';

                return (
                  <div
                    key={rider.id}
                    onClick={() => {
                      switchRider(rider.id);
                      showToast(
                        language === 'zh-TW'
                          ? `已切換當前出賽車手為【${rider.name}】`
                          : `已切换当前出赛车手为【${rider.name}】`,
                        'success'
                      );
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer apple-touch flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-ios-blue/10 dark:bg-ios-blue/20 border-ios-blue ring-2 ring-ios-blue/30 shadow-xs'
                        : 'bg-white dark:bg-[#1C1C1E] border-black/[0.05] dark:border-white/[0.08] hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isActive ? 'text-ios-blue' : 'text-slate-900 dark:text-white'}`}>
                          {rider.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full border font-semibold ${roleMeta?.color}`}>
                          {language === 'zh-TW' ? roleMeta?.labelTw : roleMeta?.label}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-ios-green font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            出赛中
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>体重: <strong className="text-slate-700 dark:text-slate-300">{rider.weightKg} kg</strong></span>
                        <span>FTP: <strong className="text-slate-700 dark:text-slate-300">{rider.ftpWatts} W</strong></span>
                        <span>推重比: <strong className="text-ios-blue font-bold">{wkg} W/kg</strong></span>
                        <span>身高: {rider.heightCm}cm</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {roster.length > 1 && !isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRider(rider.id);
                            showToast('已移除该车手', 'info');
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-ios-red hover:bg-ios-red/10 transition apple-touch"
                          title="删除车手"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BIKE GARAGE (MULTI-BIKE CONFIGURATION) */}
        {modalTab === 'garage' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'zh-TW' ? '車隊戰車車庫 (點擊裝配並聯動計算)' : '车队战车车库 (点击装配并联动计算)'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const newId = `bike-${Date.now()}`;
                  addBike({
                    id: newId,
                    name: `战车 ${bikes.length + 1}`,
                    type: 'road_aero',
                    weightKg: 7.2,
                    crr: 0.0038,
                    cda: 0.28,
                    notes: '自定义整车'
                  });
                  showToast('已添加新战车至车库', 'success');
                }}
                className="flex items-center gap-1 text-xs text-ios-blue hover:text-ios-blue/80 font-semibold apple-touch"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'zh-TW' ? '新增戰車' : '新增战车'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {bikes.map((b) => {
                const isActive = activeBikeId === b.id;
                const typeName =
                  b.type === 'road_aero' ? '公路气动' :
                  b.type === 'road_climb' ? '公路爬坡' :
                  b.type === 'road_tt' ? '计时赛 TT' :
                  b.type === 'gravel' ? 'Gravel 砂石' : '山地全避震';

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      switchBike(b.id);
                      showToast(
                        language === 'zh-TW'
                          ? `已裝配戰車【${b.name.split('/')[0]}】`
                          : `已装配战车【${b.name.split('/')[0]}】`,
                        'success'
                      );
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer apple-touch flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-ios-blue/10 dark:bg-ios-blue/20 border-ios-blue ring-2 ring-ios-blue/30 shadow-xs'
                        : 'bg-white dark:bg-[#1C1C1E] border-black/[0.05] dark:border-white/[0.08] hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Bike className={`w-4 h-4 ${isActive ? 'text-ios-blue' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-ios-blue' : 'text-slate-900 dark:text-white'}`}>
                          {b.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-medium">
                          {typeName}
                        </span>
                        {b.stravaGearId && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-orange-500/15 text-[#FC4C02] font-semibold flex items-center gap-1">
                            <Cloud className="w-2.5 h-2.5" />
                            Strava
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-ios-blue font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            装配中
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>整车重: <strong className="text-slate-700 dark:text-slate-300">{b.weightKg} kg</strong></span>
                        <span>滚阻 Crr: <strong className="text-slate-700 dark:text-slate-300">{b.crr}</strong></span>
                        <span>风阻 CdA: <strong className="text-slate-700 dark:text-slate-300">{b.cda} m²</strong></span>
                        {b.mileageKm !== undefined && (
                          <span>里程: <strong className="text-ios-blue font-bold">{b.mileageKm} km</strong></span>
                        )}
                        {b.notes && <span className="text-slate-400 italic font-sans">{b.notes}</span>}
                      </div>

                      {/* Strava Gear Binding Selector */}
                      {isStravaConnected && athlete?.bikes && athlete.bikes.length > 0 && (
                        <div
                          className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Cloud className="w-3 h-3 text-[#FC4C02] shrink-0" />
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                            {language === 'zh-TW' ? 'Strava 裝備關聯:' : 'Strava 装备关联:'}
                          </span>
                          <select
                            value={b.stravaGearId || ''}
                            onChange={(e) => {
                              const gearId = e.target.value;
                              if (!gearId) {
                                updateBike(b.id, { stravaGearId: undefined });
                                showToast('已解除与 Strava 装备的绑定', 'info');
                              } else {
                                const matched = athlete?.bikes?.find(sb => sb.id === gearId);
                                const km = matched ? Math.round(matched.distance / 1000) : (b.mileageKm || 0);
                                updateBike(b.id, { stravaGearId: gearId, mileageKm: km });
                                showToast(
                                  language === 'zh-TW'
                                    ? `戰車已成功關聯 Strava【${matched?.name || gearId}】，里程同步為 ${km} km`
                                    : `战车已成功关联 Strava【${matched?.name || gearId}】，里程同步为 ${km} km`,
                                  'success'
                                );
                              }
                            }}
                            className="bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-[11px] rounded-lg px-2 py-0.5 border-none focus:ring-1 focus:ring-orange-500 flex-1 min-w-0 font-sans"
                          >
                            <option value="">未绑定</option>
                            {athlete.bikes.map(sb => (
                              <option key={sb.id} value={sb.id}>
                                {sb.name} ({Math.round(sb.distance / 1000)} km)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {bikes.length > 1 && !isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBike(b.id);
                            showToast('已从车库移出该车', 'info');
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-ios-red hover:bg-ios-red/10 transition apple-touch"
                          title="删除战车"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: STRAVA CLOUD SYNC & API INTEGRATION */}
        {modalTab === 'strava' && (
          <div className="space-y-4">
            {!isStravaConnected ? (
              /* UNCONNECTED: BYOK Connect Form */
              <div className="space-y-4">
                {/* Intro Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FC4C02]/15 text-[#FC4C02] flex items-center justify-center font-bold">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Strava 开放平台直连
                          </h3>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#FC4C02]/15 text-[#FC4C02] font-semibold border border-[#FC4C02]/20">
                            个人 API 模式
                          </span>
                        </div>
                        <PoweredByStravaBadge />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        零云端服务器中转，本地直连您的 Strava 账号。自动同步骑行历史、真实心率功率与战车行驶里程。
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Guide */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowGuide(!showGuide)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#FC4C02]" />
                        如何免费获取 Strava API 密钥？（1分钟极简图文指引）
                      </span>
                      <span className="text-slate-400 text-xs">{showGuide ? '收起' : '展开'}</span>
                    </button>

                    {showGuide && (
                      <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                        <p>1. 电脑或手机浏览器打开 <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="text-[#FC4C02] underline font-medium">strava.com/settings/api</a> 登录您的账号；</p>
                        <p>2. 创建应用：<strong>Application Name</strong> 填 <code className="bg-black/5 dark:bg-white/10 px-1 rounded">SoloRiderTools</code>，<strong>Category</strong> 选 <code className="bg-black/5 dark:bg-white/10 px-1 rounded">Other</code>；</p>
                        <p>3. <strong>Authorization Callback Domain</strong> 填入 <code className="bg-black/5 dark:bg-white/10 px-1 rounded">localhost</code>（或您访问本系统的域名）；</p>
                        <p>4. 创建成功后，复制页面上的 <strong>Client ID</strong> 与 <strong>Client Secret</strong> 粘贴在下方。</p>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="例如: 123456"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FC4C02]/30"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                        <span>Client Secret</span>
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {showSecret ? '隐藏' : '显示'}
                        </button>
                      </label>
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={clientSecretInput}
                        onChange={(e) => setClientSecretInput(e.target.value)}
                        placeholder="例如: 8a7b6c5d4e3f..."
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FC4C02]/30"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!clientIdInput.trim() || !clientSecretInput.trim()) {
                          showToast('请完整填写 Client ID 和 Client Secret', 'warning');
                          return;
                        }
                        saveStravaApiKeys({
                          clientId: clientIdInput.trim(),
                          clientSecret: clientSecretInput.trim()
                        });
                        initiateStravaAuth();
                      }}
                      className="apple-touch w-full py-2.5 rounded-xl bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold text-xs shadow-ios-sm flex items-center justify-center gap-2 transition active:scale-98"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>保存密钥并前往 Strava 授权连接</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CONNECTED: Athlete Status, Sync Actions, Preferences */
              <div className="space-y-4">
                {/* Connected Athlete Banner */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {athlete?.profile_medium ? (
                        <img
                          src={athlete.profile_medium}
                          alt={athlete.firstname}
                          className="w-11 h-11 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-[#FC4C02]/15 text-[#FC4C02] flex items-center justify-center font-bold text-base">
                          {athlete?.firstname?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {athlete?.firstname} {athlete?.lastname}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            已连接
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {athlete?.city ? `${athlete.city}, ${athlete.country || ''}` : 'Strava 认证车手'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <PoweredByStravaBadge />
                      <button
                        type="button"
                        onClick={() => syncStravaActivities(false)}
                        disabled={isStravaSyncing}
                        className="apple-touch px-3 py-1.5 rounded-xl bg-[#FC4C02]/10 hover:bg-[#FC4C02]/20 text-[#FC4C02] text-xs font-semibold border border-[#FC4C02]/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isStravaSyncing ? 'animate-spin' : ''}`} />
                        <span>{isStravaSyncing ? '同步中...' : '立即同步'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Realtime Progress Bar */}
                  {stravaSyncProgress && (
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{stravaSyncProgress.message}</span>
                        </span>
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                          {stravaSyncProgress.current}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 rounded-full"
                          style={{ width: `${stravaSyncProgress.current}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Tiles */}
                  <div className="grid grid-cols-4 gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.06] text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-[10px] text-slate-400 block">已同步活动</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {stravaActivities.length}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-[10px] text-slate-400 block">Strava FTP</span>
                      <span className="text-sm font-bold font-mono text-ios-blue">
                        {athlete?.ftp || '--'} <span className="text-[10px] font-normal">W</span>
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-[10px] text-slate-400 block">车手自重</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {athlete?.weight ? `${athlete.weight}` : '--'} <span className="text-[10px] font-normal">kg</span>
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                      <span className="text-[10px] text-slate-400 block">关联战车</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                        {athlete?.bikes?.length || 0} <span className="text-[10px] font-normal">台</span>
                      </span>
                    </div>
                  </div>

                  {stravaLastSyncTime && (
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>上次同步时间:</span>
                      <span className="font-mono">{new Date(stravaLastSyncTime * 1000).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Auto-Sync Preferences Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] shadow-xs space-y-3">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-ios-blue" />
                    自动化协同偏好设置
                  </h4>

                  <div className="space-y-2.5 text-xs divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    <label className="flex items-center justify-between pt-1 cursor-pointer">
                      <div>
                        <span className="text-slate-800 dark:text-slate-200 block font-medium">自动同步车手 FTP 与体重</span>
                        <span className="text-[10px] text-slate-400">拉取 Strava 最新 FTP 与体重并更新到当前档案</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={stravaSyncSettings.autoSyncFtpWeight}
                        onChange={(e) => updateStravaSettings({ autoSyncFtpWeight: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#FC4C02] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between pt-2 cursor-pointer">
                      <div>
                        <span className="text-slate-800 dark:text-slate-200 block font-medium">自动同步单车行驶里程到战车库</span>
                        <span className="text-[10px] text-slate-400">战车里程达标时联动提醒链条拉伸与外胎磨损</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={stravaSyncSettings.autoSyncBikes}
                        onChange={(e) => updateStravaSettings({ autoSyncBikes: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#FC4C02] cursor-pointer"
                      />
                    </label>

                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <span className="text-slate-800 dark:text-slate-200 block font-medium">历史骑行活动同步范围</span>
                        <span className="text-[10px] text-slate-400">为 PMC 长期体能负荷分析拉取历史天数</span>
                      </div>
                      <IOSSegmentedControl
                        options={[
                          { value: '30', label: '30天' },
                          { value: '60', label: '60天' },
                          { value: '90', label: '90天' },
                        ]}
                        value={String(stravaSyncSettings.syncDays || 90)}
                        onChange={(val) => updateStravaSettings({ syncDays: Number(val) })}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Recent Activities Preview */}
                {stravaActivities.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        最近同步骑行 ({Math.min(3, stravaActivities.length)})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        全量数据已存入本地 IndexedDB
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {stravaActivities.slice(0, 3).map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.05] flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">
                              {act.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(act.start_date_local || act.start_date).toLocaleDateString()} • {(act.distance / 1000).toFixed(1)} km • 爬升 {act.total_elevation_gain}m
                            </span>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-[#FC4C02]/10 text-[#FC4C02] font-bold text-[11px]">
                              {act.tss || 0} TSS
                            </span>
                            {act.weighted_average_watts ? (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                NP: {act.weighted_average_watts}W
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Cache & Storage Management */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-ios-blue" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'zh-TW' ? '本地離線快取管理' : '本地离线缓存管理'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {stravaActivities.length} 条活动 · ~{Math.round(stravaActivities.length * 12.5)} KB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    所有 Strava 骑行与传感器流数据均保存在本地浏览器 IndexedDB 离线数据库中，绝不上载第三方服务器。您可以随时释放离线存储空间。
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={clearStravaCache}
                      className="apple-touch flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-200/70 hover:bg-slate-300/70 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'zh-TW' ? '清空本地離線資料' : '清空本地离线数据'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={disconnectStrava}
                      className="apple-touch flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-500 text-xs font-medium transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'zh-TW' ? '解除綁定並斷開' : '解除绑定并断开'}</span>
                    </button>
                  </div>
                </div>

                {/* Brand Compliance Footer */}
                <div className="pt-2 flex flex-col items-center justify-center gap-1 text-center">
                  <PoweredByStravaBadge />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    本应用遵循 Strava API 开发者准则与品牌官方规范。
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SYSTEM PREFERENCES & NAVIGATION CUSTOMIZER */}
        {modalTab === 'system' && (
          <div className="space-y-4">
            {/* Preferences Group */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/[0.05] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden shadow-xs">
              {/* Language Selector */}
              <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-ios-blue/10 flex items-center justify-center text-ios-blue dark:text-ios-blue-dark">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {language === 'zh-TW' ? '語言' : '语言'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {language === 'zh-TW' ? '繁體中文' : '简体中文'}
                    </span>
                  </div>
                </div>
                <IOSSegmentedControl
                  options={[
                    { value: 'zh', label: '简体' },
                    { value: 'zh-TW', label: '繁體' },
                  ]}
                  value={language}
                  onChange={(val) => setLanguage(val as 'zh' | 'zh-TW')}
                  size="sm"
                />
              </div>

              {/* Unit System */}
              <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-ios-green/10 flex items-center justify-center text-ios-green dark:text-ios-green-dark">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {language === 'zh-TW' ? '度量衡制式' : '度量衡制式'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {isImperial ? 'Imperial (lbs, in, psi)' : 'Metric (kg, cm, bar)'}
                    </span>
                  </div>
                </div>
                <IOSSegmentedControl
                  options={[
                    { value: 'metric', label: '公制' },
                    { value: 'imperial', label: '英制' },
                  ]}
                  value={unitSystem}
                  onChange={(val) => setUnitSystem(val as 'metric' | 'imperial')}
                  size="sm"
                />
              </div>

              {/* Appearance Mode */}
              {themeMode && setThemeMode && (
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-ios-orange/10 flex items-center justify-center text-ios-orange dark:text-ios-orange-dark">
                      {themeMode === 'system' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : themeMode === 'dark' ? (
                        <Moon className="w-4 h-4" />
                      ) : (
                        <Sun className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        {language === 'zh-TW' ? '外觀主題' : '外观主题'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {themeMode === 'system' ? '自动跟随系统' : themeMode === 'dark' ? '深色模式' : '浅色模式'}
                      </span>
                    </div>
                  </div>
                  <IOSSegmentedControl
                    options={[
                      { value: 'system', label: '自动' },
                      { value: 'light', label: '浅色' },
                      { value: 'dark', label: '深色' },
                    ]}
                    value={themeMode}
                    onChange={(val) => setThemeMode(val as 'system' | 'light' | 'dark')}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation Customizer */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-4.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {language === 'zh-TW' ? '移動端底部導航欄自訂' : '移动端底部导航栏自选'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">4 个快捷槽位</span>
              </div>

              {/* Recommended Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{language === 'zh-TW' ? '官方推薦組合:' : '官方推荐组合:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetNavShortcuts();
                      showToast(
                        language === 'zh-TW' ? '底部導航已恢復預設' : '底部导航已恢复默认',
                        'info'
                      );
                    }}
                    className="text-[10px] text-ios-blue hover:underline font-medium"
                  >
                    {language === 'zh-TW' ? '恢復默認' : '恢复默认'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {NAV_PRESETS.map((preset) => {
                    const isSelected =
                      navShortcuts.length === 4 &&
                      preset.tools.every((tid, idx) => navShortcuts[idx] === tid);

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAllNavShortcuts(preset.tools);
                          showToast(
                            language === 'zh-TW'
                              ? `已套用【${preset.nameTw}】組合`
                              : `已套用【${preset.name}】组合`,
                            'success'
                          );
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium border transition apple-touch ${
                          isSelected
                            ? 'bg-ios-blue text-white border-ios-blue font-bold shadow-xs ring-1.5 ring-ios-blue/30 scale-[1.01]'
                            : 'bg-slate-50 dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{language === 'zh-TW' ? preset.nameTw : preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots Preview */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {language === 'zh-TW' ? '導航欄即時佈局 (點擊快捷位自選替換)' : '导航栏即时布局 (点击快捷位自选替换)'}
                </div>

                <div className="grid grid-cols-5 gap-1 sm:gap-1.5 p-2 rounded-2xl bg-slate-100/80 dark:bg-[#121214] border border-black/[0.04] dark:border-white/[0.06]">
                  {/* Home Slot (Locked) */}
                  <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/70 dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] opacity-75 select-none">
                    <div className="p-1 rounded-lg text-slate-400 dark:text-slate-500 relative">
                      <Home className="w-4 h-4" />
                      <Lock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 select-none">
                      {language === 'zh-TW' ? '首頁' : '首页'}
                    </span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      {language === 'zh-TW' ? '固定' : '固定'}
                    </span>
                  </div>

                  {/* 4 Customizable Slots */}
                  {navShortcuts.map((toolId, slotIdx) => {
                    const tool = getNavToolById(toolId);
                    const IconComponent = tool?.icon || Activity;
                    const isEditing = editingSlot === slotIdx;

                    const colorClass =
                      tool?.categoryColor === 'ios-purple'
                        ? 'text-ios-purple'
                        : tool?.categoryColor === 'ios-mint'
                        ? 'text-ios-mint'
                        : 'text-ios-blue';

                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() => setEditingSlot(slotIdx)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition apple-touch relative ${
                          isEditing
                            ? 'bg-ios-blue text-white shadow-xs'
                            : 'bg-white dark:bg-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.12] border border-black/[0.05] dark:border-white/[0.08] text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className={`p-1 rounded-lg ${isEditing ? 'text-white' : colorClass}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[10px] font-semibold mt-1 truncate max-w-full select-none ${
                            isEditing ? 'text-white' : ''
                          }`}
                        >
                          {tool
                            ? language === 'zh-TW'
                              ? tool.shortTitleTw
                              : tool.shortTitle
                            : '未配置'}
                        </span>
                        <span
                          className={`text-[8px] font-mono mt-0.5 ${
                            isEditing ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {language === 'zh-TW' ? `位 ${slotIdx + 1}` : `槽 ${slotIdx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Info Banner (iOS Notice Callout) */}
        <div className="p-3 rounded-2xl bg-ios-blue/10 dark:bg-ios-blue/15 border border-ios-blue/20 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark shrink-0 mt-0.5" />
          <span className="leading-relaxed text-[11px]">
            {language === 'zh-TW'
              ? '設定持久化於本地。全站 18 款工具（功率、胎壓、Fitting、爬坡分段、山地避震等）均已主動監聽並即時響應聯動。'
              : '设置持久化于本地。全站 18 款工具（功率、胎压、Fitting、爬坡分段、山地避震等）均已主动监听并即时响应联动。'}
          </span>
        </div>

        {/* Action Buttons: Reset and Done */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-black/[0.05] dark:border-white/[0.08]">
          <button
            onClick={handleReset}
            className="apple-touch px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'zh-TW' ? '恢復標準預設' : '恢复标准默认'}</span>
          </button>

          <button
            onClick={onClose}
            className="apple-touch px-5 py-2 rounded-xl text-xs font-semibold bg-ios-blue hover:opacity-90 active:scale-95 text-white transition shadow-ios-sm flex items-center gap-1.5"
          >
            <span>{language === 'zh-TW' ? '完成並儲存' : '完成并保存'}</span>
          </button>
        </div>

        {/* Slot Tool Picker Modal */}
        {editingSlot !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 border-b border-black/[0.05] dark:border-white/[0.08] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'zh-TW'
                      ? `選擇槽位 ${editingSlot + 1} 的快捷工具`
                      : `选择快捷位 ${editingSlot + 1} 的工具`}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'zh-TW'
                      ? '同一個工具不可在底部導航重複出現'
                      : '同一个工具不可在底部导航重复出现'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tools List by Category */}
              <div className="overflow-y-auto p-3 sm:p-4 space-y-4 flex-1">
                {(['dynamics', 'fitting', 'route', 'health'] as const).map((cat) => {
                  const catTools = ALL_NAV_TOOLS.filter((t) => t.category === cat);
                  if (!catTools.length) return null;

                  const catLabel =
                    language === 'zh-TW'
                      ? catTools[0].categoryLabelTw
                      : catTools[0].categoryLabel;

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1">
                        {catLabel}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {catTools.map((tool) => {
                          const IconComp = tool.icon;
                          const isCurrent = navShortcuts[editingSlot] === tool.id;
                          const isUsedInOtherSlot =
                            navShortcuts.includes(tool.id) && !isCurrent;

                          return (
                            <button
                              key={tool.id}
                              type="button"
                              disabled={isUsedInOtherSlot}
                              onClick={() => {
                                if (isUsedInOtherSlot) return;
                                const success = setNavShortcut(editingSlot, tool.id);
                                if (success) {
                                  showToast(
                                    language === 'zh-TW'
                                      ? `快捷位 ${editingSlot + 1} 已設為【${tool.shortTitleTw}】`
                                      : `快捷位 ${editingSlot + 1} 已设为【${tool.shortTitle}】`,
                                    'success'
                                  );
                                  setEditingSlot(null);
                                }
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition apple-touch ${
                                isCurrent
                                  ? 'bg-ios-blue/15 border-ios-blue text-ios-blue dark:text-white dark:bg-ios-blue/30 font-bold ring-2 ring-ios-blue/30 shadow-xs'
                                  : isUsedInOtherSlot
                                  ? 'bg-slate-100/50 dark:bg-white/[0.02] border-transparent opacity-40 cursor-not-allowed'
                                  : 'bg-slate-50 dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isCurrent
                                      ? 'bg-ios-blue text-white'
                                      : isUsedInOtherSlot
                                      ? 'bg-slate-200 dark:bg-white/10 text-slate-400'
                                      : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 shadow-2xs'
                                  }`}
                                >
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold truncate">
                                    {language === 'zh-TW' ? tool.titleTw : tool.title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                    {language === 'zh-TW'
                                      ? `標籤: ${tool.shortTitleTw}`
                                      : `标签: ${tool.shortTitle}`}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
