import React, { useState, useMemo } from 'react';
import { Link, CheckCircle2, AlertTriangle, Info, Share2, Settings, ArrowRight, ShieldCheck, Zap, Lightbulb } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { NumberStepper } from '../common/NumberStepper';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { IOSCard, IOSMetricTile } from '../common/IOSCard';
import { ShareCardModal } from '../common/ShareCardModal';
import { generateChainLengthPoster } from '../../utils/shareCardGenerators';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

export const ChainLengthCalculator: React.FC = () => {
  const { showToast } = useToast();
  const { language } = useLanguageAndUnit();

  // Share Poster State
  const [sharePosterUrl, setSharePosterUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const [chainstayLengthMm, setChainstayLengthMm] = useState<number>(410);
  const [bigRing, setBigRing] = useState<number>(50);
  const [smallRing, setSmallRing] = useState<number>(34);
  const [isSingleRing, setIsSingleRing] = useState<boolean>(false);
  const [bigCog, setBigCog] = useState<number>(34);
  const [smallCog, setSmallCog] = useState<number>(11);
  const [pulleyTeeth, setPulleyTeeth] = useState<number>(11); // 11T standard or 12/14T oversized
  const [isFullSuspension, setIsFullSuspension] = useState<boolean>(false);
  const [chainstayGrowthMm, setChainstayGrowthMm] = useState<number>(20);

  const [activePreset, setActivePreset] = useState<string | null>('compact_34');

  // Preset Configurations
  const loadPreset = (type: string) => {
    setActivePreset(type);
    if (type === 'compact_34') {
      setIsSingleRing(false);
      setBigRing(50);
      setSmallRing(34);
      setBigCog(34);
      setSmallCog(11);
      setChainstayLengthMm(410);
      setPulleyTeeth(11);
      showToast('已加载压缩盘 50/34T + 11-34T 预设', 'info');
    } else if (type === 'semi_30') {
      setIsSingleRing(false);
      setBigRing(52);
      setSmallRing(36);
      setBigCog(30);
      setSmallCog(11);
      setChainstayLengthMm(410);
      setPulleyTeeth(11);
      showToast('已加载半压缩 52/36T + 11-30T 预设', 'info');
    } else if (type === 'sram_axs') {
      setIsSingleRing(false);
      setBigRing(48);
      setSmallRing(35);
      setBigCog(33);
      setSmallCog(10);
      setChainstayLengthMm(410);
      setPulleyTeeth(12);
      showToast('已加载 SRAM AXS 48/35T + 10-33T 预设', 'info');
    } else if (type === 'gravel_1x') {
      setIsSingleRing(true);
      setBigRing(40);
      setSmallRing(40);
      setBigCog(44);
      setSmallCog(10);
      setChainstayLengthMm(425);
      setPulleyTeeth(12);
      showToast('已加载 Gravel 单盘 40T + 10-44T 预设', 'info');
    }
  };

  // Comprehensive Calculation
  const result = useMemo(() => {
    // 1. Effective Chainstay (accounting for full-suspension bottom-out stretch)
    const effectiveChainstayMm = isFullSuspension ? chainstayLengthMm + chainstayGrowthMm : chainstayLengthMm;
    const cInches = effectiveChainstayMm / 25.4;
    const rawLinksRigby = 2 * cInches + bigRing / 4 + bigCog / 4 + 1;
    // Oversized pulley wheel compensation (if 14T+ add 1 link)
    const pulleyExtra = pulleyTeeth > 11 ? (pulleyTeeth - 11) * 0.3 : 0;
    const finalRawLinks = rawLinksRigby + pulleyExtra;

    // Must be an even integer for standard inner-outer link pairs
    const recommendedLinksEven = Math.ceil(finalRawLinks / 2) * 2;
    const chainLengthInches = (recommendedLinksEven * 0.5).toFixed(1); // Standard 1/2" pitch

    // 2. Shimano / SRAM Direct Method (Large-Large + 2 links with quick link)
    const shimanoMethodLinks = Math.ceil((2 * cInches + (bigRing + bigCog) / 4 + (isSingleRing ? 3 : 2)) / 2) * 2;

    // 3. Drivetrain Capacity Check (后拨齿容量校核)
    const frontDifference = isSingleRing ? 0 : Math.max(0, bigRing - smallRing);
    const rearDifference = Math.max(0, bigCog - smallCog);
    const requiredCapacity = frontDifference + rearDifference;
    const isRingInverted = !isSingleRing && smallRing >= bigRing;
    const isCogInverted = smallCog >= bigCog;

    let rearDerailleurRecommendation = '短腿 (SS: ~30T) 或 中腿 (GS)';
    let isCapacityWarning = false;

    if (requiredCapacity > 41) {
      rearDerailleurRecommendation = '超长腿 (SGS: 43T+)';
    } else if (requiredCapacity > 34) {
      rearDerailleurRecommendation = '中腿 (GS: 35~41T)';
    } else {
      rearDerailleurRecommendation = '短腿 (SS: 28~34T) 或 中腿 (GS)';
    }

    if (bigCog > 34 && requiredCapacity > 39) {
      isCapacityWarning = true;
    }

    return {
      recommendedLinks: recommendedLinksEven,
      chainLengthInches,
      shimanoMethodLinks,
      requiredCapacity,
      rearDerailleurRecommendation,
      isCapacityWarning,
      isRingInverted,
      isCogInverted,
      rawFloat: finalRawLinks.toFixed(2)
    };
  }, [chainstayLengthMm, chainstayGrowthMm, isFullSuspension, bigRing, smallRing, isSingleRing, bigCog, smallCog, pulleyTeeth]);

  const handleGeneratePoster = () => {
    const url = generateChainLengthPoster({
      chainstayMm: chainstayLengthMm,
      frontRings: isSingleRing ? `${bigRing}T 单盘` : `${bigRing}/${smallRing}T 双盘`,
      rearCogs: `${smallCog}-${bigCog}T`,
      recommendedLinks: result.recommendedLinks,
      chainLengthInches: parseFloat(result.chainLengthInches) || 0,
      requiredCapacity: result.requiredCapacity,
      derailleurRecommendation: result.rearDerailleurRecommendation,
      isFullSuspension
    });
    setSharePosterUrl(url);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IOSCard variant="glass" className="relative overflow-hidden isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-blue/15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-xs font-semibold mb-2">
              <Link className="w-3.5 h-3.5" />
              传动几何与链条物理
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">链条长度与齿容量计算器</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              换大飞轮或大盘必备！根据后下叉 RC 长度、齿数与大导轮补偿，精准计算最佳截链节数，并校验后拨总齿容量。
            </p>
          </div>

          <button
            onClick={handleGeneratePoster}
            className="apple-touch flex items-center gap-1.5 px-3.5 py-2 bg-ios-blue/10 hover:bg-ios-blue/20 dark:bg-ios-blue/20 text-ios-blue rounded-xl text-xs font-semibold border border-ios-blue/25 transition self-start md:self-auto shadow-ios-sm active:scale-95 whitespace-nowrap shrink-0"
            title="生成截链节数与后拨容量规范海报"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>生成截链规范卡</span>
          </button>
        </div>
      </IOSCard>

      {/* Preset Buttons */}
      <IOSCard variant="default" className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          {language === 'zh-TW' ? '規格預設:' : '规格预设:'}
        </span>
        <div className="w-full sm:max-w-xl">
          <IOSSegmentedControl
            options={[
              { value: 'compact_34', label: '公路 50/34T' },
              { value: 'semi_30', label: '公路 52/36T' },
              { value: 'sram_axs', label: 'AXS 48/35T' },
              { value: 'gravel_1x', label: 'Gravel 40T' },
            ]}
            value={activePreset || ''}
            onChange={(val) => loadPreset(val)}
            size="sm"
          />
        </div>
      </IOSCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <IOSCard variant="default" className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-ios-blue" />
              车架几何与齿盘参数
            </h2>

            {/* Chainstay Length */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center">
                后下叉长度 Chainstay RC (mm)
                <Tooltip content="五通中轴中心至后轮快拆/桶轴中心的直线距离，绝大多数公路车为 405~415mm，Gravel/耐力车为 420~435mm。" />
              </label>
              <NumberStepper
                value={chainstayLengthMm}
                onChange={setChainstayLengthMm}
                step={1}
                min={390}
                max={460}
                unit="mm"
              />
            </div>

            {/* Frame Suspension Type */}
            <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">全避震软尾补偿 (Full Suspension)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">后避震压缩触底时后下叉转点拉伸拉长</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFullSuspension}
                  onChange={(e) => setIsFullSuspension(e.target.checked)}
                  className="w-4 h-4 rounded accent-ios-blue cursor-pointer"
                />
              </div>

              {isFullSuspension && (
                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">压缩触底拉伸量 (Chainstay Growth)</span>
                    <span className="font-mono text-ios-blue font-bold">+{chainstayGrowthMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={35}
                    step={1}
                    value={chainstayGrowthMm}
                    onChange={(e) => setChainstayGrowthMm(Number(e.target.value))}
                    className="w-full accent-ios-blue cursor-pointer h-1.5 bg-black/[0.06] dark:bg-white/[0.1] rounded"
                  />
                  <span className="text-[10px] text-ios-orange flex items-start gap-1 pt-0.5">
                    <Lightbulb className="w-3.5 h-3.5 text-ios-orange shrink-0 mt-0.5" />
                    <span>{language === 'zh-TW' ? `已自動在有效後下叉中計入 ${chainstayGrowthMm}mm 拉伸並增加安全鏈節，杜絕大飛大盤衝擊觸底拉爆後撥！` : `已自动在有效后下叉中计入 ${chainstayGrowthMm}mm 拉伸并增加安全链节，杜绝大飞大盘冲击触底拉爆后拨！`}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Drivetrain 1x or 2x */}
            <div className="pt-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">齿盘系统</label>
              <IOSSegmentedControl
                options={[
                  { id: '2x', label: '双盘 (2x)' },
                  { id: '1x', label: '单盘 (1x)' },
                ]}
                value={isSingleRing ? '1x' : '2x'}
                onChange={(val) => setIsSingleRing(val === '1x')}
                size="sm"
              />
            </div>

            {/* Chainrings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isSingleRing ? '单盘齿数 (T)' : '最大大盘齿数 (T)'}
                </label>
                <NumberStepper value={bigRing} onChange={setBigRing} min={30} max={60} unit="T" />
              </div>
              {!isSingleRing && (
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">最小小盘齿数 (T)</label>
                  <NumberStepper value={smallRing} onChange={setSmallRing} min={28} max={46} unit="T" />
                </div>
              )}
            </div>

            {/* Cassette */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">飞轮最大片齿数 (T)</label>
                <NumberStepper value={bigCog} onChange={setBigCog} min={25} max={52} unit="T" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">飞轮最小片齿数 (T)</label>
                <NumberStepper value={smallCog} onChange={setSmallCog} min={9} max={14} unit="T" />
              </div>
            </div>

            {/* Pulley Teeth */}
            <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.08]">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center">
                后拨导轮规格 (Pulley Wheels)
                <Tooltip content="标准原厂导轮一般为 11T/12T；若改装超大导轮系统（如 14T/16T/18T 大鸡腿），需相应补偿链节。" />
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { teeth: 11, label: '标准原厂 (11T)' },
                  { teeth: 12, label: 'AXS/新型 (12T)' },
                  { teeth: 14, label: '大鸡腿改装 (14T+)' }
                ].map((p) => {
                  const isSelected = pulleyTeeth === p.teeth;
                  return (
                    <button
                      key={p.teeth}
                      onClick={() => setPulleyTeeth(p.teeth)}
                      className={`py-2 px-1 rounded-xl border text-center transition apple-touch ${
                        isSelected
                          ? 'bg-ios-blue text-white border-ios-blue font-bold shadow-xs ring-1.5 ring-ios-blue/30 scale-[1.01]'
                          : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className={isSelected ? 'font-bold text-white' : ''}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </IOSCard>
        </div>

        {/* Right Outputs & Visualization */}
        <div className="lg:col-span-7 space-y-6">
          {(result.isRingInverted || result.isCogInverted) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-400 text-xs shadow-ios-sm animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-bold block text-sm mb-0.5">齿盘参数设置异常提醒</span>
                <span>
                  {result.isRingInverted && '小盘齿数不能大于或等于大盘齿数；'}
                  {result.isCogInverted && '飞轮最小片齿数不能大于或等于最大片齿数；'}
                  系统已做安全回退保护，请修正齿数输入以获得最精准的截链建议。
                </span>
              </div>
            </div>
          )}

          {/* Main Key Link Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <IOSMetricTile
              label="标准截链推荐"
              value={result.recommendedLinks}
              unit="Links"
              subtext="含 1 节魔术扣 (Quick Link)"
              accentColor="blue"
              icon={Link}
            />

            <IOSMetricTile
              label="链条理论总长度"
              value={result.chainLengthInches}
              unit="英寸"
              subtext={`约 ${(parseFloat(result.chainLengthInches) * 25.4).toFixed(0)} mm`}
              accentColor="green"
              icon={Zap}
            />

            <IOSMetricTile
              label="后拨总齿容量需求"
              value={result.requiredCapacity}
              unit="T"
              subtext={result.rearDerailleurRecommendation}
              accentColor={result.isCapacityWarning ? 'orange' : 'blue'}
              icon={Settings}
            />
          </div>

          {/* Drivetrain Visual SVG Schematic */}
          <IOSCard variant="default" className="p-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-ios-blue" />
                传动链条闭环受力几何示意
              </span>
              <span className="font-mono text-ios-blue font-bold">RC: {chainstayLengthMm}mm</span>
            </div>

            <div className="flex justify-center bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl p-4 border border-black/[0.05] dark:border-white/[0.08] transition-colors">
              <svg viewBox="0 0 360 140" className="w-full max-w-md h-auto select-none">
                {/* Chainstay line */}
                <line x1="80" y1="70" x2="280" y2="70" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="4 4" className="dark:stroke-slate-700" />
                <text x="180" y="62" fontSize="9" fill="#64748b" textAnchor="middle" fontFamily="monospace">
                  RC = {chainstayLengthMm} mm
                </text>

                {/* Chain Loop (upper & lower runs) */}
                <path
                  d="M 80 40 L 280 25 A 45 45 0 0 1 280 115 L 110 110 L 80 95 A 25 25 0 0 1 80 40"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3"
                  strokeDasharray="6 2"
                  opacity="0.85"
                  className="dark:stroke-[#00AFFF]"
                />

                {/* Front Chainring */}
                <circle cx="280" cy="70" r="45" fill="#f1f5f9" stroke="#0284c7" strokeWidth="2.5" className="dark:fill-[#2C2C2E] dark:stroke-[#00AFFF]" />
                <circle cx="280" cy="70" r="10" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" className="dark:fill-[#1C1C1E] dark:stroke-slate-600" />
                <text x="280" y="74" fontSize="12" fontWeight="bold" fill="#0369a1" textAnchor="middle" fontFamily="monospace" className="dark:fill-sky-400">
                  {bigRing}T
                </text>
                <text x="280" y="128" fontSize="9" fill="#64748b" textAnchor="middle" className="dark:fill-slate-400">
                  牙盘 (Chainring)
                </text>

                {/* Rear Cassette */}
                <circle cx="80" cy="70" r="28" fill="#f1f5f9" stroke="#059669" strokeWidth="2.5" className="dark:fill-[#2C2C2E] dark:stroke-emerald-500" />
                <circle cx="80" cy="70" r="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" className="dark:fill-[#1C1C1E] dark:stroke-slate-600" />
                <text x="80" y="74" fontSize="11" fontWeight="bold" fill="#047857" textAnchor="middle" fontFamily="monospace" className="dark:fill-emerald-400">
                  {bigCog}T
                </text>
                <text x="80" y="128" fontSize="9" fill="#64748b" textAnchor="middle" className="dark:fill-slate-400">
                  飞轮 (Cassette)
                </text>

                {/* Derailleur Pulley Cage */}
                <circle cx="105" cy="108" r="9" fill="#fef3c7" stroke="#d97706" strokeWidth="2" className="dark:fill-[#1C1C1E] dark:stroke-amber-500" />
                <text x="105" y="111" fontSize="7" fontWeight="bold" fill="#b45309" textAnchor="middle" className="dark:fill-amber-400">
                  {pulleyTeeth}T
                </text>
              </svg>
            </div>
          </IOSCard>

          {/* Installation Best Practices Card */}
          <IOSCard variant="default" className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              官方装配与物理测量截链法则
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-1.5">
                <span className="font-semibold text-ios-blue block">Shimano 经典大对大法</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  链条不经过后拨导轮，直接绕过最大大盘与最大飞轮拉紧，在两端闭合重合处额外加 <strong>2 节 (含魔术扣)</strong> 即为标准长度。
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-1.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">小盘小飞下垂校验</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  截链装好后切换至小盘最小飞轮，确认后拨导板仍保有微小张力且链条不会刮蹭后拨上导轮下沿。
                </p>
              </div>
            </div>
          </IOSCard>
        </div>
      </div>

      {/* Social Share Poster Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={sharePosterUrl}
        title="技师截链规范卡"
        downloadFileName={`SoloRider_截链规范_${result.recommendedLinks}节.png`}
      />
    </div>
  );
};
