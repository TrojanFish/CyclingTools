import React, { useState, useMemo, useEffect } from 'react';
import { Gauge, Info, AlertTriangle, Layers, Copy, Check, User } from 'lucide-react';
import { SURFACE_FACTORS, TIRE_SETUP_FACTORS, getBaseTirePsi } from '../../data/tirePressureConfig';
import { Tooltip } from '../common/Tooltip';
import { TireGauge } from '../common/TireGauge';
import { useToast } from '../../context/ToastContext';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

export const TirePressureCalculator: React.FC = () => {
  const { showToast } = useToast();
  const { profile } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const isImperial = unitSystem === 'imperial';

  const [bikeType, setBikeType] = useState<'road' | 'gravel' | 'mtb'>('road');
  const [riderWeight, setRiderWeight] = useState<number>(profile.weightKg || 68);
  const [bikeGearWeight, setBikeGearWeight] = useState<number>(profile.bikeWeightKg || 8.5);
  const [tireSetup, setTireSetup] = useState<'tubeless' | 'tube' | 'tubular'>('tubeless');
  const [nominalWidth, setNominalWidth] = useState<number>(28);
  const [actualWidth, setActualWidth] = useState<number>(29.5);
  const [rimInnerWidth, setRimInnerWidth] = useState<number>(21);
  const [isHookless, setIsHookless] = useState<boolean>(false);
  const [weightDistFront, setWeightDistFront] = useState<number>(44);
  const [surfaceKey, setSurfaceKey] = useState<string>('smooth_asphalt');
  const [pressureUnit, setPressureUnit] = useState<'psi' | 'bar' | 'kpa'>(isImperial ? 'psi' : 'bar');

  // Reactively sync with global rider profile
  useEffect(() => {
    if (profile.weightKg) setRiderWeight(profile.weightKg);
    if (profile.bikeWeightKg) setBikeGearWeight(profile.bikeWeightKg);
  }, [profile.weightKg, profile.bikeWeightKg]);

  // Reactively sync default unit with global unit system
  useEffect(() => {
    setPressureUnit(unitSystem === 'imperial' ? 'psi' : 'bar');
  }, [unitSystem]);

  const totalSystemWeight = riderWeight + bikeGearWeight;
  const weightDistRear = 100 - weightDistFront;

  // Compute recommendations
  const result = useMemo(() => {
    const basePsi = getBaseTirePsi(nominalWidth, totalSystemWeight, bikeType);
    const surfaceFactor = SURFACE_FACTORS[surfaceKey]?.factor || 1.0;
    const setupFactor = TIRE_SETUP_FACTORS[tireSetup]?.factor || 1.0;

    let adjustedBase = basePsi * surfaceFactor * setupFactor;

    if (actualWidth && nominalWidth && actualWidth !== nominalWidth) {
      const diff = actualWidth - nominalWidth;
      adjustedBase -= diff * 1.8;
    }

    if (rimInnerWidth && rimInnerWidth >= 21 && nominalWidth <= 30) {
      adjustedBase -= 1.5;
    }

    const frontRatio = (weightDistFront / 50) * 0.94;
    const rearRatio = (weightDistRear / 50) * 1.06;

    let frontRec = Math.round(adjustedBase * frontRatio);
    let rearRec = Math.round(adjustedBase * rearRatio);

    if (bikeType === 'road') {
      frontRec = Math.max(45, Math.min(120, frontRec));
      rearRec = Math.max(48, Math.min(125, rearRec));
    }

    const frontMin = Math.round(frontRec * 0.94);
    const frontMax = Math.round(frontRec * 1.06);
    const rearMin = Math.round(rearRec * 0.94);
    const rearMax = Math.round(rearRec * 1.06);

    const formatVal = (psiVal: number) => {
      if (pressureUnit === 'bar') return (psiVal * 0.0689476).toFixed(2);
      if (pressureUnit === 'kpa') return Math.round(psiVal * 6.89476).toString();
      return Math.round(psiVal).toString();
    };

    const hasHooklessWarning = isHookless && (rearRec > 72.5 || frontRec > 72.5);

    return {
      front: { rec: formatVal(frontRec), min: formatVal(frontMin), max: formatVal(frontMax), rawPsi: frontRec },
      rear: { rec: formatVal(rearRec), min: formatVal(rearMin), max: formatVal(rearMax), rawPsi: rearRec },
      hasHooklessWarning,
      notes: [
        surfaceKey === 'wet_slick' ? '雨天/湿滑路面：建议胎压调低 5~8 PSI 提升橡胶抓地力与刹车循迹性。' : null,
        tireSetup === 'tubeless' ? '真空胎优势：自补液自动密封微小穿孔，可安心使用较低胎压享受极致滤震与更低滚阻。' : '普通内胎：请勿低于推荐下限，以防过坑或减速带发生蛇咬(Pinch Flat)爆胎。',
        actualWidth > nominalWidth ? `实测胎宽(${actualWidth}mm)宽于标称，已自动优化下调胎压以获得更平坦接地印记。` : null,
        hasHooklessWarning ? '⚠️ 无钩圈(Hookless)极限安全气压为 72.5 PSI (5.0 Bar)，计算气压接近或超过上限，建议选用更宽外胎以降低气压！' : null
      ].filter(Boolean) as string[]
    };
  }, [bikeType, totalSystemWeight, tireSetup, nominalWidth, actualWidth, rimInnerWidth, isHookless, weightDistFront, weightDistRear, surfaceKey, pressureUnit]);

  const copyPressureToClipboard = () => {
    const text = `前轮: ${result.front.rec} ${pressureUnit.toUpperCase()} | 后轮: ${result.rear.rec} ${pressureUnit.toUpperCase()} (建议区间: 前 ${result.front.min}-${result.front.max} / 后 ${result.rear.min}-${result.rear.max})`;
    navigator.clipboard.writeText(text);
    showToast('胎压数据已复制到剪贴板！', 'success', text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <Gauge className="w-3.5 h-3.5" />
              滚阻与形变算法
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">公路/全地形智能胎压计算器</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              综合车手体重、真空胎结构、实测胎宽与路面状况，精准计算前后轮差异化最佳气压。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyPressureToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              复制胎压
            </button>

            {/* Unit Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {(['psi', 'bar', 'kpa'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setPressureUnit(u)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium uppercase transition ${
                    pressureUnit === u
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              车辆与骑行参数
            </h2>

            {/* Bike Type Selector */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">车辆类型 (Bike Type)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'road', label: '公路车 (Road)', defaultTire: 28 },
                  { id: 'gravel', label: '全地形 (Gravel)', defaultTire: 40 },
                  { id: 'mtb', label: '山地车 (MTB)', defaultTire: 55 }
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBikeType(b.id as any);
                      setNominalWidth(b.defaultTire);
                      setActualWidth(b.defaultTire + 1);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      bikeType === b.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {language === 'en' ? 'Rider Weight' : language === 'zh-TW' ? '車手淨體重' : '车手净体重'}
                    {profile.weightKg ? (
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal">
                        {language === 'en' ? 'Synced' : '已同步档案'}
                      </span>
                    ) : null}
                  </label>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold text-xs">
                    {isImperial ? `${(riderWeight * 2.20462).toFixed(1)} lbs` : `${riderWeight} kg`}
                  </span>
                </div>
                <input
                  type="number"
                  step={isImperial ? '1' : '0.5'}
                  value={isImperial ? parseFloat((riderWeight * 2.20462).toFixed(1)) : riderWeight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setRiderWeight(isImperial ? parseFloat((val / 2.20462).toFixed(1)) : val);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Bike + Gear' : language === 'zh-TW' ? '車重 + 裝備水壺' : '车重 + 装备水壶'}
                  </label>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold text-xs">
                    {isImperial ? `${(bikeGearWeight * 2.20462).toFixed(1)} lbs` : `${bikeGearWeight} kg`}
                  </span>
                </div>
                <input
                  type="number"
                  step={isImperial ? '0.2' : '0.5'}
                  value={isImperial ? parseFloat((bikeGearWeight * 2.20462).toFixed(1)) : bikeGearWeight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setBikeGearWeight(isImperial ? parseFloat((val / 2.20462).toFixed(1)) : val);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Weight Distribution Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center">
                  前后轮重量分配 (Front / Rear Distribution)
                  <Tooltip content="公路车上体前倾常见比例为前轮 42%~45%，后轮 55%~58%" />
                </label>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold text-xs">前 {weightDistFront}% / 后 {weightDistRear}%</span>
              </div>
              <input
                type="range"
                min="38"
                max="50"
                step="1"
                value={weightDistFront}
                onChange={(e) => setWeightDistFront(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Tire Setup */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">轮胎系统 (Tire Setup)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tubeless', label: '真空胎 (Tubeless)', desc: '更低滚阻与防刺' },
                  { id: 'tube', label: '普通内胎 (Clincher)', desc: 'TPU/丁基胶' },
                  { id: 'tubular', label: '管胎 (Tubular)', desc: '专业竞赛管胎' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTireSetup(t.id as any)}
                    className={`p-2 rounded-xl border text-left transition ${
                      tireSetup === t.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions & Hookless toggle */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">标称胎宽 (mm)</label>
                <select
                  value={nominalWidth}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setNominalWidth(w);
                    setActualWidth(w + 1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {[23, 25, 28, 30, 32, 35, 38, 40, 42, 45, 50, 54].map((w) => (
                    <option key={w} value={w}>{w}c / {w}mm</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">实测胎宽 (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={actualWidth}
                  onChange={(e) => setActualWidth(parseFloat(e.target.value) || nominalWidth)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">车圈内宽 (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={rimInnerWidth}
                  onChange={(e) => setRimInnerWidth(parseFloat(e.target.value) || 21)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Hookless Rim Option */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block">无钩车圈 (Hookless Rim)</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">ETRTO 强制上限 72.5 PSI (5.0 Bar)</span>
              </div>
              <input
                type="checkbox"
                checked={isHookless}
                onChange={(e) => setIsHookless(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Surface Type */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">主要路面条件 (Surface Conditions)</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SURFACE_FACTORS).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => setSurfaceKey(key)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      surfaceKey === key
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-medium">{s.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Results */}
        <div className="lg:col-span-6 space-y-6">
          {/* Hookless Safety Limit Alert Banner */}
          {result.hasHooklessWarning && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs space-y-1.5 shadow-sm">
              <div className="font-bold flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>⚠️ 突破无钩轮圈 (Hookless) ETRTO 极限安全红线！</span>
              </div>
              <p className="leading-relaxed opacity-95">
                当前计算气压（前 {result.front.rec} / 后 {result.rear.rec} {pressureUnit.toUpperCase()}）已突破或迫近国际 ETRTO/ISO 无钩轮圈 <strong>72.5 PSI (5.0 Bar)</strong> 绝对强制安全上限！在无钩轮圈上超压骑行存在瞬间脱圈爆胎的严重安全隐患。强烈建议：<strong>选用 30c 或 32c 更宽规格外胎</strong>，即可在 55-65 PSI 黄金安全气压下享受更低滚阻与极佳抓地力。
              </p>
            </div>
          )}

          {/* Visual Dials Row */}
          <div className="grid grid-cols-2 gap-4">
            <TireGauge
              label="前轮推荐气压仪表"
              psi={result.front.rawPsi}
              minPsi={result.front.rawPsi * 0.94}
              maxPsi={result.front.rawPsi * 1.06}
              unit={pressureUnit}
              displayValue={result.front.rec}
            />
            <TireGauge
              label="后轮推荐气压仪表"
              psi={result.rear.rawPsi}
              minPsi={result.rear.rawPsi * 0.94}
              maxPsi={result.rear.rawPsi * 1.06}
              unit={pressureUnit}
              displayValue={result.rear.rec}
            />
          </div>

          {/* Numerical Display Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase">前轮建议区间</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 my-1">
                {result.front.min} - {result.front.max} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">{pressureUnit.toUpperCase()}</span>
              </div>
              <span className="text-[10px] text-slate-500">前轴抓地与舒适滤震</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase">后轮建议区间</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 my-1">
                {result.rear.min} - {result.rear.max} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">{pressureUnit.toUpperCase()}</span>
              </div>
              <span className="text-[10px] text-slate-500">驱动承重与低滚阻</span>
            </div>
          </div>

          {/* Tips and Explanation Box */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              气压微调与防扎防护建议
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              {result.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{note}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0"></span>
                <span className="leading-relaxed">
                  <strong>温度气压效应：</strong>气温每上升或下降 5°C，外胎气压会随之波动约 1~1.5 PSI。夏季室外暴晒骑行前建议留有余量。
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
