import React from 'react';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { User, X, Check, RotateCcw, Activity, ShieldCheck, Gauge } from 'lucide-react';
import { NumberStepper } from './NumberStepper';

interface RiderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiderProfileModal: React.FC<RiderProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, resetProfile } = useRiderProfile();
  const { unitSystem, setUnitSystem, language } = useLanguageAndUnit();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleReset = () => {
    resetProfile();
    showToast(
      language === 'en'
        ? 'Rider profile reset to standard defaults'
        : language === 'zh-TW'
        ? '車手檔案已重置為標準預設值'
        : '车手档案已重置为标准默认值',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/95 dark:bg-slate-950/95 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'en' ? 'Universal Rider Profile & Units' : language === 'zh-TW' ? '車手通用個人檔案與制式' : '车手通用个人档案与度量衡'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Single Source of Truth: syncs across all 14 scientific tools' : language === 'zh-TW' ? '設定一次，全站 14 大計算引擎自動即時聯動' : '设定一次，全站 14 大计算引擎自动即时联动'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Unit System Control Bar (Single Source of Truth) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                {language === 'en' ? 'Global Unit System' : language === 'zh-TW' ? '全局度量衡制式' : '全局度量衡制式'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {isImperial ? 'Imperial (lbs, in/ft, mph, psi)' : 'Metric (kg, cm, km/h, bar)'}
              </span>
            </div>
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono font-bold">
            <button
              onClick={() => setUnitSystem('metric')}
              className={`px-3 py-1 rounded-lg transition ${
                !isImperial
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              公制 Metric
            </button>
            <button
              onClick={() => setUnitSystem('imperial')}
              className={`px-3 py-1 rounded-lg transition ${
                isImperial
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              英制 Imperial
            </button>
          </div>
        </div>

        {/* Profile Inputs Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {language === 'en' ? 'Height' : language === 'zh-TW' ? '身高' : '身高'}
              </label>
              {isImperial && (
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
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
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'en' ? 'Inseam' : language === 'zh-TW' ? '跨高' : '跨高'}
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
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'en' ? 'Rider Weight' : language === 'zh-TW' ? '車手淨重' : '车手净重'}
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
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'en' ? 'Bike + Gear' : language === 'zh-TW' ? '整車+裝備重' : '整车+装备重'}
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
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'en' ? 'Functional Threshold (FTP)' : language === 'zh-TW' ? '功能閾值功率 (FTP)' : '功能阈值功率 (FTP)'}
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
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'en' ? 'Rider Age' : language === 'zh-TW' ? '車手年齡' : '车手年龄'}
            </label>
            <NumberStepper
              value={profile.age}
              onChange={(v) => updateProfile({ age: v })}
              step={1}
              min={10}
              max={99}
              unit={language === 'en' ? 'yrs' : '岁'}
            />
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            {language === 'en'
              ? 'Rider parameters and unit system are persisted in local storage. All calculations (power, tire pressure, fitting, pacing) adapt automatically.'
              : language === 'zh-TW'
              ? '檔案參數與度量衡已持久化保存在瀏覽器中。全站所有工具（功率、胎壓、Fitting、爬坡配速等）均已主動監聽並即時響應。'
              : '档案参数与度量衡已持久化保存在浏览器中。全站所有工具（功率、胎压、Fitting、爬坡配速等）均已主动监听并即时响应。'}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {language === 'en' ? 'Reset Defaults' : language === 'zh-TW' ? '重置預設' : '重置默认'}
          </button>
          <button
            onClick={() => {
              onClose();
              showToast(
                language === 'en'
                  ? 'Rider profile & units synced across all tools!'
                  : language === 'zh-TW'
                  ? '車手檔案與制式已更新並全站同步！'
                  : '车手档案与度量衡已更新并全站同步！',
                'success'
              );
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20"
          >
            <Check className="w-4 h-4" />
            {language === 'en' ? 'Save & Sync All Tools' : language === 'zh-TW' ? '保存並同步全站' : '保存并同步全站'}
          </button>
        </div>
      </div>
    </div>
  );
};
