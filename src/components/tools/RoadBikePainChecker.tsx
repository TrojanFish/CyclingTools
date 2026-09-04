import React, { useState, useEffect, useMemo } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Wrench, Heart, Download, CheckSquare, Square, Search, RotateCcw, Copy, Sparkles } from 'lucide-react';
import { PAIN_AREAS, GENERAL_RECOVERY_TIPS } from '../../data/painCheckerData';
import { BodyPainDiagram } from '../common/BodyPainDiagram';
import { useToast } from '../../context/ToastContext';

export const RoadBikePainChecker: React.FC = () => {
  const { showToast } = useToast();
  const [selectedAreaId, setSelectedAreaId] = useState<string>('knee');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('yolo_cycling_pain_checks');
    return saved ? JSON.parse(saved) : {};
  });

  const activeArea = PAIN_AREAS[selectedAreaId] || PAIN_AREAS['knee'];

  useEffect(() => {
    localStorage.setItem('yolo_cycling_pain_checks', JSON.stringify(completedChecks));
  }, [completedChecks]);

  const toggleCheck = (idxKey: string) => {
    setCompletedChecks(prev => ({
      ...prev,
      [idxKey]: !prev[idxKey]
    }));
  };

  const resetCurrentAreaChecks = () => {
    setCompletedChecks(prev => {
      const copy = { ...prev };
      activeArea.specificSelfCheck.forEach((_, idx) => {
        delete copy[`${selectedAreaId}_${idx}`];
      });
      return copy;
    });
    showToast('已重置当前部位的所有排查勾选！', 'info');
  };

  // Search filter across all pain areas
  const matchingAreaIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return Object.entries(PAIN_AREAS).filter(([_, item]) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSymptoms = item.symptoms.some(s => s.toLowerCase().includes(q));
      const matchChecks = item.specificSelfCheck.some(c => c.toLowerCase().includes(q));
      return matchTitle || matchSymptoms || matchChecks;
    }).map(([id]) => id);
  }, [searchQuery]);

  // Check progress
  const checkedCount = activeArea.specificSelfCheck.filter((_, idx) => completedChecks[`${selectedAreaId}_${idx}`]).length;
  const totalChecks = activeArea.specificSelfCheck.length;
  const progressPct = Math.round((checkedCount / totalChecks) * 100);

  // Export Guide
  const exportActionPlan = () => {
    const text = `【SoloRiderTools - 骑行不适自查与调车方案】
自查部位: ${activeArea.title}
排查进度: ${checkedCount}/${totalChecks} 项已核实 (${progressPct}%)
生成日期: ${new Date().toLocaleString()}
------------------------------------------------
【主要典型症状】
${activeArea.symptoms.map(s => `- ${s}`).join('\n')}

【针对性自查与调车排查清单】
${activeArea.specificSelfCheck.map((sc, i) => {
  const isDone = completedChecks[`${selectedAreaId}_${i}`];
  return `[${isDone ? '已排查 √' : '待核验 □'}] ${i + 1}. ${sc}`;
}).join('\n')}

【根本成因分析】
${activeArea.commonCauses.map(c => `[${c.category}]\n${c.details.map(d => `  * ${d}`).join('\n')}`).join('\n\n')}

------------------------------------------------
【通用运动康复与预防指南】
${GENERAL_RECOVERY_TIPS.map(tip => `* ${tip.title}: ${tip.content}`).join('\n')}
`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `骑行疼痛排查指南_${activeArea.title.split(' ')[0]}_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('排查调车指南文件已成功导出！', 'success');
  };

  const copyActionPlan = () => {
    const text = `【SoloRiderTools 骑行自查方案 - ${activeArea.title}】
排查进度: ${checkedCount}/${totalChecks} 项已核实 (${progressPct}%)
【针对性调车清单】:
${activeArea.specificSelfCheck.map((sc, i) => `${i + 1}. ${sc}`).join('\n')}
【主要成因】:
${activeArea.commonCauses.map(c => `- ${c.category}: ${c.details.join('; ')}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    showToast('排查方案已复制到剪贴板！', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <Activity className="w-3.5 h-3.5" />
              骑行运动医学自查系统
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">公路车骑行疼痛排查与自诊指南</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              覆盖膝盖、腰背、颈肩、手腕、臀部及足底 6 大核心部位，科学排查车辆设定成因并提供调车指引。
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={copyActionPlan}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition"
            >
              <Copy className="w-3.5 h-3.5" />
              复制清单
            </button>
            <button
              onClick={exportActionPlan}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-xs transition shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              导出排查指南
            </button>
          </div>
        </div>

        {/* Quick Symptom Search Input */}
        <div className="relative mt-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索不适关键词快速定位 (如: 髌骨, 膝前痛, 手麻, 会阴, 锁片, 塌腰)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
              匹配到 {matchingAreaIds.length} 个部位
            </span>
          )}
        </div>

        {/* Body Area Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-4">
          {Object.entries(PAIN_AREAS).map(([key, item]) => {
            const isMatch = matchingAreaIds.includes(key);
            const isSelected = selectedAreaId === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedAreaId(key)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 relative ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-md ring-1 ring-cyan-500/30 font-bold'
                    : isMatch
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {isMatch && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                )}
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Symptoms & Interactive Body Map */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Body Visualizer */}
          <BodyPainDiagram
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
          />

          {/* Symptoms Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              常见不适症状表现 ({activeArea.title.split(' ')[0]})
            </h2>
            <div className="space-y-2.5">
              {activeArea.symptoms.map((sym, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 text-slate-700 dark:text-slate-300 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{sym}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Step by Step Action Plan & Checklist */}
        <div className="lg:col-span-7 space-y-6">
          {/* Specific Self-Check Action Items with Checklist */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                针对性自查与调车清单 ({checkedCount}/{totalChecks} 已排查)
              </h2>
              {checkedCount > 0 && (
                <button
                  onClick={resetCurrentAreaChecks}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-500 self-start sm:self-auto transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置本部位勾选
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>

            <div className="space-y-3">
              {activeArea.specificSelfCheck.map((item, idx) => {
                const key = `${selectedAreaId}_${idx}`;
                const isChecked = !!completedChecks[key];

                return (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(key)}
                    className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-slate-500 line-through'
                        : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <button className="mt-0.5 text-emerald-500 dark:text-emerald-400 shrink-0">
                      {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400 dark:text-slate-600" />}
                    </button>
                    <p className={`text-xs leading-relaxed ${isChecked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Root Causes Accordion / List */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              根源成因深度剖析
            </h2>
            <div className="space-y-3">
              {activeArea.commonCauses.map((cause, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400"></span>
                    {cause.category}
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-3.5 list-disc">
                    {cause.details.map((d, dIdx) => (
                      <li key={dIdx} className="leading-relaxed">{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* General Rehabilitation & Care Tips */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              运动康复与损伤预防通用法则
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GENERAL_RECOVERY_TIPS.map((tip, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-semibold text-rose-600 dark:text-rose-300">{tip.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{tip.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

