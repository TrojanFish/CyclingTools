import React, { useState, useMemo, useEffect } from 'react';
import { Target, Activity, Zap, Award, Flame, Shield, TrendingUp, Sparkles, Share2, Info, Upload, FileText, Check, X, FileSpreadsheet, Mountain, Timer, Dumbbell, ArrowRight } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { NumberStepper } from '../common/NumberStepper';
import { IOSCard, IOSCardHeader, IOSMetricTile } from '../common/IOSCard';
import { IOSToolHeader } from '../common/IOSToolHeader';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { ShareCardModal } from '../common/ShareCardModal';
import { generatePowerProfilePoster } from '../../utils/shareCardGenerators';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useToast } from '../../context/ToastContext';
import { useStrava } from '../../context/StravaContext';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend
);

interface PowerProfileRadarProps {
  onNavigateTool?: (toolId: string) => void;
}

export const PowerProfileRadar: React.FC<PowerProfileRadarProps> = ({ onNavigateTool }) => {
  const { profile } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const { showToast } = useToast();
  const { isConnected: isStravaConnected, extractBestPowerPeaks } = useStrava();
  const isImperial = unitSystem === 'imperial';

  const [weightKg, setWeightKg] = useState<number>(profile.weightKg || 68);
  const [ftpWatts, setFtpWatts] = useState<number>(profile.ftpWatts || 240);
  const [isExtractingStrava, setIsExtractingStrava] = useState<boolean>(false);

  // Reactively synchronize with global rider profile
  useEffect(() => {
    if (profile.weightKg) setWeightKg(profile.weightKg);
    if (profile.ftpWatts) setFtpWatts(profile.ftpWatts);
  }, [profile.weightKg, profile.ftpWatts]);

  // Peak Power Durations
  const [p5s, setP5s] = useState<number>(950);
  const [p1m, setP1m] = useState<number>(520);
  const [p5m, setP5m] = useState<number>(330);
  const [p20m, setP20m] = useState<number>(255);

  // Smart Paste Modal State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');

  // Share Poster State
  const [sharePosterUrl, setSharePosterUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const [activeRiderPreset, setActiveRiderPreset] = useState<'sprinter' | 'climber' | 'rouleur' | 'allrounder' | null>('allrounder');

  // Preset Profiles
  const loadPreset = (type: 'sprinter' | 'climber' | 'rouleur' | 'allrounder') => {
    setActiveRiderPreset(type);
    if (type === 'sprinter') {
      setP5s(1250);
      setP1m(620);
      setP5m(340);
      setP20m(250);
      showToast('已载入纯正冲刺手 (Sprinter) 数据模型', 'info');
    } else if (type === 'climber') {
      setP5s(780);
      setP1m(460);
      setP5m(360);
      setP20m(300);
      showToast('已载入纯血爬坡手 (Climber) 数据模型', 'info');
    } else if (type === 'rouleur') {
      setP5s(900);
      setP1m(510);
      setP5m(380);
      setP20m(320);
      showToast('已载入计时突围巡航手 (Time Trialist) 数据模型', 'info');
    } else {
      setP5s(980);
      setP1m(530);
      setP5m(340);
      setP20m(260);
      showToast('已载入均衡全能型 (All-Rounder) 数据模型', 'info');
    }
  };

  // Extract Peak Power directly from Strava Activities
  const handleExtractFromStrava = async () => {
    if (!isStravaConnected) {
      showToast(
        language === 'zh-TW'
          ? '請先在「車隊與車手設定」中連接 Strava 帳號'
          : '请先在「车队与车手设置」中连接 Strava 账号',
        'warning'
      );
      return;
    }

    setIsExtractingStrava(true);
    try {
      const peaks = await extractBestPowerPeaks();
      if (peaks) {
        setP5s(peaks.p5s);
        setP1m(peaks.p1m);
        setP5m(peaks.p5m);
        setP20m(peaks.p20m);
        setActiveRiderPreset(null);

        showToast(
          language === 'zh-TW'
            ? `已從 Strava 提取近期最佳峰值功率：5s ${peaks.p5s}W | 1m ${peaks.p1m}W | 5m ${peaks.p5m}W | 20m ${peaks.p20m}W！`
            : `已从 Strava 提取近期最佳峰值功率：5s ${peaks.p5s}W | 1m ${peaks.p1m}W | 5m ${peaks.p5m}W | 20m ${peaks.p20m}W！`,
          'success'
        );
      }
    } finally {
      setIsExtractingStrava(false);
    }
  };

  // Parse Text via Regex
  const parsePowerText = (text: string) => {
    const res: { p5s?: number; p1m?: number; p5m?: number; p20m?: number; ftp?: number; weight?: number } = {};

    // 5s: 5s, 5秒, 5 sec
    const m5s = text.match(/(?:5\s*[s秒]|5\s*sec|5s\s*[:：=])\s*[:：=]?\s*(\d{2,4})/i) || text.match(/(?:冲刺|五秒)\s*[:：=]?\s*(\d{2,4})/i);
    if (m5s) res.p5s = parseInt(m5s[1], 10);

    // 1m: 1m, 1分, 60s, 1 min
    const m1m = text.match(/(?:1\s*[m分]|1\s*min|60\s*[s秒]|1m\s*[:：=])\s*[:：=]?\s*(\d{2,4})/i) || text.match(/(?:一分|无氧)\s*[:：=]?\s*(\d{2,4})/i);
    if (m1m) res.p1m = parseInt(m1m[1], 10);

    // 5m: 5m, 5分, 300s, 5 min
    const m5m = text.match(/(?:5\s*[m分]|5\s*min|300\s*[s秒]|5m\s*[:：=])\s*[:：=]?\s*(\d{2,4})/i) || text.match(/(?:五分|vo2)\s*[:：=]?\s*(\d{2,4})/i);
    if (m5m) res.p5m = parseInt(m5m[1], 10);

    // 20m: 20m, 20分, 1200s, 20 min
    const m20m = text.match(/(?:20\s*[m分]|20\s*min|1200\s*[s秒]|20m\s*[:：=])\s*[:：=]?\s*(\d{2,4})/i) || text.match(/(?:二十分|20分钟)\s*[:：=]?\s*(\d{2,4})/i);
    if (m20m) res.p20m = parseInt(m20m[1], 10);

    // FTP
    const mFtp = text.match(/(?:ftp|cp|阈值)\s*[:：=]?\s*(\d{2,4})/i);
    if (mFtp) res.ftp = parseInt(mFtp[1], 10);

    // Weight
    const mWeight = text.match(/(?:体重|weight|kg)\s*[:：=]?\s*(\d{2,3}(?:\.\d+)?)/i);
    if (mWeight) res.weight = parseFloat(mWeight[1]);

    return res;
  };

  // Live parsed preview
  const liveParsed = useMemo(() => {
    if (!pasteText.trim()) return null;
    return parsePowerText(pasteText);
  }, [pasteText]);

  // Apply Parsed Text Data
  const applyParsedText = () => {
    if (!liveParsed) return;
    let count = 0;
    if (liveParsed.p5s) { setP5s(liveParsed.p5s); count++; }
    if (liveParsed.p1m) { setP1m(liveParsed.p1m); count++; }
    if (liveParsed.p5m) { setP5m(liveParsed.p5m); count++; }
    if (liveParsed.p20m) { setP20m(liveParsed.p20m); count++; }
    if (liveParsed.ftp) { setFtpWatts(liveParsed.ftp); count++; }
    if (liveParsed.weight) { setWeightKg(liveParsed.weight); count++; }

    if (count > 0) {
      showToast('功率数据智能解析导入成功！', 'success', `成功识别并载入 ${count} 项关键生理功率参数`);
      setIsPasteModalOpen(false);
      setPasteText('');
    } else {
      showToast('未能在文本中识别到有效功率参数！', 'warning', '请参考格式如：5s: 1100W, 1m: 560W, 5m: 350W, 20m: 270W, FTP: 255W');
    }
  };

  // Handle CSV / JSON File Upload (Garmin / Intervals.icu / WKO5)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          let count = 0;
          if (data.p5s || data['5s'] || data['5sec']) { setP5s(Number(data.p5s || data['5s'] || data['5sec'])); count++; }
          if (data.p1m || data['1m'] || data['1min'] || data['60s']) { setP1m(Number(data.p1m || data['1m'] || data['1min'] || data['60s'])); count++; }
          if (data.p5m || data['5m'] || data['5min'] || data['300s']) { setP5m(Number(data.p5m || data['5m'] || data['5min'] || data['300s'])); count++; }
          if (data.p20m || data['20m'] || data['20min'] || data['1200s']) { setP20m(Number(data.p20m || data['20m'] || data['20min'] || data['1200s'])); count++; }
          if (data.ftp || data.ftpWatts || data.cp) { setFtpWatts(Number(data.ftp || data.ftpWatts || data.cp)); count++; }
          if (data.weight || data.weightKg) { setWeightKg(Number(data.weight || data.weightKg)); count++; }

          showToast('JSON 功率配置导入成功！', 'success', `成功解析 ${count} 项参数`);
        } else {
          // CSV Parser
          const parsed = parsePowerText(content);
          let count = 0;
          if (parsed.p5s) { setP5s(parsed.p5s); count++; }
          if (parsed.p1m) { setP1m(parsed.p1m); count++; }
          if (parsed.p5m) { setP5m(parsed.p5m); count++; }
          if (parsed.p20m) { setP20m(parsed.p20m); count++; }
          if (parsed.ftp) { setFtpWatts(parsed.ftp); count++; }
          if (parsed.weight) { setWeightKg(parsed.weight); count++; }

          if (count > 0) {
            showToast('CSV 功率表单解析成功！', 'success', `已载入 ${count} 项功率指标`);
          } else {
            showToast('CSV 表单未能匹配到 5s/1m/5m/20m 对应列！', 'warning');
          }
        }
      } catch (err) {
        showToast('文件解析失败，请检查格式！', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Profile Analytics
  const analytics = useMemo(() => {
    const w5s = parseFloat((p5s / weightKg).toFixed(2));
    const w1m = parseFloat((p1m / weightKg).toFixed(2));
    const w5m = parseFloat((p5m / weightKg).toFixed(2));
    const w20m = parseFloat((p20m / weightKg).toFixed(2));
    const wFtp = parseFloat((ftpWatts / weightKg).toFixed(2));

    // Normalize to 0~100 score for Radar Chart relative to competitive benchmarks
    // World Class: 5s=22W/kg, 1m=11W/kg, 5m=7.2W/kg, 20m=5.8W/kg
    const s5s = Math.min(100, Math.round((w5s / 20.0) * 100));
    const s1m = Math.min(100, Math.round((w1m / 10.5) * 100));
    const s5m = Math.min(100, Math.round((w5m / 6.8) * 100));
    const s20m = Math.min(100, Math.round((w20m / 5.5) * 100));
    const sCruise = Math.min(100, Math.round((ftpWatts / 380) * 100));
    const sClimb = Math.min(100, Math.round((wFtp / 5.2) * 100));

    // Phenotype Classification
    let phenotype = '均衡全能型骑士 (All-Rounder)';
    let phenotypeDesc = '各功率区间均衡无明显短板，在平路巡航、起伏冲刺与爬坡中皆具备良好适应力。';
    let phenotypeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

    if (w5s >= 16.0 && s5s > s20m + 15) {
      phenotype = '终点爆发冲刺手 (Sprinter)';
      phenotypeDesc = '拥有出众的神经肌肉瞬间爆发力与无氧糖酵解输出，适合大集团冲刺与终点线卡位。';
      phenotypeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else if (w20m >= 4.2 && w5m >= 5.0 && sClimb > s5s + 10) {
      phenotype = '纯血爬坡攻坚手 (Climber)';
      phenotypeDesc = '拥有极高的推重比与乳酸清除效率，长距离山地大坡是你的绝对主场。';
      phenotypeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (ftpWatts >= 280 && sCruise > s5s) {
      phenotype = '平路巡航与计时突围手 (Time Trialist / Rouleur)';
      phenotypeDesc = '高绝对瓦数输出，平路高速单飞、破风领骑与铁三计时赛能力极强。';
      phenotypeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    } else if (w1m >= 8.5 && w5m >= 5.2) {
      phenotype = '起伏路短坡突围手 (Puncher)';
      phenotypeDesc = '在 1~3 分钟的陡坡短坡上具备毁灭性的加速进攻能力。';
      phenotypeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }

    // Seiler Polarized 80/20 Model
    const polarizedZones = [
      {
        zone: 'Zone 1 低强度有氧基础 (Low Intensity)',
        range: `< ${Math.round(ftpWatts * 0.77)} W (< 77% FTP)`,
        volume: '80% 训练容量',
        desc: '低于第一乳酸阈值 (LT1)，最大化线粒体密度并避免中枢疲劳积累。'
      },
      {
        zone: 'Zone 2 门槛过渡带 (Threshold / SweetSpot)',
        range: `${Math.round(ftpWatts * 0.78)} - ${Math.round(ftpWatts * 1.02)} W`,
        volume: '极少量 / 专项期',
        desc: '介于 LT1 与 LT2 之间，极化训练理念主张尽量减少该区间的无序堆量。'
      },
      {
        zone: 'Zone 3 高强度间歇 (High Intensity VO2)',
        range: `> ${Math.round(ftpWatts * 1.05)} W (> 105% FTP)`,
        volume: '20% 训练容量',
        desc: '高于第二乳酸阈值 (LT2)，每周 1~2 次高质 4x4 或 30/30 间歇强化心肺上限。'
      }
    ];

    // Sweet Spot Zone
    const sweetSpotMin = Math.round(ftpWatts * 0.88);
    const sweetSpotMax = Math.round(ftpWatts * 0.94);

    return {
      w5s, w1m, w5m, w20m, wFtp,
      scores: [s5s, s1m, s5m, s20m, sCruise, sClimb],
      phenotype, phenotypeDesc, phenotypeColor,
      polarizedZones,
      sweetSpotMin, sweetSpotMax
    };
  }, [weightKg, ftpWatts, p5s, p1m, p5m, p20m]);

  // Radar Chart Dataset
  const chartData = useMemo(() => {
    return {
      labels: ['5秒 冲刺', '1分钟 无氧', '5分钟 VO₂', '20分钟 阈值', '绝对巡航瓦', '爬坡推重比'],
      datasets: [
        {
          label: '车手能力六维评分 (100分制)',
          data: analytics.scores,
          backgroundColor: 'rgba(0, 175, 255, 0.25)',
          borderColor: '#00AFFF',
          pointBackgroundColor: '#00AFFF',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#00AFFF',
          borderWidth: 2,
        }
      ]
    };
  }, [analytics]);

  const handleGeneratePoster = () => {
    const url = generatePowerProfilePoster({
      phenotype: analytics.phenotype,
      phenotypeDesc: analytics.phenotypeDesc,
      p5s,
      w5s: analytics.w5s,
      p1m,
      w1m: analytics.w1m,
      p5m,
      w5m: analytics.w5m,
      p20m,
      w20m: analytics.w20m,
      ftpWatts,
      weightKg,
      sweetSpotMin: analytics.sweetSpotMin,
      sweetSpotMax: analytics.sweetSpotMax
    });
    setSharePosterUrl(url);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Unified Tool Header */}
      <IOSToolHeader
        category={language === 'zh-TW' ? '生理動力學畫像與現代極化訓練' : '生理动力学画像与现代极化训练'}
        categoryIcon={Target}
        title={language === 'zh-TW' ? '功率能力雷達與極化訓練區間' : '功率能力雷达与极化训练区间'}
        description={
          language === 'zh-TW'
            ? '基於 5s 衝刺、1min 無氧、5min VO₂ 與 20min 閾值構建六維能力雷達，智能判定車手類型並生成 Seiler 80/20 極化與甜點訓練靶心。'
            : '基于 5s 冲刺、1min 无氧、5min VO₂ 与 20min 阈值构建六维能力雷达，智能判定车手类型并生成 Seiler 80/20 极化与甜点训练靶心。'
        }
        tint="red"
        onShare={handleGeneratePoster}
        shareTitle={language === 'zh-TW' ? '生成戰力畫像海報' : '生成战力画像海报'}
        actions={
          <>
            <button
              onClick={handleExtractFromStrava}
              disabled={isExtractingStrava}
              className="apple-touch h-9 px-3.5 sm:px-4 bg-[#FC4C02]/10 hover:bg-[#FC4C02]/20 text-[#FC4C02] rounded-xl text-xs font-semibold border border-[#FC4C02]/25 transition shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              title={isStravaConnected ? '从 Strava 历史活动中一键提取最佳 5s、1min、5min、20min 峰值功率' : '连接 Strava 账号以一键提取最佳峰值功率'}
            >
              <svg className={`w-3.5 h-3.5 fill-current ${isExtractingStrava ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
              </svg>
              <span>{isExtractingStrava ? (language === 'zh-TW' ? '提取中...' : '提取中...') : (language === 'zh-TW' ? '⚡ Strava 提取' : '⚡ Strava 提取')}</span>
            </button>

            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="apple-touch h-9 px-3.5 sm:px-4 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-ios-red" />
              <span>{language === 'zh-TW' ? '貼上功率' : '粘贴功率'}</span>
            </button>
          </>
        }
      />

      {/* Rider Preset Bar */}
      <div className="ios-card p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-ios-sm">
        <div className="w-full">
          <IOSSegmentedControl
            options={[
              { value: 'sprinter', label: language === 'zh-TW' ? '衝刺手' : '冲刺手', icon: Zap },
              { value: 'climber', label: language === 'zh-TW' ? '爬坡手' : '爬坡手', icon: Mountain },
              { value: 'rouleur', label: language === 'zh-TW' ? '計時突圍' : '计时突围', icon: Timer },
              { value: 'allrounder', label: language === 'zh-TW' ? '全能型' : '全能型', icon: Award },
            ]}
            value={activeRiderPreset || ''}
            onChange={(val) => loadPreset(val as any)}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto">
          <button
            onClick={handleExtractFromStrava}
            disabled={isExtractingStrava}
            className="px-2.5 py-1 rounded-xl bg-[#FC4C02]/10 hover:bg-[#FC4C02]/20 text-[#FC4C02] font-medium flex items-center gap-1 apple-touch border border-[#FC4C02]/20 transition disabled:opacity-50"
            title="从 Strava 历史活动提取 5s/1m/5m/20m 最佳功率"
          >
            <svg className={`w-3.5 h-3.5 fill-current ${isExtractingStrava ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.01 13.828h4.172" />
            </svg>
            <span>{language === 'zh-TW' ? '從 Strava 提取近期峰值' : '从 Strava 提取近期峰值'}</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <label className="text-ios-blue hover:underline cursor-pointer font-medium flex items-center gap-1 apple-touch">
            <Upload className="w-3.5 h-3.5" />
            <span>{language === 'zh-TW' ? '上傳功率表單' : '上传功率表单'}</span>
            <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Smart Text Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-2xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] rounded-t-[28px] sm:rounded-2xl w-full max-w-lg p-4 sm:p-5 space-y-4 shadow-ios-popover animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-5">
            {/* Mobile Sheet Drag Handle */}
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-neutral-600 mx-auto -mt-1 mb-1 sm:hidden shrink-0" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-ios-blue" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">智能功率文本一键识别与导入</h3>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition apple-touch"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              支持直接粘贴车表摘要、微信聊天记录或 Intervals.icu 记录，系统将自动识别各时间段的瓦数。
            </p>

            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="例如：5秒: 1120W, 1分钟: 580W, 5分钟: 360W, 20分钟: 275W, FTP: 260W, 体重: 67kg"
              className="w-full bg-slate-100/80 dark:bg-white/5 border border-black/[0.05] dark:border-white/[0.08] rounded-2xl p-3 text-xs text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-ios-blue"
            />

            {/* Live Detected Preview */}
            {liveParsed && (
              <div className="bg-slate-100/80 dark:bg-white/5 rounded-2xl p-3 border border-black/[0.05] dark:border-white/[0.08] space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">实时识别结果预览:</span>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-white dark:bg-[#2C2C2E] p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">5秒 冲刺</span>
                    <span className="text-ios-blue font-bold">{liveParsed.p5s ? `${liveParsed.p5s} W` : '未识别'}</span>
                  </div>
                  <div className="bg-white dark:bg-[#2C2C2E] p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">1分钟 无氧</span>
                    <span className="text-ios-blue font-bold">{liveParsed.p1m ? `${liveParsed.p1m} W` : '未识别'}</span>
                  </div>
                  <div className="bg-white dark:bg-[#2C2C2E] p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">5分钟 VO₂</span>
                    <span className="text-ios-blue font-bold">{liveParsed.p5m ? `${liveParsed.p5m} W` : '未识别'}</span>
                  </div>
                  <div className="bg-white dark:bg-[#2C2C2E] p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">20分钟 阈值</span>
                    <span className="text-ios-blue font-bold">{liveParsed.p20m ? `${liveParsed.p20m} W` : '未识别'}</span>
                  </div>
                  <div className="bg-white dark:bg-[#2C2C2E] p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">FTP 阈值功率</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{liveParsed.ftp ? `${liveParsed.ftp} W` : '保持现值'}</span>
                  </div>
                  <div className="bg-white dark:bg-[#2C2C2E] p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">车手体重</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{liveParsed.weight ? `${liveParsed.weight} kg` : '保持现值'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="apple-touch h-9 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                取消
              </button>
              <button
                onClick={applyParsedText}
                disabled={!liveParsed}
                className="apple-touch h-9 px-4 sm:px-5 rounded-xl text-xs font-bold bg-ios-blue hover:bg-ios-blue/90 text-white transition shadow-ios-sm disabled:opacity-50"
              >
                {language === 'zh-TW' ? '載入並生成雷達' : '载入并生成雷达'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Peak Power Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <IOSMetricTile
          label={language === 'zh-TW' ? '5秒 衝刺推重比' : '5秒 冲刺推重比'}
          value={analytics.w5s}
          unit="W/kg"
          subValue={`${p5s} W`}
          accent="red"
        />
        <IOSMetricTile
          label={language === 'zh-TW' ? '1分鐘 無氧推重比' : '1分钟 无氧推重比'}
          value={analytics.w1m}
          unit="W/kg"
          subValue={`${p1m} W`}
          accent="orange"
        />
        <IOSMetricTile
          label={language === 'zh-TW' ? '5分鐘 VO₂ 推重比' : '5分钟 VO₂ 推重比'}
          value={analytics.w5m}
          unit="W/kg"
          subValue={`${p5m} W`}
          accent="blue"
        />
        <IOSMetricTile
          label={language === 'zh-TW' ? '20分鐘 閾值推重比' : '20分钟 阈值推重比'}
          value={analytics.w20m}
          unit="W/kg"
          subValue={`${p20m} W`}
          accent="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="ios-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4 shadow-ios-card">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-ios-blue" />
              {language === 'zh-TW' ? '車手巔峰功率數據 (Peak Power)' : '车手巅峰功率数据 (Peak Power)'}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '車手淨重' : '车手净重'} ({isImperial ? 'lbs' : 'kg'})
                </label>
                <NumberStepper
                  value={isImperial ? parseFloat((weightKg * 2.20462).toFixed(1)) : weightKg}
                  onChange={(v) => setWeightKg(isImperial ? parseFloat((v / 2.20462).toFixed(1)) : v)}
                  step={isImperial ? 1 : 0.5}
                  min={isImperial ? 66 : 40}
                  max={isImperial ? 330 : 120}
                  unit={isImperial ? 'lbs' : 'kg'}
                  decimals={1}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? 'FTP 閾值功率' : 'FTP 阈值功率'} (W)
                </label>
                <NumberStepper value={ftpWatts} onChange={setFtpWatts} step={5} min={100} max={500} unit="W" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '5秒 衝刺峰值' : '5秒 冲刺峰值'} (W)
                </label>
                <NumberStepper
                  value={p5s}
                  onChange={(v) => {
                    setP5s(v);
                    setActiveRiderPreset(null);
                  }}
                  step={20}
                  min={300}
                  max={2200}
                  unit="W"
                />
                <span className="text-[11px] text-ios-red font-mono font-medium block mt-1">
                  {'推重比'}: {analytics.w5s} W/kg
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '1分鐘 無氧峰值' : '1分钟 无氧峰值'} (W)
                </label>
                <NumberStepper
                  value={p1m}
                  onChange={(v) => {
                    setP1m(v);
                    setActiveRiderPreset(null);
                  }}
                  step={10}
                  min={200}
                  max={1200}
                  unit="W"
                />
                <span className="text-[11px] text-ios-orange font-mono font-medium block mt-1">
                  {'推重比'}: {analytics.w1m} W/kg
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '5分鐘 VO₂ Max' : '5分钟 VO₂ Max'} (W)
                </label>
                <NumberStepper
                  value={p5m}
                  onChange={(v) => {
                    setP5m(v);
                    setActiveRiderPreset(null);
                  }}
                  step={5}
                  min={150}
                  max={700}
                  unit="W"
                />
                <span className="text-[11px] text-ios-blue font-mono font-medium block mt-1">
                  {'推重比'}: {analytics.w5m} W/kg
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '20分鐘 閾值測試' : '20分钟 阈值测试'} (W)
                </label>
                <NumberStepper
                  value={p20m}
                  onChange={(v) => {
                    setP20m(v);
                    setActiveRiderPreset(null);
                  }}
                  step={5}
                  min={120}
                  max={600}
                  unit="W"
                />
                <span className="text-[11px] text-ios-green font-mono font-medium block mt-1">
                  {'推重比'}: {analytics.w20m} W/kg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Radar Visual & Polarized Plan */}
        <div className="lg:col-span-7 space-y-4">
          {/* Phenotype Badge */}
          <div className="ios-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2 shadow-ios-card">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {language === 'zh-TW' ? '車手生理表型判定 (Rider Phenotype)' : '车手生理表型判定 (Rider Phenotype)'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${analytics.phenotypeColor}`}>
                {analytics.phenotype}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {analytics.phenotypeDesc}
            </p>
          </div>

          {/* Radar Chart */}
          <div className="ios-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2.5 shadow-ios-card">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ios-blue" />
                {language === 'zh-TW' ? '六維綜合競技能力雷達圖' : '六维综合竞技能力雷达图'}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">*Coggan 竞技数据库标定</span>
            </div>

            <div className="h-60 flex justify-center">
              <Radar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      angleLines: { color: 'rgba(148, 163, 184, 0.15)' },
                      grid: { color: 'rgba(148, 163, 184, 0.15)' },
                      pointLabels: { color: '#94a3b8', font: { size: 11 } },
                      ticks: { display: false, maxTicksLimit: 5 },
                      min: 0,
                      max: 100
                    }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>

          {/* Seiler Polarized 80/20 Table & Sweet Spot */}
          <div className="ios-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3.5 shadow-ios-card">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-ios-orange" />
                {language === 'zh-TW' ? 'Seiler 極化 80/20 現代訓練模型與甜點' : 'Seiler 极化 80/20 现代训练模型与甜点'}
              </h3>
              <span className="text-xs font-mono text-ios-blue font-semibold">
                SweetSpot: {analytics.sweetSpotMin} - {analytics.sweetSpotMax} W
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400">
                    <th className="pb-2">{language === 'zh-TW' ? '訓練三區' : '训练三区'}</th>
                    <th className="pb-2">{language === 'zh-TW' ? '功率範圍' : '功率范围'}</th>
                    <th className="pb-2">{language === 'zh-TW' ? '建議時間佔比' : '建议时间占比'}</th>
                    <th className="pb-2">{language === 'zh-TW' ? '生理機制' : '生理机制'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {analytics.polarizedZones.map((z, idx) => (
                    <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{z.zone}</td>
                      <td className="font-mono text-ios-blue font-bold">{z.range}</td>
                      <td className="font-semibold text-ios-green">{z.volume}</td>
                      <td className="text-slate-500 dark:text-slate-400 text-[11px]">{z.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {onNavigateTool && (
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 dark:text-slate-400">
                  💡 想要针对极化三区或弱项开展针对性课表训练？
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTool('workout-builder')}
                  className="apple-touch self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ios-purple/10 hover:bg-ios-purple/20 text-ios-purple font-bold text-xs border border-ios-purple/20 transition shadow-2xs"
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>前往科学训练课表工坊</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Share Poster Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={sharePosterUrl}
        title={language === 'zh-TW' ? '車手能力雷達戰報' : '车手能力雷达战报'}
        downloadFileName={`SoloRider_功率能力雷达_${analytics.phenotype}.png`}
      />
    </div>
  );
};
