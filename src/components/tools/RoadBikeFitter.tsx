import React, { useState, useMemo } from 'react';
import { Ruler, Activity, HelpCircle, CheckCircle2, ChevronRight, User, Printer, Footprints, Shield, FileText, Sparkles } from 'lucide-react';
import { BikeDiagram } from '../common/BikeDiagram';
import { Tooltip } from '../common/Tooltip';
import { NumberStepper } from '../common/NumberStepper';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useToast } from '../../context/ToastContext';

export const RoadBikeFitter: React.FC = () => {
  const { profile } = useRiderProfile();
  const { showToast } = useToast();

  // Core Measurements
  const [height, setHeight] = useState<number>(profile.heightCm || 175);
  const [inseam, setInseam] = useState<number>(profile.inseamCm || 81);
  const [torso, setTorso] = useState<number>(60);
  const [armLength, setArmLength] = useState<number>(62);
  const [shoulderWidth, setShoulderWidth] = useState<number>(42);

  // Advanced Optional Measurements
  const [sittingHeight, setSittingHeight] = useState<number>(90);
  const [thighLength, setThighLength] = useState<number>(43);
  const [lowerLegLength, setLowerLegLength] = useState<number>(42);
  const [footLength, setFootLength] = useState<number>(26);

  // Preferences
  const [ridingStyle, setRidingStyle] = useState<'recreational' | 'endurance' | 'racing'>('endurance');
  const [flexibility, setFlexibility] = useState<'low' | 'medium' | 'high'>('medium');
  const [showAdvancedInputs, setShowAdvancedInputs] = useState<boolean>(false);

  // Comprehensive Fitting Calculation
  const result = useMemo(() => {
    // 1. Saddle height formulas comparison (LeMond 0.883 vs 109% Hamley-Thomas)
    const saddleHeightLeMond = inseam * 0.883;
    const saddleHeightHamley = (inseam * 1.09) - 17.0; // from pedal axle

    // 2. Effective Top Tube (ETT)
    let ett = ((torso + armLength) * 0.53) - (ridingStyle === 'racing' ? 0.5 : 1.5);
    if (flexibility === 'high') ett += 0.5;
    if (flexibility === 'low') ett -= 0.8;

    // 3. Stem length
    let stem = 100;
    if (height < 165) stem = 80;
    else if (height < 172) stem = 90;
    else if (height < 180) stem = 100;
    else if (height < 188) stem = 110;
    else stem = 120;

    if (flexibility === 'low') stem -= 10;
    if (ridingStyle === 'racing') stem += 10;

    // 4. Handlebar width
    const hbWidth = shoulderWidth;

    // 5. Crank length
    let crank = '170mm';
    if (inseam < 74) crank = '165mm';
    else if (inseam <= 79) crank = '167.5mm / 170mm';
    else if (inseam <= 84) crank = '170mm / 172.5mm';
    else crank = '172.5mm / 175mm';

    // 6. Saddle Setback & Drop
    const saddleSetback = parseFloat((saddleHeightLeMond * 0.08 + 1.2).toFixed(1));
    let saddleDrop = 5.0; // cm
    if (ridingStyle === 'recreational') saddleDrop = 3.5;
    else if (ridingStyle === 'endurance') saddleDrop = 5.5;
    else saddleDrop = 8.5;
    if (flexibility === 'high') saddleDrop += 1.5;
    if (flexibility === 'low') saddleDrop -= 1.5;

    // 7. Stack & Reach Estimation
    const estimatedStack = Math.round(inseam * 6.8 + (ridingStyle === 'recreational' ? 25 : 0));
    const estimatedReach = Math.round(ett * 10 * 0.72 - (ridingStyle === 'racing' ? 0 : 10));

    // 8. Body Proportion Analysis
    let sittingHeightNote = '身长与腿长比例标准均衡。';
    const sittingRatio = sittingHeight / height;
    if (sittingRatio > 0.53) {
      sittingHeightNote = '身体特征：上半身躯干偏长，腿部相对较短，可考虑选择 Stack 适中、Reach 略长的车架或稍长把立。';
    } else if (sittingRatio < 0.50) {
      sittingHeightNote = '身体特征：长腿短躯干比例，座管拔出高度较高，推荐选择高 Stack、短 Reach 的耐力/爬坡几何。';
    }

    let thighLowerLegNote = '大腿与小腿长度比例适中。';
    if (thighLength > lowerLegLength * 1.08) {
      thighLowerLegNote = '大腿相对小腿偏长：建议适当加大坐垫后移量(Setback)，以避免膝盖前移超过脚踏轴心。';
    }

    // 9. Frame Size Category
    let frameSize = 'M (52-54cm)';
    if (height < 162) frameSize = 'XXS (44-46cm)';
    else if (height < 168) frameSize = 'XS (47-49cm)';
    else if (height < 174) frameSize = 'S (50-52cm)';
    else if (height < 180) frameSize = 'M (52-54cm)';
    else if (height < 186) frameSize = 'L (55-57cm)';
    else frameSize = 'XL (58-60cm+)';

    return {
      saddleHeight: parseFloat(saddleHeightLeMond.toFixed(1)),
      saddleHeightHamley: parseFloat(saddleHeightHamley.toFixed(1)),
      effectiveTopTube: parseFloat(ett.toFixed(1)),
      stemLength: stem,
      handlebarWidth: hbWidth,
      crankLength: crank,
      saddleSetback,
      saddleDrop: parseFloat(saddleDrop.toFixed(1)),
      conceptualFrameSize: frameSize,
      estimatedStack,
      estimatedReach,
      sittingHeightNote,
      thighLowerLegNote,
      generalAdvice: [
        '初次设定请以脚跟踩在脚踏最低点时膝盖完全伸直为基准，穿上锁鞋后膝关节保持 25°~35° 微屈角。',
        ridingStyle === 'racing'
          ? '竞技激进几何：较低的座舱落差(Drop)能提供更低迎风面积，需配合良好的腘绳肌柔韧性与核心支撑。'
          : '耐力舒适几何：把立垫圈可适当保留 15~25mm，减少腰背及颈部长时间骑行的肌肉疲劳。'
      ]
    };
  }, [height, inseam, torso, armLength, shoulderWidth, sittingHeight, thighLength, lowerLegLength, footLength, ridingStyle, flexibility]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Ruler className="w-3.5 h-3.5" />
              生物力学与几何拟合
            </div>
            <h1 className="text-2xl font-bold text-slate-100">专业公路车 Fitting 尺寸拟合器</h1>
            <p className="text-slate-400 text-sm mt-1">
              根据人体解剖学多维测量，科学推导有效上管 ETT、坐高、座舱落差、Stack/Reach、把立及锁片安装方案。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              打印 Fitting 工单
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              核心生理测量数据
            </h2>

            {/* Height & Inseam */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">身高 Height (cm)</label>
                <NumberStepper value={height} onChange={setHeight} step={0.5} min={130} max={220} unit="cm" decimals={1} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center">
                  跨高 Inseam (cm)
                  <Tooltip content="赤脚靠墙站立，双脚间距15cm，用硬皮书夹紧会阴部测量地面到书顶垂直距离。" />
                </label>
                <NumberStepper value={inseam} onChange={setInseam} step={0.5} min={50} max={110} unit="cm" decimals={1} />
              </div>
            </div>

            {/* Torso & Arm */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">躯干长 Torso (cm)</label>
                <NumberStepper value={torso} onChange={setTorso} step={0.5} min={40} max={85} unit="cm" decimals={1} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">臂长 Arm (cm)</label>
                <NumberStepper value={armLength} onChange={setArmLength} step={0.5} min={45} max={90} unit="cm" decimals={1} />
              </div>
            </div>

            {/* Shoulder Width */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">肩宽 Shoulder (cm)</label>
              <NumberStepper value={shoulderWidth} onChange={setShoulderWidth} step={0.5} min={34} max={50} unit="cm" decimals={1} />
            </div>

            {/* Riding Style */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">骑行目标偏好 (Riding Style)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'recreational', label: '休闲骑游', desc: '舒适直立' },
                  { id: 'endurance', label: '长途耐力', desc: '均衡适中' },
                  { id: 'racing', label: '竞技突围', desc: '破风激进' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setRidingStyle(s.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      ridingStyle === s.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{s.label}</div>
                    <div className="text-[10px] text-slate-500">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Flexibility */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">身体柔韧度 (Flexibility)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: '较低 (指触不到地)' },
                  { id: 'medium', label: '正常 (指尖触地)' },
                  { id: 'high', label: '极佳 (手掌触地)' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFlexibility(f.id as any)}
                    className={`py-2 px-1 rounded-xl border text-center text-xs transition ${
                      flexibility === f.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Extra Measurements Accordion */}
            <div className="border-t border-slate-800/80 pt-3">
              <button
                onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition py-1"
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  进阶身体比例测量（坐高、大腿、小腿）
                </span>
                <span className="text-cyan-400 font-mono text-[11px]">{showAdvancedInputs ? '收起 ▲' : '展开 ▼'}</span>
              </button>

              {showAdvancedInputs && (
                <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">坐高 (cm)</label>
                    <NumberStepper value={sittingHeight} onChange={setSittingHeight} min={70} max={115} unit="cm" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">大腿长 (cm)</label>
                    <NumberStepper value={thighLength} onChange={setThighLength} min={30} max={65} unit="cm" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">小腿长 (cm)</label>
                    <NumberStepper value={lowerLegLength} onChange={setLowerLegLength} min={30} max={65} unit="cm" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">脚长 (cm)</label>
                    <NumberStepper value={footLength} onChange={setFootLength} min={20} max={35} unit="cm" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Output & Interactive Bike Diagram */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Bike Diagram */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-200">公路车关键拟合几何实时矢量图谱</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">推荐车架标号: {result.conceptualFrameSize}</span>
            </div>
            <BikeDiagram
              ett={result.effectiveTopTube}
              saddleHeight={result.saddleHeight}
              stemLength={result.stemLength}
              handlebarWidth={result.handlebarWidth}
              saddleSetback={result.saddleSetback}
              saddleDrop={result.saddleDrop}
            />
          </div>

          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 text-xs font-medium block">推荐坐高 (Saddle)</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {result.saddleHeight} <span className="text-xs text-slate-400 font-sans font-normal">cm</span>
              </div>
              <span className="text-[10px] text-slate-500">中轴中心至坐垫顶</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 text-xs font-medium block">有效上管 (ETT)</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {result.effectiveTopTube} <span className="text-xs text-slate-400 font-sans font-normal">cm</span>
              </div>
              <span className="text-[10px] text-slate-500">水平有效上管长</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 text-xs font-medium block">坐垫后移 (Setback)</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {result.saddleSetback} <span className="text-xs text-slate-400 font-sans font-normal">cm</span>
              </div>
              <span className="text-[10px] text-slate-500">鼻头距离五通垂线</span>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 text-xs font-medium block">座舱落差 (Drop)</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {result.saddleDrop} <span className="text-xs text-slate-400 font-sans font-normal">cm</span>
              </div>
              <span className="text-[10px] text-slate-500">坐垫顶与车把高差</span>
            </div>
          </div>

          {/* Stack & Reach + Body Proportion Analysis */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              车架堆高与前伸量 (Stack & Reach) 与身材特征推断
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">建议车架 Stack (堆高)</span>
                <span className="text-base font-bold font-mono text-cyan-400">~{result.estimatedStack} mm</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">建议车架 Reach (前伸)</span>
                <span className="text-base font-bold font-mono text-cyan-400">~{result.estimatedReach} mm</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                <span>{result.sittingHeightNote}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>{result.thighLowerLegNote}</span>
              </div>
            </div>
          </div>

          {/* Cleat & Cockpit Advice Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-cyan-400" />
              锁片安装、把立与曲柄搭配指南
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <span className="font-semibold text-cyan-300 block">推荐把立: {result.stemLength}mm | 弯把宽: {result.handlebarWidth}cm</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  上把位手变安装应保持手腕自然平直，弯把 Reach 建议选用 70~80mm 紧凑小弯把。
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-300 block">推荐曲柄: {result.crankLength} | 浮动锁片</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  锁片中线对齐第一与第五跖骨联线偏后 2~4mm，初学者推荐选用 4.5°~6° 浮动锁片保护膝盖。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
