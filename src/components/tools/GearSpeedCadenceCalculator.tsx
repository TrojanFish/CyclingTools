import React, { useState, useMemo } from 'react';
import { Cog, Gauge, Info, Zap, AlertTriangle, ArrowUpDown, Layers, Copy, BarChart2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Tooltip } from '../common/Tooltip';
import { NumberStepper } from '../common/NumberStepper';
import { useToast } from '../../context/ToastContext';

export const GearSpeedCadenceCalculator: React.FC = () => {
  const { showToast } = useToast();

  const [chainringType, setChainringType] = useState<'double' | 'single'>('double');
  const [bigRing, setBigRing] = useState<number>(50);
  const [smallRing, setSmallRing] = useState<number>(34);
  const [cogsStr, setCogsStr] = useState<string>('11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34');
  const [cadenceRpm, setCadenceRpm] = useState<number>(90);
  const [tireCircumferenceMm, setTireCircumferenceMm] = useState<number>(2136); // 700x28c
  const [activeTab, setActiveTab] = useState<'matrix' | 'cadence_table' | 'chart'>('matrix');

  // Tire circumference presets
  const TIRE_PRESETS = [
    { label: '700x23c (2096mm)', value: 2096 },
    { label: '700x25c (2105mm)', value: 2105 },
    { label: '700x28c (2136mm)', value: 2136 },
    { label: '700x30c (2146mm)', value: 2146 },
    { label: '700x32c (2155mm)', value: 2155 },
    { label: '700x38c Gravel (2180mm)', value: 2180 },
    { label: '700x40c Gravel (2200mm)', value: 2200 },
    { label: '29x2.2 MTB (2288mm)', value: 2288 },
  ];

  // Parse cogs
  const cogsList = useMemo(() => {
    return cogsStr
      .split(/[,，\s]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
  }, [cogsStr]);

  // Gear Step % differences
  const gearSteps = useMemo(() => {
    const steps: { cog: number; nextCog?: number; jumpPct?: number }[] = [];
    for (let i = 0; i < cogsList.length; i++) {
      const current = cogsList[i];
      const next = cogsList[i + 1];
      if (next) {
        const jump = parseFloat((((next - current) / current) * 100).toFixed(1));
        steps.push({ cog: current, nextCog: next, jumpPct: jump });
      } else {
        steps.push({ cog: current });
      }
    }
    return steps;
  }, [cogsList]);

  // Preset Gruppos
  const loadPresetGruppo = (key: string) => {
    if (key === 'compact') {
      setChainringType('double');
      setBigRing(50);
      setSmallRing(34);
      setCogsStr('11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34');
    } else if (key === 'semi_compact') {
      setChainringType('double');
      setBigRing(52);
      setSmallRing(36);
      setCogsStr('11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 27, 30');
    } else if (key === 'pro_racing') {
      setChainringType('double');
      setBigRing(54);
      setSmallRing(40);
      setCogsStr('11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 28, 30');
    } else if (key === 'sram_axs') {
      setChainringType('double');
      setBigRing(48);
      setSmallRing(35);
      setCogsStr('10, 11, 12, 13, 14, 15, 17, 19, 21, 24, 28, 33');
    } else if (key === 'gravel_1x') {
      setChainringType('single');
      setBigRing(40);
      setCogsStr('10, 11, 13, 15, 17, 19, 21, 24, 28, 32, 38, 44');
    }
  };

  // Speed matrix at current cadence
  const speedMatrix = useMemo(() => {
    const rings = chainringType === 'double' ? [bigRing, smallRing] : [bigRing];
    return rings.map(ring => {
      const row = cogsList.map((cog, index) => {
        const ratio = ring / cog;
        const speedKmh = (ratio * cadenceRpm * tireCircumferenceMm * 60) / 1000000;
        const devMeters = (ratio * tireCircumferenceMm) / 1000;
        const gearInches = ratio * (tireCircumferenceMm / (Math.PI * 25.4));

        const isBigBig = chainringType === 'double' && ring === bigRing && index >= cogsList.length - 2;
        const isSmallSmall = chainringType === 'double' && ring === smallRing && index <= 1;

        return {
          cog,
          ratio: parseFloat(ratio.toFixed(2)),
          speedKmh: parseFloat(speedKmh.toFixed(1)),
          devMeters: parseFloat(devMeters.toFixed(2)),
          gearInches: parseFloat(gearInches.toFixed(1)),
          isCrossChained: isBigBig || isSmallSmall,
          crossType: isBigBig ? '大盘对大飞 (Big-Big)' : isSmallSmall ? '小盘对小飞 (Small-Small)' : null
        };
      });
      return { ring, row };
    });
  }, [chainringType, bigRing, smallRing, cogsList, cadenceRpm, tireCircumferenceMm]);

  // Multi-cadence sweep table (70, 80, 90, 100, 110 RPM)
  const multiCadenceData = useMemo(() => {
    const cadences = [70, 80, 90, 100, 110];
    const ring = bigRing;
    return cogsList.map(cog => {
      const ratio = ring / cog;
      const speeds = cadences.map(cad => parseFloat(((ratio * cad * tireCircumferenceMm * 60) / 1000000).toFixed(1)));
      return { cog, ratio: ratio.toFixed(2), speeds };
    });
  }, [bigRing, cogsList, tireCircumferenceMm]);

  // Chart data for Speed vs Cadence
  const chartData = useMemo(() => {
    const cadences = [60, 70, 80, 90, 100, 110, 120];
    const fastestCog = cogsList[0] || 11;
    const midCog = cogsList[Math.floor(cogsList.length / 2)] || 17;
    const climbingCog = cogsList[cogsList.length - 1] || 34;

    const calcSpeed = (ring: number, cog: number, cad: number) => {
      return parseFloat(((ring / cog * cad * tireCircumferenceMm * 60) / 1000000).toFixed(1));
    };

    return {
      labels: cadences.map(c => `${c} RPM`),
      datasets: [
        {
          label: `大盘高速档 (${bigRing}x${fastestCog}T)`,
          data: cadences.map(c => calcSpeed(bigRing, fastestCog, c)),
          borderColor: '#00AFFF',
          backgroundColor: 'rgba(0, 175, 255, 0.1)',
          tension: 0.3
        },
        {
          label: `中盘巡航档 (${bigRing}x${midCog}T)`,
          data: cadences.map(c => calcSpeed(bigRing, midCog, c)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3
        },
        {
          label: `爬坡极限档 (${chainringType === 'double' ? smallRing : bigRing}x${climbingCog}T)`,
          data: cadences.map(c => calcSpeed(chainringType === 'double' ? smallRing : bigRing, climbingCog, c)),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3
        }
      ]
    };
  }, [bigRing, smallRing, chainringType, cogsList, tireCircumferenceMm]);

  const copyGearMatrix = () => {
    const text = `🚴 齿比计算报告 (${chainringType === 'double' ? `${bigRing}/${smallRing}T` : `${bigRing}T`} + ${cogsStr} @ ${cadenceRpm} RPM):\n- 最大极速: ${speedMatrix[0]?.row[0]?.speedKmh} km/h (齿比: ${speedMatrix[0]?.row[0]?.ratio})\n- 最小爬坡: ${speedMatrix[speedMatrix.length - 1]?.row[cogsList.length - 1]?.speedKmh} km/h (齿比: ${speedMatrix[speedMatrix.length - 1]?.row[cogsList.length - 1]?.ratio})`;
    navigator.clipboard.writeText(text);
    showToast('齿比与速度矩阵报告已复制到剪贴板！', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <Cog className="w-3.5 h-3.5" />
              传动比与踏频动力学
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">齿比-速度-踏频多功能计算器</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              全档位齿比矩阵、多踏频速度分布、相邻跳齿百分比（Step %）与极限斜链位智能预警。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyGearMatrix}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              复制齿比表
            </button>

            {/* View Tab Switchers */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1 rounded-lg transition ${activeTab === 'matrix' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                全档位矩阵
              </button>
              <button
                onClick={() => setActiveTab('cadence_table')}
                className={`px-3 py-1 rounded-lg transition ${activeTab === 'cadence_table' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                多踏频对照
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-3 py-1 rounded-lg transition ${activeTab === 'chart' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                速度-踏频图
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs & Presets */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Gruppo Presets */}
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">经典套件规格一键预设:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadPresetGruppo('compact')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-800 transition"
            >
              压缩盘 50/34T + 11-34T
            </button>
            <button
              onClick={() => loadPresetGruppo('semi_compact')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-800 transition"
            >
              半压缩 52/36T + 11-30T
            </button>
            <button
              onClick={() => loadPresetGruppo('pro_racing')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-800 transition"
            >
              竞技标准 54/40T + 11-30T
            </button>
            <button
              onClick={() => loadPresetGruppo('sram_axs')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-800 transition"
            >
              SRAM AXS 48/35T + 10-33T
            </button>
            <button
              onClick={() => loadPresetGruppo('gravel_1x')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-800 transition"
            >
              Gravel 单盘 40T + 10-44T
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">牙盘制式</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setChainringType('double')}
                className={`py-2 rounded-xl border text-xs font-semibold transition ${
                  chainringType === 'double' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                双盘 (2x)
              </button>
              <button
                onClick={() => setChainringType('single')}
                className={`py-2 rounded-xl border text-xs font-semibold transition ${
                  chainringType === 'single' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                单盘 (1x)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              {chainringType === 'double' ? '大盘 / 小盘齿数' : '单盘齿数 (T)'}
            </label>
            {chainringType === 'double' ? (
              <div className="grid grid-cols-2 gap-2">
                <NumberStepper value={bigRing} onChange={setBigRing} min={38} max={62} unit="T" />
                <NumberStepper value={smallRing} onChange={setSmallRing} min={28} max={46} unit="T" />
              </div>
            ) : (
              <NumberStepper value={bigRing} onChange={setBigRing} min={30} max={56} unit="T" />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">飞轮齿数片组合</label>
            <input
              type="text"
              value={cogsStr}
              onChange={(e) => setCogsStr(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">目标基准踏频 (RPM)</label>
            <NumberStepper
              value={cadenceRpm}
              onChange={setCadenceRpm}
              step={5}
              min={40}
              max={150}
              unit="RPM"
            />
          </div>
        </div>

        {/* Tire preset picker */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">外胎周长规格:</span>
          {TIRE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setTireCircumferenceMm(p.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                tireCircumferenceMm === p.value
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step % Difference Analysis */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          相邻档位齿比变动阶梯 (Gear Step % Jump)
        </span>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {gearSteps.map((s, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">{s.cog}T</span>
              {s.nextCog && (
                <>
                  <span className="text-slate-400 dark:text-slate-500">→</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">+{s.jumpPct}%</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TAB 1: Speed & Gear Ratio Matrix */}
      {activeTab === 'matrix' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              在 {cadenceRpm} RPM 踏频下的全档位速度 (km/h) 与前进米数 (m) 矩阵
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-cyan-600 dark:text-cyan-400 sm:hidden font-medium">↔ 可横向滑动查看</span>
              <span className="text-slate-500">
                *黄色标记为极限斜链位 (Crossed-Chaining)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                  <th className="p-2.5 text-left font-sans">牙盘</th>
                  {cogsList.map(c => (
                    <th key={c} className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{c}T</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-mono">
                {speedMatrix.map((item, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition">
                    <td className="p-2.5 text-left font-bold text-cyan-600 dark:text-cyan-400 font-sans">
                      {item.ring}T
                    </td>
                    {item.row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-2.5 transition ${
                          cell.isCrossChained
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-bold'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                        title={cell.crossType || `齿比 ${cell.ratio} | 单脚前进 ${cell.devMeters}m`}
                      >
                        <div className="text-sm font-bold">{cell.speedKmh}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400/80">{cell.ratio} / {cell.devMeters}m</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Multi-Cadence Sweep Table */}
      {activeTab === 'cadence_table' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block">
              大盘 {bigRing}T 在不同踏频 (70 ~ 110 RPM) 下的速度对照 (km/h)
            </span>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 sm:hidden font-medium">↔ 可横向滑动查看</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                  <th className="p-2.5 text-left font-sans">飞轮齿片</th>
                  <th className="p-2.5">传动比</th>
                  <th className="p-2.5">70 RPM</th>
                  <th className="p-2.5">80 RPM</th>
                  <th className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">90 RPM (基准)</th>
                  <th className="p-2.5">100 RPM</th>
                  <th className="p-2.5">110 RPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-mono">
                {multiCadenceData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition">
                    <td className="p-2.5 text-left font-bold text-slate-200 font-sans">{bigRing}x{row.cog}T</td>
                    <td className="p-2.5 text-slate-400">{row.ratio}</td>
                    <td className="p-2.5">{row.speeds[0]}</td>
                    <td className="p-2.5">{row.speeds[1]}</td>
                    <td className="p-2.5 font-bold text-cyan-400 bg-cyan-500/5">{row.speeds[2]}</td>
                    <td className="p-2.5">{row.speeds[3]}</td>
                    <td className="p-2.5 text-emerald-400 font-semibold">{row.speeds[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Speed vs Cadence Visual Chart */}
      {activeTab === 'chart' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <span className="text-xs font-semibold text-slate-200 block">
            高速档、中盘巡航与爬坡极限档 踏频-车速线性曲线
          </span>
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#94a3b8' } },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#38bdf8',
                    bodyColor: '#f8fafc',
                    padding: 8
                  }
                },
                scales: {
                  x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                  y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: '速度 (km/h)' } }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
