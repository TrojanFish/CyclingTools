import React, { useState, useEffect, useMemo } from 'react';
import { Activity, ShieldAlert, CheckCircle2, Wrench, Heart, CheckSquare, Square, Search, RotateCcw, Sparkles, PersonStanding, Shield, Hand, Disc, Footprints } from 'lucide-react';
import { PAIN_AREAS, GENERAL_RECOVERY_TIPS } from '../../data/painCheckerData';
import { BodyPainDiagram } from '../common/BodyPainDiagram';
import { IOSCard, IOSCardHeader } from '../common/IOSCard';
import { IOSToolHeader } from '../common/IOSToolHeader';
import { ShareCardModal } from '../common/ShareCardModal';
import { generatePainCheckPoster } from '../../utils/shareCardGenerators';
import { useToast } from '../../context/ToastContext';

const areaIconMap: Record<string, React.FC<{ className?: string }>> = {
  knee: Activity,
  lower_back: PersonStanding,
  neck_shoulder: Shield,
  wrist_hand: Hand,
  buttock: Disc,
  foot: Footprints,
};

export const RoadBikePainChecker: React.FC = () => {
  const { showToast } = useToast();
  const [selectedAreaId, setSelectedAreaId] = useState<string>('knee');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Share Poster State
  const [sharePosterUrl, setSharePosterUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_pain_checks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const activeArea = PAIN_AREAS[selectedAreaId] || PAIN_AREAS['knee'];

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_pain_checks', JSON.stringify(completedChecks));
    } catch (e) {
      console.warn('Failed to save pain checks:', e);
    }
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

  const handleGeneratePoster = () => {
    const url = generatePainCheckPoster({
      areaTitle: activeArea.title,
      checkedCount,
      totalChecks,
      progressPct,
      causes: activeArea.commonCauses,
      checklist: activeArea.specificSelfCheck
    });
    setSharePosterUrl(url);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Unified Tool Header */}
      <IOSToolHeader
        category="骑行运动医学与 Fitting 诊断"
        categoryIcon={Activity}
        title="公路车骑行疼痛排查与自诊指南"
        description="覆盖膝盖、腰背、颈肩、手腕、臀部及足底 6 大核心部位，科学排查车辆设定成因并提供调车指引。"
        tint="purple"
        onShare={handleGeneratePoster}
        shareTitle="生成针对性调车自纠处方海报卡片"
      />

      {/* Search & Area Selection Card */}
      <IOSCard variant="default" className="space-y-3.5">
        {/* Apple Spotlight Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索不适关键词快速定位 (如: 髌骨, 膝前痛, 手麻, 会阴, 锁片, 塌腰)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.05] dark:border-white/[0.08] rounded-xl pl-8.5 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ios-purple transition"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ios-purple font-mono">
              匹配到 {matchingAreaIds.length} 个部位
            </span>
          )}
        </div>

        {/* Body Area Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-0.5">
          {Object.entries(PAIN_AREAS).map(([key, item]) => {
            const isMatch = matchingAreaIds.includes(key);
            const isSelected = selectedAreaId === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedAreaId(key)}
                className={`apple-touch p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 relative active:scale-95 ${
                  isSelected
                    ? 'bg-ios-red text-white border-ios-red shadow-ios-sm shadow-ios-red/25 ring-2 ring-ios-red/30 font-bold scale-[1.02] z-10'
                    : isMatch
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-semibold ring-1 ring-amber-500/30'
                    : 'bg-black/[0.03] dark:bg-white/[0.06] border-black/[0.05] dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.1]'
                }`}
              >
                {isMatch && !isSelected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#1C1C1E]" />
                )}
                {(() => {
                  const AreaIcon = areaIconMap[key] || Activity;
                  return (
                    <AreaIcon
                      className={`w-4 h-4 transition-colors ${
                        isSelected
                          ? 'text-white'
                          : isMatch
                          ? 'text-amber-500 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                  );
                })()}
                <span className={`text-xs ${isSelected ? 'text-white font-bold' : ''}`}>{item.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </IOSCard>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Symptoms & Interactive Body Map */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interactive Body Visualizer */}
          <BodyPainDiagram
            selectedAreaId={selectedAreaId}
            onSelectArea={(id) => setSelectedAreaId(id)}
          />

          {/* Symptoms Card */}
          <IOSCard variant="default" className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              常见不适症状表现 ({activeArea.title.split(' ')[0]})
            </h2>
            <div className="space-y-2.5">
              {activeArea.symptoms.map((sym, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-200 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{sym}</span>
                </div>
              ))}
            </div>
          </IOSCard>
        </div>

        {/* Right Column: Step by Step Action Plan & Checklist */}
        <div className="lg:col-span-7 space-y-4">
          {/* Specific Self-Check Action Items with Checklist */}
          <IOSCard variant="default" className="p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                针对性自查与调车清单 ({checkedCount}/{totalChecks} 已排查)
              </h2>
              {checkedCount > 0 && (
                <button
                  onClick={resetCurrentAreaChecks}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-500 self-start sm:self-auto transition apple-touch"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置勾选
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>

            <div className="space-y-2.5">
              {activeArea.specificSelfCheck.map((item, idx) => {
                const key = `${selectedAreaId}_${idx}`;
                const isChecked = !!completedChecks[key];

                return (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(key)}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition apple-touch ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-500 line-through'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.08] text-slate-800 dark:text-slate-200 hover:border-black/10 dark:hover:border-white/15'
                    }`}
                  >
                    <span className="mt-0.5 text-emerald-500 dark:text-emerald-400 shrink-0">
                      {isChecked ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5 text-slate-400 dark:text-slate-600" />}
                    </span>
                    <p className={`text-xs leading-relaxed ${isChecked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item}
                    </p>
                  </div>
                );
              })}
            </div>
          </IOSCard>

          {/* Root Causes Accordion / List */}
          <IOSCard variant="default" className="p-4 sm:p-5 space-y-3.5">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-ios-blue" />
              根源成因深度剖析
            </h2>
            <div className="space-y-3">
              {activeArea.commonCauses.map((cause, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] space-y-2">
                  <h3 className="text-xs font-bold text-ios-blue flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ios-blue"></span>
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
          </IOSCard>

          {/* General Rehabilitation & Care Tips */}
          <IOSCard variant="default" className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              运动康复与损伤预防通用法则
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GENERAL_RECOVERY_TIPS.map((tip, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] space-y-1.5">
                  <h4 className="text-xs font-semibold text-rose-500 dark:text-rose-400">{tip.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{tip.content}</p>
                </div>
              ))}
            </div>
          </IOSCard>
        </div>
      </div>

      {/* Social Share Poster Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={sharePosterUrl}
        title="骑行疼痛自诊处方卡"
        downloadFileName={`SoloRider_疼痛自诊_${activeArea.title.split(' ')[0]}.png`}
      />
    </div>
  );
};

