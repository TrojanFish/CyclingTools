import React, { useState, useMemo } from 'react';
import { Scale, Zap, Flame, Award, CheckSquare, Square, DollarSign, TrendingDown, Clock, ShieldCheck, Copy, Plus, Trash2, RotateCcw, Sparkles, HelpCircle, ChevronDown, Check } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { NumberStepper } from '../common/NumberStepper';
import { Tooltip } from '../common/Tooltip';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useToast } from '../../context/ToastContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export interface SpecPreset {
  label: string;
  weightG: number;
  baseWatts40: number; // Aero/rolling watt save @ 40 km/h baseline
  refPrice: number;
  note: string;
}

export interface UpgradeItem {
  id: string;
  name: string;
  category: 'aero' | 'weight' | 'rolling' | 'drivetrain';
  weightSaveG: number;
  powerSaveWatts: number;
  costYuan: number;
  enabled: boolean;
  selectedSpecIndex?: number;
  specs: SpecPreset[];
}

const DEFAULT_ITEMS_WITH_SPECS: UpgradeItem[] = [
  {
    id: '1',
    name: '🎽 骑行服 / 连体服升级',
    category: 'aero',
    weightSaveG: 0,
    powerSaveWatts: 7.5,
    costYuan: 450,
    enabled: true,
    selectedSpecIndex: 1,
    specs: [
      { label: '修身普通骑行服 (相比宽松风衣)', weightG: 0, baseWatts40: 4.0, refPrice: 200, note: '消除衣物兜风鼓包，风洞实测省 ~4W' },
      { label: '贴身破风竞技分体服', weightG: 0, baseWatts40: 7.5, refPrice: 450, note: '手臂与肩部采用低风阻导流面料，实测省 ~7.5W' },
      { label: '顶级破风一体连体服 (Skinsuit)', weightG: 0, baseWatts40: 11.0, refPrice: 1500, note: '无接缝极致贴合，职业风洞黄金升级，省 ~11W' },
    ]
  },
  {
    id: '2',
    name: '🚴 内胎与滚阻系统升级',
    category: 'rolling',
    weightSaveG: 140,
    powerSaveWatts: 3.2,
    costYuan: 160,
    enabled: true,
    selectedSpecIndex: 1,
    specs: [
      { label: '乳胶内胎 Latex (相比普通丁基胶)', weightG: 80, baseWatts40: 2.2, refPrice: 120, note: '滞后损失小，路感柔和，滚阻省 ~2.2W' },
      { label: '超轻 TPU 内胎 (28g-36g 对装)', weightG: 140, baseWatts40: 3.2, refPrice: 160, note: '极致减重 140g 旋转质量，滚阻省 ~3.2W' },
      { label: '无内胎系统 Tubeless + 顶级真空胎', weightG: 180, baseWatts40: 4.8, refPrice: 900, note: '免除内胎摩擦，极低滚阻兼顾防扎，省 ~4.8W' },
    ]
  },
  {
    id: '3',
    name: '🪖 头盔气动升级',
    category: 'aero',
    weightSaveG: 0,
    powerSaveWatts: 4.5,
    costYuan: 850,
    enabled: true,
    selectedSpecIndex: 1,
    specs: [
      { label: '轻量半透气综合破风盔', weightG: 0, baseWatts40: 3.0, refPrice: 450, note: '兼顾散热与正面破风导流，省 ~3W' },
      { label: '全破风气动公路盔 (如 Evade/Utopia)', weightG: -10, baseWatts40: 5.0, refPrice: 1200, note: '针对头部正面高风压区优化，省 ~5W' },
      { label: '封闭式计时 TT 气动水滴头盔', weightG: -60, baseWatts40: 8.5, refPrice: 2200, note: '后部气流平滑顺延背部，极致省 ~8.5W' },
    ]
  },
  {
    id: '4',
    name: '🛞 碳纤维气动轮组升级',
    category: 'aero',
    weightSaveG: 280,
    powerSaveWatts: 6.0,
    costYuan: 4200,
    enabled: true,
    selectedSpecIndex: 1,
    specs: [
      { label: '38mm 轻量爬坡碳轮 (相比铝轮)', weightG: 400, baseWatts40: 3.5, refPrice: 3200, note: '大减重适合山地爬坡，平路气动省 ~3.5W' },
      { label: '50mm 全能综合框高碳轮 (破风兼顾侧风)', weightG: 280, baseWatts40: 6.5, refPrice: 4200, note: '黄金综合高度，平路巡航利器，省 ~6.5W' },
      { label: '60mm+ 高框平路破风巡航轮组', weightG: 120, baseWatts40: 9.0, refPrice: 6500, note: '大深框破风惯性极佳，平路高速省 ~9W' },
    ]
  },
  {
    id: '5',
    name: '🚀 车把与全内走线升级',
    category: 'aero',
    weightSaveG: 90,
    powerSaveWatts: 3.5,
    costYuan: 1200,
    enabled: true,
    selectedSpecIndex: 1,
    specs: [
      { label: '气动扁平分体碳弯把', weightG: 50, baseWatts40: 2.0, refPrice: 500, note: '上把位机翼扁平截面，减少把前风阻 ~2W' },
      { label: '一体式全内走线气动碳把组', weightG: 90, baseWatts40: 3.8, refPrice: 1200, note: '隐藏全部外露线管，车头迎风面极度纯净，省 ~3.8W' },
    ]
  },
  {
    id: '6',
    name: '👟 锁鞋与脚部系统升级',
    category: 'weight',
    weightSaveG: 160,
    powerSaveWatts: 1.5,
    costYuan: 990,
    enabled: false,
    selectedSpecIndex: 0,
    specs: [
      { label: '硬底全碳纤维公路锁鞋 (相比尼龙底)', weightG: 160, baseWatts40: 1.5, refPrice: 990, note: '硬度指数10+极大提高踩踏刚性，减重足底旋转质量' },
      { label: '平整低风阻气动破风鞋套', weightG: -40, baseWatts40: 3.0, refPrice: 150, note: '平滑包裹鞋面旋钮与卡扣，降低脚部旋转扰流 ~3W' },
    ]
  },
  {
    id: '7',
    name: '⚙️ 传动链条与导轮陶瓷化',
    category: 'drivetrain',
    weightSaveG: -20,
    powerSaveWatts: 1.2,
    costYuan: 880,
    enabled: false,
    selectedSpecIndex: 0,
    specs: [
      { label: '超低阻浸蜡链条 / 陶瓷大导轮', weightG: -20, baseWatts40: 1.5, refPrice: 880, note: '降低链节弯折角度与摩擦阻力，机械传动省 ~1.5W' },
    ]
  },
];

