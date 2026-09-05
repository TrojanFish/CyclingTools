import React, { useState, useMemo, useEffect } from 'react';
import { HeartPulse, Flame, Activity, User, Scale, Shield, Sparkles, Droplet, Apple, Heart } from 'lucide-react';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { NumberStepper } from '../common/NumberStepper';

export const HealthCalculator: React.FC = () => {
  const { profile } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const isImperial = unitSystem === 'imperial';

  const [activeTab, setActiveTab] = useState<'fueling' | 'hr_zones' | 'bmr' | 'bmi' | 'bfp'>('fueling');

  // Universal Inputs (Linked with Rider Profile)
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm || 175);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg || 68);
  const [age, setAge] = useState<number>(profile.age || 28);
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender || 'male');
  const [activityFactor, setActivityFactor] = useState<number>(1.55);

  // Heart Rate Inputs
  const [restingHr, setRestingHr] = useState<number>(profile.restingHr || 58);
  const [maxHr, setMaxHr] = useState<number>(profile.maxHr || 190);

  // Reactively synchronize with global rider profile
  useEffect(() => {
    if (profile.heightCm) setHeightCm(profile.heightCm);
    if (profile.weightKg) setWeightKg(profile.weightKg);
    if (profile.age) setAge(profile.age);
    if (profile.gender) setGender(profile.gender);
    if (profile.restingHr) setRestingHr(profile.restingHr);
    if (profile.maxHr) setMaxHr(profile.maxHr);
  }, [profile.heightCm, profile.weightKg, profile.age, profile.gender, profile.restingHr, profile.maxHr]);

  // In-ride Fueling Inputs
  const [rideDurationHours, setRideDurationHours] = useState<number>(3.0);
  const [rideIntensity, setRideIntensity] = useState<'z2' | 'z3' | 'race'>('z3');

  // 1. In-ride Carbohydrate & Fluid Fueling Plan
  const fuelingResult = useMemo(() => {
    let carbsPerHour = 45; // g/h
    let fluidPerHour = 600; // ml/h
    let sodiumPerHour = 450; // mg/h

    if (rideIntensity === 'z2') {
      carbsPerHour = rideDurationHours > 2 ? 40 : 25;
      fluidPerHour = 500;
      sodiumPerHour = 350;
    } else if (rideIntensity === 'z3') {
      carbsPerHour = 60;
      fluidPerHour = 650;
      sodiumPerHour = 500;
    } else {
      carbsPerHour = 80;
      fluidPerHour = 750;
      sodiumPerHour = 650;
    }

    const totalCarbsG = Math.round(carbsPerHour * rideDurationHours);
    const totalFluidL = parseFloat(((fluidPerHour * rideDurationHours) / 1000).toFixed(1));
    const totalSodiumMg = Math.round(sodiumPerHour * rideDurationHours);
    const gelCount = Math.ceil(totalCarbsG / 25); // ~25g carbs per energy gel

    return {
      carbsPerHour,
      fluidPerHour,
      sodiumPerHour,
      totalCarbsG,
      totalFluidL,
      totalSodiumMg,
      gelCount
    };
  }, [rideDurationHours, rideIntensity]);

  // 2. Karvonen Heart Rate Zones Calculation: Target HR = ((MaxHR − RestHR) × %Intensity) + RestHR
  const hrZonesResult = useMemo(() => {
    const hrr = Math.max(20, maxHr - restingHr); // Heart Rate Reserve
    const zones = [
      {
        zone: 'Zone 1 恢复区 (Active Recovery)',
        range: `${Math.round(restingHr + hrr * 0.50)} - ${Math.round(restingHr + hrr * 0.60)} bpm`,
        pct: '50% - 60% HRR',
        desc: '极低强度轻松骑行，促进血液循环与乳酸代谢，适合排酸日。'
      },
      {
        zone: 'Zone 2 有氧燃脂 (Aerobic Endurance)',
        range: `${Math.round(restingHr + hrr * 0.60)} - ${Math.round(restingHr + hrr * 0.70)} bpm`,
        pct: '60% - 70% HRR',
        desc: '线粒体与毛细血管生长核心区间，以脂肪氧化为主要能量供给，长距离骑行基石。'
      },
      {
        zone: 'Zone 3 节奏区间 (Tempo Zone)',
        range: `${Math.round(restingHr + hrr * 0.70)} - ${Math.round(restingHr + hrr * 0.80)} bpm`,
        pct: '70% - 80% HRR',
        desc: '高效率中长途巡航，糖原与脂肪混合代谢，呼吸加深但仍可简短交谈。'
      },
      {
        zone: 'Zone 4 乳酸阈值 (Lactate Threshold)',
        range: `${Math.round(restingHr + hrr * 0.80)} - ${Math.round(restingHr + hrr * 0.90)} bpm`,
        pct: '80% - 90% HRR',
        desc: '乳酸生成与清除平衡临界点，提升竞技巡航耐受力的关键训练区间。'
      },
      {
        zone: 'Zone 5 无氧极限 (Anaerobic / VO2 Max)',
        range: `${Math.round(restingHr + hrr * 0.90)} - ${maxHr} bpm`,
        pct: '90% - 100% HRR',
        desc: '陡坡进攻、卡位冲刺与全速突围极限，肌肉迅速堆积乳酸。'
      }
    ];

    return { hrr, zones };
  }, [restingHr, maxHr]);

  // 3. BMI Calculation
  const bmiResult = useMemo(() => {
    const hM = heightCm / 100;
    const bmi = weightKg / (hM * hM);
    const idealMin = 18.5 * hM * hM;
    const idealMax = 23.9 * hM * hM;

    let category = '正常健康体重';
    let color = 'text-emerald-400';
    if (bmi < 18.5) { category = '偏瘦 / 体重过轻'; color = 'text-sky-400'; }
    else if (bmi <= 23.9) { category = '标准健康体重'; color = 'text-emerald-400'; }
    else if (bmi <= 27.9) { category = '超重 / 偏重'; color = 'text-amber-400'; }
    else if (bmi <= 31.9) { category = '肥胖 (I级)'; color = 'text-rose-400'; }
    else { category = '重度肥胖 (II级)'; color = 'text-rose-500'; }

    return {
      bmi: parseFloat(bmi.toFixed(1)),
      category,
      color,
      idealMin: idealMin.toFixed(1),
      idealMax: idealMax.toFixed(1)
    };
  }, [heightCm, weightKg]);

  // 4. BMR & TDEE (Mifflin-St Jeor)
  const bmrResult = useMemo(() => {
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === 'male') bmr += 5;
    else bmr -= 161;

    const tdee = bmr * activityFactor;
    const loseWeightCal = Math.round(tdee * 0.8);
    const maintainCal = Math.round(tdee);
    const gainMuscleCal = Math.round(tdee * 1.15);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      loseWeightCal,
      maintainCal,
      gainMuscleCal
    };
  }, [heightCm, weightKg, age, gender, activityFactor]);

  // 5. Body Fat Percentage (Deurenberg)
  const bfpResult = useMemo(() => {
    const bmi = bmiResult.bmi;
    const genderVal = gender === 'male' ? 1 : 0;
    const bfp = 1.20 * bmi + 0.23 * age - 10.8 * genderVal - 5.4;
    const bfpClamped = Math.max(3, Math.min(60, bfp));

    let level = '健康水平';
    let levelColor = 'text-emerald-400';
    if (gender === 'male') {
      if (bfpClamped < 6) { level = '必需脂肪 (极低)'; levelColor = 'text-sky-400'; }
      else if (bfpClamped <= 13) { level = '竞技运动员级别'; levelColor = 'text-cyan-400'; }
      else if (bfpClamped <= 17) { level = '健美 / 良好健身'; levelColor = 'text-emerald-400'; }
      else if (bfpClamped <= 24) { level = '健康可接受区间'; levelColor = 'text-amber-400'; }
      else { level = '体脂偏高 / 肥胖'; levelColor = 'text-rose-400'; }
    } else {
      if (bfpClamped < 14) { level = '必需脂肪 (极低)'; levelColor = 'text-sky-400'; }
      else if (bfpClamped <= 20) { level = '竞技运动员级别'; levelColor = 'text-cyan-400'; }
      else if (bfpClamped <= 24) { level = '健美 / 良好健身'; levelColor = 'text-emerald-400'; }
      else if (bfpClamped <= 31) { level = '健康可接受区间'; levelColor = 'text-amber-400'; }
      else { level = '体脂偏高 / 肥胖'; levelColor = 'text-rose-400'; }
    }

    return {
      bfp: parseFloat(bfpClamped.toFixed(1)),
      level,
      levelColor
    };
  }, [bmiResult.bmi, age, gender]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <HeartPulse className="w-3.5 h-3.5" />
              运动生理学与能量代谢
            </div>
            <h1 className="text-2xl font-bold text-slate-100">骑行与运动健康综合计算器</h1>
            <p className="text-slate-400 text-sm mt-1">
              一站式计算骑行能量补给、Karvonen 靶心率区间、BMR 基础代谢、TDEE 每日总能耗及体脂率(BFP)。
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-xl border border-slate-800 gap-1">
            <button
              onClick={() => setActiveTab('fueling')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'fueling' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🍌 碳水能量补给
            </button>
            <button
              onClick={() => setActiveTab('hr_zones')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'hr_zones' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💓 Karvonen 靶心率
            </button>
            <button
              onClick={() => setActiveTab('bmr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'bmr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BMR & TDEE 能耗
            </button>
            <button
              onClick={() => setActiveTab('bmi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'bmi' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BMI 质量指数
            </button>
            <button
              onClick={() => setActiveTab('bfp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'bfp' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BFP 体脂率
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              {language === 'en' ? 'Personal Biometrics & HR (Synced with Rider Profile)' : language === 'zh-TW' ? '個人身體與心率數據 (自動同步車手檔案)' : '个人身体与心率数据 (自动同步车手档案)'}
            </h2>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'en' ? 'Gender' : language === 'zh-TW' ? '生理性別' : '生理性别'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGender('male')}
                    className={`py-2 rounded-xl border text-xs font-medium transition ${
                      gender === 'male'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {language === 'en' ? 'Male' : language === 'zh-TW' ? '男 (Male)' : '男 (Male)'}
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`py-2 rounded-xl border text-xs font-medium transition ${
                      gender === 'female'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {language === 'en' ? 'Female' : language === 'zh-TW' ? '女 (Female)' : '女 (Female)'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'en' ? 'Age' : language === 'zh-TW' ? '年齡' : '年龄'}
                </label>
                <NumberStepper value={age} onChange={setAge} min={10} max={100} unit={language === 'en' ? 'yrs' : '岁'} />
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Height' : language === 'zh-TW' ? '身高' : '身高'} (cm)
                  </label>
                  {isImperial && (
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-medium">
                      {Math.floor(heightCm / 30.48)}'{Math.round((heightCm % 30.48) / 2.54)}"
                    </span>
                  )}
                </div>
                <NumberStepper value={heightCm} onChange={setHeightCm} step={0.5} min={120} max={220} unit="cm" decimals={1} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'en' ? 'Weight' : language === 'zh-TW' ? '體重' : '体重'} ({isImperial ? 'lbs' : 'kg'})
                </label>
                <NumberStepper
                  value={isImperial ? parseFloat((weightKg * 2.20462).toFixed(1)) : weightKg}
                  onChange={(v) => setWeightKg(isImperial ? parseFloat((v / 2.20462).toFixed(1)) : v)}
                  step={isImperial ? 1 : 0.5}
                  min={isImperial ? 66 : 30}
                  max={isImperial ? 330 : 150}
                  unit={isImperial ? 'lbs' : 'kg'}
                  decimals={1}
                />
              </div>
            </div>

            {/* Heart Rate Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'en' ? 'Resting HR' : language === 'zh-TW' ? '靜息心率' : '静息心率'} (bpm)
                </label>
                <NumberStepper value={restingHr} onChange={setRestingHr} min={35} max={100} unit="bpm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'en' ? 'Max HR' : language === 'zh-TW' ? '最大心率' : '最大心率'} (bpm)
                </label>
                <NumberStepper value={maxHr} onChange={setMaxHr} min={140} max={230} unit="bpm" />
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">
                {language === 'en' ? 'Weekly Physical Activity Factor' : language === 'zh-TW' ? '每週運動活動強度' : '每周运动活动强度'}
              </label>
              <select
                value={activityFactor}
                onChange={(e) => setActivityFactor(parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={1.2}>久坐不动 (办公室办公，极少运动) × 1.2</option>
                <option value={1.375}>轻度活跃 (每周轻度骑行 1-3 天) × 1.375</option>
                <option value={1.55}>中度活跃 (每周中等强度骑行 3-5 天) × 1.55</option>
                <option value={1.725}>高强度训练 (每周规律大强度训练 6-7 天) × 1.725</option>
                <option value={1.9}>专业运动员 (每天高负荷骑行两练) × 1.9</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Output Panels */}
        <div className="lg:col-span-7 space-y-6">
          {/* TAB 1: In-ride Fueling Plan View */}
          {activeTab === 'fueling' && (
            <div className="space-y-6">
              {/* Ride Duration & Intensity Selectors */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Apple className="w-4 h-4 text-emerald-400" />
                  本次骑行规划与补给策略
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-slate-300">计划骑行时长</label>
                      <span className="text-cyan-400 font-mono font-semibold text-xs">{rideDurationHours} 小时</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={rideDurationHours}
                      onChange={(e) => setRideDurationHours(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">骑行强度区间</label>
                    <select
                      value={rideIntensity}
                      onChange={(e) => setRideIntensity(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="z2">Z2 轻松长距离耐力 (有氧消耗脂肪为主)</option>
                      <option value="z3">Z3 节奏与爬坡团骑 (中高糖原消耗)</option>
                      <option value="race">Z4+ 竞技高强突围 (极高碳水代谢需求)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Fueling Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-slate-400 text-xs font-medium block">总碳水化合物需求</span>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    {fuelingResult.totalCarbsG} <span className="text-xs text-slate-400 font-sans font-normal">克</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    约合 {fuelingResult.gelCount} 支能量胶
                  </span>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-slate-400 text-xs font-medium block">全程总饮水需求</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {fuelingResult.totalFluidL} <span className="text-xs text-slate-400 font-sans font-normal">升</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {fuelingResult.fluidPerHour} ml / 小时
                  </span>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-slate-400 text-xs font-medium block">电解质钠补充</span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    {fuelingResult.totalSodiumMg} <span className="text-xs text-slate-400 font-sans font-normal">mg</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    预防肌肉抽筋衰竭
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Karvonen Heart Rate Training Zones */}
          {activeTab === 'hr_zones' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    Karvonen 靶心率储备区间 (HRR: {hrZonesResult.hrr} bpm)
                  </h3>
                  <span className="text-[11px] text-slate-400">结合静息心率与最大心率的科学心率区间推导</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-medium">心率区间</th>
                      <th className="pb-2 font-medium">心率储备比例</th>
                      <th className="pb-2 font-medium">目标心率范围 (BPM)</th>
                      <th className="pb-2 font-medium">主要生理刺激</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {hrZonesResult.zones.map((z, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2.5 font-sans font-semibold text-slate-200">{z.zone}</td>
                        <td className="text-slate-400">{z.pct}</td>
                        <td className="text-rose-400 font-bold font-mono">{z.range}</td>
                        <td className="font-sans text-slate-400 text-[11px]">{z.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BMR & TDEE View */}
          {activeTab === 'bmr' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-cyan-950/20">
                  <span className="text-xs font-medium text-slate-400 block">基础代谢率 (BMR)</span>
                  <div className="text-3xl font-bold font-mono text-cyan-400 my-2">
                    {bmrResult.bmr} <span className="text-sm font-sans font-normal text-slate-400">kcal/天</span>
                  </div>
                  <span className="text-[11px] text-slate-500">维持机体存活最基本的能量消耗</span>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-cyan-950/20">
                  <span className="text-xs font-medium text-slate-400 block">每日总能量消耗 (TDEE)</span>
                  <div className="text-3xl font-bold font-mono text-emerald-400 my-2">
                    {bmrResult.tdee} <span className="text-sm font-sans font-normal text-slate-400">kcal/天</span>
                  </div>
                  <span className="text-[11px] text-slate-500">包含日常骑行及所有活动能耗</span>
                </div>
              </div>

              {/* Goals Targets */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  不同目标每日推荐热量摄入 (Calorie Goals)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-xs font-medium text-sky-400">🔥 减脂减重目标</div>
                    <div className="text-xl font-bold font-mono text-slate-100">{bmrResult.loseWeightCal} <span className="text-xs font-normal text-slate-400">kcal</span></div>
                    <p className="text-[10px] text-slate-500">热量缺口 20%，稳步减脂保持肌肉</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-xs font-medium text-emerald-400">⚖️ 体重维持平衡</div>
                    <div className="text-xl font-bold font-mono text-slate-100">{bmrResult.maintainCal} <span className="text-xs font-normal text-slate-400">kcal</span></div>
                    <p className="text-[10px] text-slate-500">收支平衡，维持当前竞技体重</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-xs font-medium text-purple-400">💪 增肌增力目标</div>
                    <div className="text-xl font-bold font-mono text-slate-100">{bmrResult.gainMuscleCal} <span className="text-xs font-normal text-slate-400">kcal</span></div>
                    <p className="text-[10px] text-slate-500">轻微盈余 15%，配合力量训练</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BMI View */}
          {activeTab === 'bmi' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block">身体质量指数 (BMI)</span>
                  <div className="text-4xl font-bold font-mono text-cyan-400 mt-1">
                    {bmiResult.bmi}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">体型评估结论</span>
                  <div className={`text-xl font-bold ${bmiResult.color} mt-1`}>
                    {bmiResult.category}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">同身高健康理想体重参考区间:</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {bmiResult.idealMin} kg - {bmiResult.idealMax} kg
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BFP View */}
          {activeTab === 'bfp' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block">估算体脂率 (BFP)</span>
                  <div className="text-4xl font-bold font-mono text-cyan-400 mt-1">
                    {bfpResult.bfp} <span className="text-xl text-slate-400 font-normal">%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">体脂等级划分</span>
                  <div className={`text-xl font-bold ${bfpResult.levelColor} mt-1`}>
                    {bfpResult.level}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2 font-medium">体脂分类</th>
                      <th className="pb-2 font-medium">男性范围</th>
                      <th className="pb-2 font-medium">女性范围</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    <tr><td className="py-2 font-sans">必需脂肪 (极低)</td><td>2% - 5%</td><td>10% - 13%</td></tr>
                    <tr><td className="py-2 font-sans text-cyan-400">竞技运动员</td><td>6% - 13%</td><td>14% - 20%</td></tr>
                    <tr><td className="py-2 font-sans text-emerald-400">健身良好</td><td>14% - 17%</td><td>21% - 24%</td></tr>
                    <tr><td className="py-2 font-sans">可接受区间</td><td>18% - 24%</td><td>25% - 31%</td></tr>
                    <tr><td className="py-2 font-sans text-rose-400">肥胖</td><td>&gt; 25%</td><td>&gt; 32%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
