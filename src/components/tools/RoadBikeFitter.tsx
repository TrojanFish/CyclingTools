import React, { useState, useMemo, useEffect } from 'react';
import { Ruler, Activity, HelpCircle, CheckCircle2, ChevronRight, User, Printer, Footprints, Shield, FileText, Sparkles, Share2 } from 'lucide-react';
import { BikeDiagram } from '../common/BikeDiagram';
import { Tooltip } from '../common/Tooltip';
import { NumberStepper } from '../common/NumberStepper';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { IOSCard, IOSCardHeader, IOSMetricTile } from '../common/IOSCard';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useToast } from '../../context/ToastContext';
import { ShareCardModal } from '../common/ShareCardModal';
import { generateFittingPoster } from '../../utils/shareCardGenerators';

export const RoadBikeFitter: React.FC = () => {
  const { profile } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const { showToast } = useToast();
  const isImperial = unitSystem === 'imperial';

  // Core Measurements
  const [height, setHeight] = useState<number>(profile.heightCm || 175);
  const [inseam, setInseam] = useState<number>(profile.inseamCm || 81);

  // Reactively synchronize with global rider profile
  useEffect(() => {
    if (profile.heightCm) setHeight(profile.heightCm);
    if (profile.inseamCm) setInseam(profile.inseamCm);
  }, [profile.heightCm, profile.inseamCm]);
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

  // Share Poster State
  const [sharePosterUrl, setSharePosterUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const handleGeneratePoster = async () => {
    try {
      const url = await generateFittingPoster({
        height,
        inseam,
        armLength,
        torso,
        ridingStyle,
        saddleHeight: result.saddleHeight,
        effectiveTopTube: result.effectiveTopTube,
        stemLength: result.stemLength,
        saddleDrop: result.saddleDrop,
        handlebarWidth: result.handlebarWidth * 10,
        crankLength: parseFloat(result.crankLength) || 170,
        frameSize: result.conceptualFrameSize,
        sittingNote: result.sittingHeightNote
      });
      setSharePosterUrl(url);
      setIsShareModalOpen(true);
    } catch (e) {
      showToast('海报生成失败，请重试', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IOSCard variant="default" className="p-6 sm:p-7 relative overflow-hidden isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-purple/15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-purple/10 border border-ios-purple/20 text-ios-purple text-xs font-semibold mb-2">
              <Ruler className="w-3.5 h-3.5" />
              生物力学与几何拟合
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">专业公路车 Fitting 尺寸拟合器</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              根据人体解剖学多维测量，科学推导有效上管 ETT、坐高、座舱落差、Stack/Reach、把立及锁片安装方案。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePoster}
              className="apple-touch flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-ios-purple to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-ios-sm transition active:scale-95 whitespace-nowrap"
              title="生成个人 Fitting 档案长图"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>生成档案卡</span>
            </button>
            <button
              onClick={handlePrint}
              className="apple-touch flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold border border-black/[0.05] dark:border-white/[0.08] transition shadow-ios-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              {language === 'zh-TW' ? '列印工單' : '打印工单'}
            </button>
          </div>
        </div>
      </IOSCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <IOSCard variant="default" className="p-6 space-y-5">
            <IOSCardHeader
              title={language === 'zh-TW' ? '核心生理測量數據' : '核心生理测量数据'}
              subtitle={language === 'zh-TW' ? '人體解剖學精密擬合' : '人体解剖学精密拟合'}
              icon={User}
              iconColor="purple"
            />

            {/* Height & Inseam */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {language === 'zh-TW' ? '身高' : '身高'} (cm)
                  </label>
                  {isImperial && (
                    <span className="text-[10px] text-ios-purple font-mono font-medium">
                      {Math.floor(height / 30.48)}'{Math.round((height % 30.48) / 2.54)}"
                    </span>
                  )}
                </div>
                <NumberStepper value={height} onChange={setHeight} step={0.5} min={130} max={220} unit="cm" decimals={1} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    {language === 'zh-TW' ? '跨高' : '跨高'} (cm)
                    <Tooltip content="赤脚靠墙站立，双脚间距15cm，用硬皮书夹紧会阴部测量地面到书顶垂直距离。" />
                  </label>
                  {isImperial && (
                    <span className="text-[10px] text-ios-purple font-mono font-medium">
                      {(inseam / 2.54).toFixed(1)}"
                    </span>
                  )}
                </div>
                <NumberStepper value={inseam} onChange={setInseam} step={0.5} min={50} max={110} unit="cm" decimals={1} />
              </div>
            </div>

            {/* Torso & Arm */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '軀幹長' : '躯干长'} (cm)
                </label>
                <NumberStepper value={torso} onChange={setTorso} step={0.5} min={40} max={85} unit="cm" decimals={1} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '手臂長' : '手臂长'} (cm)
                </label>
                <NumberStepper value={armLength} onChange={setArmLength} step={0.5} min={45} max={90} unit="cm" decimals={1} />
              </div>
            </div>

            {/* Shoulder Width */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                {language === 'zh-TW' ? '肩寬' : '肩宽'} (cm)
              </label>
              <NumberStepper value={shoulderWidth} onChange={setShoulderWidth} step={0.5} min={34} max={50} unit="cm" decimals={1} />
            </div>

            {/* Riding Style */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">
                {language === 'zh-TW' ? '騎行目標偏好' : '骑行目标偏好'}
              </label>
              <IOSSegmentedControl
                options={[
                  { id: 'recreational', label: language === 'zh-TW' ? '休閒騎遊' : '休闲骑游' },
                  { id: 'endurance', label: language === 'zh-TW' ? '長途耐力' : '长途耐力' },
                  { id: 'racing', label: language === 'zh-TW' ? '競技突圍' : '竞技突围' },
                ]}
                value={ridingStyle}
                onChange={(val) => setRidingStyle(val as any)}
                size="md"
              />
            </div>

            {/* Flexibility */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">
                {language === 'zh-TW' ? '身體柔韌度' : '身体柔韧度'}
              </label>
              <IOSSegmentedControl
                options={[
                  { id: 'low', label: language === 'zh-TW' ? '較低' : '较低' },
                  { id: 'medium', label: language === 'zh-TW' ? '正常' : '正常' },
                  { id: 'high', label: language === 'zh-TW' ? '極佳' : '极佳' },
                ]}
                value={flexibility}
                onChange={(val) => setFlexibility(val as any)}
                size="md"
              />
            </div>

            {/* Advanced Extra Measurements Accordion */}
            <div className="border-t border-black/[0.05] dark:border-white/[0.08] pt-3">
              <button
                onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition py-1 apple-touch"
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-ios-purple" />
                  {language === 'zh-TW' ? '進階測量 (坐高/腿長)' : '进阶测量 (坐高/腿长)'}
                </span>
                <span className="text-ios-purple font-mono text-[11px]">{showAdvancedInputs ? '▲' : '▼'}</span>
              </button>

              {showAdvancedInputs && (
                <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      {language === 'zh-TW' ? '坐高' : '坐高'} (cm)
                    </label>
                    <NumberStepper value={sittingHeight} onChange={setSittingHeight} min={70} max={115} unit="cm" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      {language === 'zh-TW' ? '大腿長' : '大腿长'} (cm)
                    </label>
                    <NumberStepper value={thighLength} onChange={setThighLength} min={30} max={65} unit="cm" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      {language === 'zh-TW' ? '小腿長' : '小腿长'} (cm)
                    </label>
                    <NumberStepper value={lowerLegLength} onChange={setLowerLegLength} min={30} max={65} unit="cm" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                      {language === 'zh-TW' ? '腳長' : '脚长'} (cm)
                    </label>
                    <NumberStepper value={footLength} onChange={setFootLength} min={20} max={35} unit="cm" />
                  </div>
                </div>
              )}
            </div>
          </IOSCard>
        </div>

        {/* Right Output & Interactive Bike Diagram */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Bike Diagram */}
          <IOSCard variant="default" className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {language === 'zh-TW' ? '公路車關鍵擬合幾何實時矢量圖譜' : '公路车关键拟合几何实时矢量图谱'}
              </span>
              <span className="text-xs font-mono text-ios-blue font-bold">
                {'推荐车架标号'}: {result.conceptualFrameSize}
              </span>
            </div>
            <BikeDiagram
              ett={result.effectiveTopTube}
              saddleHeight={result.saddleHeight}
              stemLength={result.stemLength}
              handlebarWidth={result.handlebarWidth}
              saddleSetback={result.saddleSetback}
              saddleDrop={result.saddleDrop}
            />
          </IOSCard>

          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <IOSMetricTile
              label={language === 'zh-TW' ? '推薦坐高' : '推荐坐高'}
              value={result.saddleHeight}
              unit="cm"
              subtext={isImperial ? `${(result.saddleHeight / 2.54).toFixed(1)} in | 中轴至坐垫顶` : '中轴中心至坐垫顶'}
              accentColor="purple"
            />

            <IOSMetricTile
              label={language === 'zh-TW' ? '有效上管 (ETT)' : '有效上管 (ETT)'}
              value={result.effectiveTopTube}
              unit="cm"
              subtext={isImperial ? `${(result.effectiveTopTube / 2.54).toFixed(1)} in | 水平上管长` : '水平有效上管长'}
              accentColor="blue"
            />

            <IOSMetricTile
              label={language === 'zh-TW' ? '坐墊後移' : '坐垫后移'}
              value={result.saddleSetback}
              unit="cm"
              subtext="鼻头距离五通垂线"
              accentColor="green"
            />

            <IOSMetricTile
              label={language === 'zh-TW' ? '座艙落差 (Drop)' : '座舱落差 (Drop)'}
              value={result.saddleDrop}
              unit="cm"
              subtext="坐垫顶与车把高差"
              accentColor="orange"
            />
          </div>

          {/* Stack & Reach + Body Proportion Analysis */}
          <IOSCard variant="default" className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-ios-purple" />
              {language === 'zh-TW' ? '車架堆高與前伸量 (Stack & Reach) 與身材特徵推斷' : '车架堆高与前伸量 (Stack & Reach) 与身材特征推断'}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08]">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  {'建议车架 Stack (堆高)'}
                </span>
                <span className="text-base font-bold font-mono text-ios-blue">
                  ~{result.estimatedStack} mm {isImperial ? `(${(result.estimatedStack / 25.4).toFixed(1)} in)` : ''}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08]">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  {'建议车架 Reach (前伸)'}
                </span>
                <span className="text-base font-bold font-mono text-ios-blue">
                  ~{result.estimatedReach} mm {isImperial ? `(${(result.estimatedReach / 25.4).toFixed(1)} in)` : ''}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ios-purple mt-1.5 shrink-0"></span>
                <span>{result.sittingHeightNote}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>{result.thighLowerLegNote}</span>
              </div>
            </div>
          </IOSCard>

          {/* Cleat & Cockpit Advice Card */}
          <IOSCard variant="default" className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-ios-purple" />
              {language === 'zh-TW' ? 'KOPS 膝關節鉛垂線檢測與鎖片生物力學' : 'KOPS 膝关节铅垂线检测与锁片生物力学'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] space-y-1.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {'KOPS 膝盖铅垂线校准'}
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {'曲柄旋转至水平 3 点钟方向，用重物铅垂线自膝盖骨前缘（髌骨窝）垂直下放：铅垂线应精确穿过脚踏轴心（±5mm）。前移过多加重髌骨压迫，后移过多加重腘绳肌负荷。'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] space-y-1.5">
                <span className="font-semibold text-ios-blue flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5" />
                  {'锁片前后位与肌群负荷'}
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {'锁片基准位为第一与第五跖骨关节中线向后 2~5mm。偏后安装（中足发力）可卸载小腿腓肠肌与跟腱压力，降低抽筋率并利于长距离耐力；偏前冲刺反应快但加重足弓负荷。'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] space-y-1">
                <span className="font-semibold text-purple-600 dark:text-purple-300 block">
                  {`推荐把立: ${result.stemLength}mm | 弯把宽: ${result.handlebarWidth}cm`}
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  {'上把位手变安装应保持手腕自然平直，弯把 Reach 建议选用 70~80mm 紧凑小弯把。'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] space-y-1">
                <span className="font-semibold text-amber-600 dark:text-amber-300 block">
                  {`推荐曲柄: ${result.crankLength} | 浮动锁片`}
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  {'较短曲柄可改善上止点髋关节闭合角，降低膝盖屈曲压力；建议搭配 4.5°~6° 浮动锁片。'}
                </p>
              </div>
            </div>
          </IOSCard>

          {/* Action Button: Generate Fitter Share Card */}
          <button
            type="button"
            onClick={handleGeneratePoster}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-ios-purple/10 via-pink-500/10 to-ios-purple/10 hover:from-ios-purple/20 hover:via-pink-500/20 hover:to-ios-purple/20 border border-ios-purple/30 text-ios-purple font-semibold text-xs shadow-ios-sm flex items-center justify-center gap-2 transition apple-touch"
            title="生成公路车几何与设定处方笺海报"
          >
            <Share2 className="w-4 h-4" />
            <span>📸 {language === 'zh-TW' ? '生成專業 Fitting 幾何處方箋 (長圖分享)' : '生成专业 Fitting 几何处方笺 (长图分享)'}</span>
          </button>
        </div>
      </div>

      {/* Social Share Poster Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        posterUrl={sharePosterUrl}
        fileName={`Fitting调校档案_${height}cm_${result.conceptualFrameSize}.png`}
        title="公路车 Fitting 档案海报"
      />
    </div>
  );
};