export const UpgradeRoiCalculator: React.FC = () => {
  const { profile } = useRiderProfile();
  const { showToast } = useToast();

  const [totalSystemWeightKg, setTotalSystemWeightKg] = useState<number>((profile.weightKg || 68) + (profile.bikeWeightKg || 8.5));
  const [flatCruiseSpeedKmh, setFlatCruiseSpeedKmh] = useState<number>(35);
  const [climbPowerWatts, setClimbPowerWatts] = useState<number>(profile.ftpWatts || 240);
  const [climbGradePct, setClimbGradePct] = useState<number>(7.5);

  const [items, setItems] = useState<UpgradeItem[]>(DEFAULT_ITEMS_WITH_SPECS);

  // Speed scaling factor for aerodynamic power (P_aero proportional to v^3)
  const speedScalingFactor = useMemo(() => {
    // Standard wind tunnel benchmarks are tested at 40 km/h (11.11 m/s)
    return Math.pow(flatCruiseSpeedKmh / 40, 3);
  }, [flatCruiseSpeedKmh]);

  // Toggle item participation
  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  // Select a preset spec for an item (auto-calculates realistic weights and watts!)
  const handleSelectSpec = (itemId: string, specIndex: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const spec = item.specs[specIndex];
        if (spec) {
          return {
            ...item,
            selectedSpecIndex: specIndex,
            weightSaveG: spec.weightG,
            powerSaveWatts: parseFloat((spec.baseWatts40 * speedScalingFactor).toFixed(1)),
            costYuan: spec.refPrice
          };
        }
      }
      return item;
    }));
  };

  // In-place field updates
  const updateItemField = (id: string, field: keyof UpgradeItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Add Custom Upgrade Component
  const handleAddCustomItem = () => {
    const newId = Date.now().toString();
    setItems(prev => [
      ...prev,
      {
        id: newId,
        name: `自定义改装件 #${prev.length + 1}`,
        category: 'aero',
        weightSaveG: 50,
        powerSaveWatts: 2.0,
        costYuan: 500,
        enabled: true,
        specs: [
          { label: '自定义规格', weightG: 50, baseWatts40: 2.0, refPrice: 500, note: '用户手动自定义设定' }
        ]
      }
    ]);
    showToast('已添加自定义改装件！', 'success');
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculation of Savings and ROI
  const analysis = useMemo(() => {
    const activeItems = items.filter(i => i.enabled);

    const totalWeightSaveG = activeItems.reduce((sum, i) => sum + (Number(i.weightSaveG) || 0), 0);
    const totalPowerSaveWatts = activeItems.reduce((sum, i) => sum + (Number(i.powerSaveWatts) || 0), 0);
    const totalCostYuan = activeItems.reduce((sum, i) => sum + (Number(i.costYuan) || 0), 0);

    // 1. Flat 40km time saved (at baseline cruise speed)
    const flatDistM = 40000;
    const vBaseMs = flatCruiseSpeedKmh / 3.6;
    const pBaseAero = 0.5 * 1.20 * 0.32 * Math.pow(vBaseMs, 3);
    const pNewAero = Math.max(10, pBaseAero - totalPowerSaveWatts);
    const vNewMs = Math.pow(pBaseAero / pNewAero, 1 / 3) * vBaseMs;
    const flatTimeBaseSec = flatDistM / vBaseMs;
    const flatTimeNewSec = flatDistM / vNewMs;
    const flatTimeSavedSec = Math.max(0, Math.round(flatTimeBaseSec - flatTimeNewSec));

    // 2. Climb 10km @ 7.5% time saved
    const climbDistM = 10000;
    const massBase = totalSystemWeightKg;
    const massNew = Math.max(40, totalSystemWeightKg - totalWeightSaveG / 1000);

    const vClimbBaseMs = (climbPowerWatts / (massBase * 9.81 * (climbGradePct / 100) + massBase * 9.81 * 0.004));
    const vClimbNewMs = ((climbPowerWatts + totalPowerSaveWatts * 0.3) / (massNew * 9.81 * (climbGradePct / 100) + massNew * 9.81 * 0.004));

    const climbTimeBaseSec = climbDistM / vClimbBaseMs;
    const climbTimeNewSec = climbDistM / vClimbNewMs;
    const climbTimeSavedSec = Math.max(0, Math.round(climbTimeBaseSec - climbTimeNewSec));

    // 3. ROI Metric: Cost per Watt & Cost per Gram
    const costPerWatt = totalPowerSaveWatts > 0 ? Math.round(totalCostYuan / totalPowerSaveWatts) : 0;
    const costPerGram = totalWeightSaveG > 0 ? parseFloat((totalCostYuan / totalWeightSaveG).toFixed(1)) : 0;

    let roiLevel = '⭐⭐⭐⭐⭐ 极高性价比 (神装首选)';
    let roiBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (costPerWatt > 1000) {
      roiLevel = '⭐ 边际递减奢华件 (高溢价极限追瓦)';
      roiBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else if (costPerWatt > 400) {
      roiLevel = '⭐⭐⭐ 良好进阶升级 (适中性价比)';
      roiBadgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }

    return {
      activeCount: activeItems.length,
      totalWeightSaveG,
      totalPowerSaveWatts: parseFloat(totalPowerSaveWatts.toFixed(1)),
      totalCostYuan,
      flatTimeSavedSec,
      climbTimeSavedSec,
      costPerWatt,
      costPerGram,
      roiLevel,
      roiBadgeColor
    };
  }, [items, totalSystemWeightKg, flatCruiseSpeedKmh, climbPowerWatts, climbGradePct]);

  // Chart Data
  const chartData = useMemo(() => {
    return {
      labels: items.map(i => i.name.slice(0, 10)),
      datasets: [
        {
          label: '单品省瓦 (Watts)',
          data: items.map(i => Number(i.powerSaveWatts) || 0),
          backgroundColor: items.map(i => i.enabled ? 'rgba(0, 175, 255, 0.75)' : 'rgba(100, 116, 139, 0.2)'),
          borderRadius: 6,
        }
      ]
    };
  }, [items]);

  const copyReport = () => {
    const text = `⚖️ SoloRiderTools 零件减重与气动升级省瓦性价比报告:
- 选定升级件数: ${analysis.activeCount} 项
- 总减重: -${analysis.totalWeightSaveG} g | 气动/滚阻总省瓦: +${analysis.totalPowerSaveWatts} W
- 自定义总预算: ¥${analysis.totalCostYuan} 元
- 40km 平路预计节省: ${analysis.flatTimeSavedSec} 秒 (~${(analysis.flatTimeSavedSec / 60).toFixed(1)} 分钟)
- 10km 爬坡预计节省: ${analysis.climbTimeSavedSec} 秒 (~${(analysis.climbTimeSavedSec / 60).toFixed(1)} 分钟)
- 每省 1 瓦成本: ¥${analysis.costPerWatt} 元/W (${analysis.roiLevel})`;
    navigator.clipboard.writeText(text);
    showToast('改装升级性价比报告已复制到剪贴板！', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5" />
              风洞实测基准与改装边际效益测算
            </div>
            <h1 className="text-2xl font-bold text-slate-100">零件减重与气动升级省瓦推算器</h1>
            <p className="text-slate-400 text-sm mt-1">
              内置各大实验室风洞实测基准（轮组/头盔/骑行服/内胎），支持<strong>规格下拉一键自动推算省瓦</strong>或手动自定义，自动随巡航车速折算真实收益。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyReport}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              复制改装报告
            </button>
            <button
              onClick={handleAddCustomItem}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              添加自定义件
            </button>
          </div>
        </div>
      </div>

      {/* Cruise speed and baseline controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            基准巡航车速:
          </span>
          <div className="w-36">
            <NumberStepper
              value={flatCruiseSpeedKmh}
              onChange={setFlatCruiseSpeedKmh}
              step={1}
              min={20}
              max={55}
              unit="km/h"
            />
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (省瓦按 P ∝ v³ 随车速动态折算: ×{(speedScalingFactor).toFixed(2)})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-semibold">人车总重:</span>
          <div className="w-36">
            <NumberStepper
              value={totalSystemWeightKg}
              onChange={setTotalSystemWeightKg}
              step={0.5}
              min={45}
              max={150}
              unit="kg"
              decimals={1}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Upgrade Items (Spec Picker + Custom In-place Inputs) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                备选改装清单（下拉选择规格自动带出实测参数）
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                已生效 {analysis.activeCount} / {items.length} 件
              </span>
            </div>

            <div className="space-y-3.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border space-y-3 transition ${
                    item.enabled
                      ? 'bg-slate-50/90 dark:bg-slate-900/90 border-cyan-500/40 ring-1 ring-cyan-500/20'
                      : 'bg-white/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="text-cyan-500 dark:text-cyan-400 shrink-0 hover:scale-110 transition"
                      >
                        {item.enabled ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />}
                      </button>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemField(item.id, 'name', e.target.value)}
                        className="bg-transparent font-bold text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:text-cyan-600 dark:focus:text-cyan-400 w-full truncate border-b border-transparent focus:border-cyan-500/50 pb-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {items.length > 1 && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition"
                          title="删除该项目"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spec Dropdown (Autofills wind tunnel baseline!) */}
                  {item.specs && item.specs.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <span>规格选型 (选择后自动填入风洞与重量基准):</span>
                      </label>
                      <select
                        value={item.selectedSpecIndex ?? 0}
                        onChange={(e) => handleSelectSpec(item.id, parseInt(e.target.value, 10))}
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-700 dark:text-cyan-300 font-medium focus:outline-none focus:border-cyan-500 truncate"
                      >
                        {item.specs.map((sp, sIdx) => (
                          <option key={sIdx} value={sIdx}>
                            {sp.label} (40km/h实测省 {sp.baseWatts40}W / 减 {sp.weightG}g)
                          </option>
                        ))}
                      </select>
                      {item.specs[item.selectedSpecIndex ?? 0]?.note && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400/90 pl-1 leading-relaxed">
                          💡 {item.specs[item.selectedSpecIndex ?? 0].note}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Editable 3 Inputs: Price, Weight Save, Watt Save */}
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1.5 border-t border-slate-200 dark:border-slate-800/60 font-mono">
                    <div className="bg-slate-100 dark:bg-slate-950/80 rounded-lg p-2 border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5 font-sans">实际价格 (元)</span>
                      <div className="flex items-center text-amber-500 dark:text-amber-400 font-bold">
                        <span className="text-[11px] mr-1">¥</span>
                        <input
                          type="number"
                          value={item.costYuan}
                          onChange={(e) => updateItemField(item.id, 'costYuan', parseFloat(e.target.value) || 0)}
                          className="bg-transparent w-full focus:outline-none text-amber-600 dark:text-amber-400 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-950/80 rounded-lg p-2 border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5 font-sans">减重幅度 (克)</span>
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                        <input
                          type="number"
                          value={item.weightSaveG}
                          onChange={(e) => updateItemField(item.id, 'weightSaveG', parseFloat(e.target.value) || 0)}
                          className="bg-transparent w-full focus:outline-none text-emerald-600 dark:text-emerald-400 text-xs font-mono"
                        />
                        <span className="text-[10px] text-slate-500 font-normal ml-0.5">g</span>
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-950/80 rounded-lg p-2 border border-slate-200 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5 font-sans">
                        省瓦收益 ({flatCruiseSpeedKmh}km/h)
                      </span>
                      <div className="flex items-center text-cyan-600 dark:text-cyan-400 font-bold">
                        <input
                          type="number"
                          step="0.1"
                          value={item.powerSaveWatts}
                          onChange={(e) => updateItemField(item.id, 'powerSaveWatts', parseFloat(e.target.value) || 0)}
                          className="bg-transparent w-full focus:outline-none text-cyan-600 dark:text-cyan-400 text-xs font-mono"
                        />
                        <span className="text-[10px] text-slate-500 font-normal ml-0.5">W</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Dashboard & ROI Rating */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-slate-400 text-[11px] font-medium block">总计省瓦收益</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                +{analysis.totalPowerSaveWatts} <span className="text-xs text-slate-400 font-sans font-normal">W</span>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-slate-400 text-[11px] font-medium block">整车总减重</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                -{analysis.totalWeightSaveG} <span className="text-xs text-slate-400 font-sans font-normal">g</span>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-slate-400 text-[11px] font-medium block">改装总投资</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                ¥{analysis.totalCostYuan}
              </div>
            </div>
          </div>

          {/* Time Saved Comparisons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                40km 平路巡航省时
              </span>
              <div className="text-xl font-bold font-mono text-cyan-300">
                节省 {analysis.flatTimeSavedSec} 秒
              </div>
              <span className="text-[10px] text-slate-500">约 {(analysis.flatTimeSavedSec / 60).toFixed(1)} 分钟优势</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                10km 7.5% 爬坡省时
              </span>
              <div className="text-xl font-bold font-mono text-emerald-300">
                节省 {analysis.climbTimeSavedSec} 秒
              </div>
              <span className="text-[10px] text-slate-500">约 {(analysis.climbTimeSavedSec / 60).toFixed(1)} 分钟优势</span>
            </div>
          </div>

          {/* ROI Metric & Badge */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">改装性价比与边际收益评级</span>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${analysis.roiBadgeColor}`}>
                ¥{analysis.costPerWatt} 元 / W
              </span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {analysis.roiLevel}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              💡 <strong>风洞与改装避坑法则</strong>：
              <br />• <strong>黄金第一阶 (&lt;¥200/W)</strong>：修身/破风骑行服、TPU 超轻内胎/真空胎，花费几百元立省 7~10W。
              <br />• <strong>进阶第二阶 (¥300~600/W)</strong>：50mm 综合气动碳轮、一体把、气动头盔，兼具巡航破风与整车颜值。
              <br />• <strong>边际递减阶 (&gt;¥1000/W)</strong>：陶瓷大导轮、钛合金螺丝，适合发烧竞技车手追求极限边际增益。
            </p>
          </div>

          {/* Single Item Wattage Contribution Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">各单品省瓦贡献对比柱状图 (Watts @ {flatCruiseSpeedKmh}km/h)</span>
            <div className="h-44">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: '节省瓦数 (W)', font: { size: 10 } } }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
