import React, { useState } from 'react';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import {
  User,
  X,
  Check,
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
  Lock
} from 'lucide-react';
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
    navShortcuts,
    setNavShortcut,
    setAllNavShortcuts,
    resetNavShortcuts
  } = useRiderProfile();
  const { unitSystem, setUnitSystem, language, setLanguage } = useLanguageAndUnit();
  const { showToast } = useToast();
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-ios-bg-grouped-light dark:bg-[#121214] p-5 sm:p-6 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-ios-popover space-y-4 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-ios-blue/15 text-ios-blue dark:text-ios-blue-dark flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'zh-TW' ? '系統設定與車手檔案' : '系统设置与车手档案'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'zh-TW' ? '設定一次，全站 18 大計算引擎即時同步' : '设定一次，全站 18 大计算引擎即时同步'}
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

        {/* Inset Group: System Preferences */}
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

        {/* Inset Group: Rider Physical & Bike Specs */}
        <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-4.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 pb-1 border-b border-black/[0.04] dark:border-white/[0.06]">
            <Activity className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {language === 'zh-TW' ? '身體與車輛基準參數' : '身体与车辆基准参数'}
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
                {language === 'zh-TW' ? '跨高' : '跨高'}
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
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                {language === 'zh-TW' ? '車手淨重' : '车手净重'}
              </label>
              {isImperial ? (
                <NumberStepper
                  value={currentWeightLbs}
                  onChange={(lbs) => updateProfile({ weightKg: parseFloat((lbs / 2.20462).toFixed(1)) })}
                  step={1}
                  min={66}
                  max={330}
                  unit="lbs"
                  decimals={1}
                />
              ) : (
                <NumberStepper
                  value={profile.weightKg}
                  onChange={(v) => updateProfile({ weightKg: v })}
                  step={0.5}
                  min={30}
                  max={150}
                  unit="kg"
                  decimals={1}
                />
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                {language === 'zh-TW' ? '整車+裝備重' : '整车+装备重'}
              </label>
              {isImperial ? (
                <NumberStepper
                  value={currentBikeWeightLbs}
                  onChange={(lbs) => updateProfile({ bikeWeightKg: parseFloat((lbs / 2.20462).toFixed(1)) })}
                  step={0.2}
                  min={11}
                  max={55}
                  unit="lbs"
                  decimals={1}
                />
              ) : (
                <NumberStepper
                  value={profile.bikeWeightKg}
                  onChange={(v) => updateProfile({ bikeWeightKg: v })}
                  step={0.1}
                  min={5}
                  max={25}
                  unit="kg"
                  decimals={1}
                />
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                {language === 'zh-TW' ? '閾值功率 (FTP)' : '阈值功率 (FTP)'}
              </label>
              <NumberStepper
                value={profile.ftpWatts}
                onChange={(v) => updateProfile({ ftpWatts: v })}
                step={5}
                min={50}
                max={600}
                unit="W"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                {language === 'zh-TW' ? '車手年齡' : '车手年龄'}
              </label>
              <NumberStepper
                value={profile.age}
                onChange={(v) => updateProfile({ age: v })}
                step={1}
                min={10}
                max={99}
                unit="岁"
              />
            </div>
          </div>
        </div>

        {/* Inset Group: Mobile Bottom Navigation Customization */}
        <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-4.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-1 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {language === 'zh-TW' ? '移動端底部快捷導航' : '移动端底部快捷导航'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {language === 'zh-TW' ? '自選 4 個高頻入口 · 嚴格排他去重' : '自选 4 个高频入口 · 严格排他去重'}
            </span>
          </div>

          {/* Preset Templates */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{language === 'zh-TW' ? '一鍵套用推薦組合' : '一键套用推荐组合'}</span>
              <button
                type="button"
                onClick={() => {
                  resetNavShortcuts();
                  showToast(
                    language === 'zh-TW' ? '已恢復預設導航組合' : '已恢复默认导航组合',
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
                    : tool?.categoryColor === 'ios-red'
                    ? 'text-ios-red'
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

        {/* Sync Info Banner (iOS Notice Callout) */}
        <div className="p-3 rounded-2xl bg-ios-blue/10 dark:bg-ios-blue/15 border border-ios-blue/20 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark shrink-0 mt-0.5" />
          <span className="leading-relaxed text-[11px]">
            {language === 'zh-TW'
              ? '設定持久化於本地。全站 18 款工具（功率、胎壓、Fitting、爬坡分段等）均已主動監聽並即時響應聯動。'
              : '设置持久化于本地。全站 18 款工具（功率、胎压、Fitting、爬坡分段等）均已主动监听并即时响应联动。'}
          </span>
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

                              {isCurrent && (
                                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-ios-blue dark:text-ios-blue-dark bg-ios-blue/15 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  {language === 'zh-TW' ? '當前' : '当前'}
                                </span>
                              )}

                              {isUsedInOtherSlot && (
                                <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                                  {language === 'zh-TW' ? '已在導航' : '已在导航'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-black/[0.05] dark:border-white/[0.08] flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                >
                  {language === 'zh-TW' ? '取消' : '取消'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white apple-touch transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'zh-TW' ? '重置' : '重置'}</span>
          </button>
          <button
            onClick={() => {
              onClose();
              showToast(
                language === 'zh-TW'
                  ? '車手檔案與制式已更新並全站同步！'
                  : '车手档案与度量衡已更新并全站同步！',
                'success'
              );
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-ios-blue hover:bg-ios-blue-dark text-white text-xs font-semibold apple-touch transition-all shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[2.2]" />
            <span>{language === 'zh-TW' ? '完成' : '完成'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
