import React, { useState, useMemo, useRef } from 'react';
import {
  FolderArchive,
  Search,
  SlidersHorizontal,
  Calendar,
  Zap,
  Timer,
  Mountain,
  Flame,
  Trash2,
  Download,
  Upload,
  Sparkles,
  ArrowRight,
  X,
  Plus,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  LocalActivityRecord,
  deleteLocalActivity,
  clearAllLocalActivities,
  exportActivitiesBackup,
  importActivitiesBackup,
  seedDemoSeasonActivities
} from '../../utils/localActivityDb';
import { useToast } from '../../context/ToastContext';

interface ActivityArchiveModalProps {
  isOpen: boolean;
  activities: LocalActivityRecord[];
  activeActivityId?: string;
  ftpWatts: number;
  weightKg: number;
  maxHr: number;
  onClose: () => void;
  onLoadActivity: (activity: LocalActivityRecord) => void;
  onRefreshList: () => Promise<void>;
}

export const ActivityArchiveModal: React.FC<ActivityArchiveModalProps> = ({
  isOpen,
  activities,
  activeActivityId,
  ftpWatts,
  weightKg,
  maxHr,
  onClose,
  onLoadActivity,
  onRefreshList
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'tss_desc' | 'dist_desc' | 'np_desc'>('date_desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSeeding, setIsSeeding] = useState(false);

  // Filter & Sort
  const filteredActivities = useMemo(() => {
    let result = activities.filter(act => {
      if (filterType !== 'all' && act.fileType !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        act.name.toLowerCase().includes(q) ||
        (act.fileName && act.fileName.toLowerCase().includes(q))
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'date_desc') return b.startTime - a.startTime;
      if (sortBy === 'date_asc') return a.startTime - b.startTime;
      if (sortBy === 'tss_desc') return b.tss - a.tss;
      if (sortBy === 'dist_desc') return b.distanceKm - a.distanceKm;
      if (sortBy === 'np_desc') return b.normalizedPower - a.normalizedPower;
      return 0;
    });

    return result;
  }, [activities, searchQuery, sortBy, filterType]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`确定要删除「${name}」的记录与详细时序流吗？`)) return;

    try {
      await deleteLocalActivity(id);
      showToast(`已删除活动「${name}」`, 'info');
      await onRefreshList();
    } catch (err: any) {
      showToast(`删除失败: ${err.message}`, 'error');
    }
  };

  const handleClearAll = async () => {
    if (activities.length === 0) return;
    if (!window.confirm(`确定要清空全部 ${activities.length} 场本地骑行记录吗？此操作无法撤销！`)) return;

    try {
      await clearAllLocalActivities();
      showToast('已清空本地活动数据库', 'info');
      await onRefreshList();
    } catch (err: any) {
      showToast(`清空失败: ${err.message}`, 'error');
    }
  };

  const handleExportBackup = async () => {
    if (activities.length === 0) {
      showToast('当前没有可导出的活动记录', 'warning');
      return;
    }
    try {
      const json = await exportActivitiesBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rouleur_activities_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`已导出 ${activities.length} 场活动备份文件！`, 'success');
    } catch (err: any) {
      showToast(`导出失败: ${err.message}`, 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const count = await importActivitiesBackup(text);
      showToast(`成功恢复 ${count} 场活动记录！`, 'success');
      await onRefreshList();
    } catch (err: any) {
      showToast(`恢复失败: ${err.message || '格式无效'}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSeedDemoSeason = async () => {
    setIsSeeding(true);
    try {
      const seeded = await seedDemoSeasonActivities(ftpWatts, weightKg, maxHr);
      showToast(`已成功写入 ${seeded.length} 场拟真赛季经典拉练数据！`, 'success');
      await onRefreshList();
    } catch (err: any) {
      showToast(`初始化演示数据失败: ${err.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full sm:max-w-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-t-[28px] sm:rounded-2xl shadow-ios-popover overflow-hidden flex flex-col max-h-[90vh] animate-spring-up"
        role="dialog"
        aria-modal="true"
      >
        {/* iOS Drag Handle on Mobile */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ios-blue/10 text-ios-blue flex items-center justify-center font-bold">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  战队档案库 · Local-First 时序时空站
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-ios-blue/10 text-ios-blue border border-ios-blue/20 tabular-nums">
                  {activities.length} 场骑行
                </span>
              </div>
              <p className="text-xs text-slate-500">
                100% 离线隐私保护 · 秒级时序与 MMP 矩阵永久驻留本地
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="apple-touch w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索活动名称或文件名..."
                className="h-9 w-full pl-9 pr-3 rounded-xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-ios-blue"
              />
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-ios-blue"
            >
              <option value="date_desc">按时间 (最新优先)</option>
              <option value="date_asc">按时间 (最早优先)</option>
              <option value="tss_desc">按 TSS 训练负荷</option>
              <option value="dist_desc">按骑行总里程</option>
              <option value="np_desc">按 NP 归一化功率</option>
            </select>

            {/* Filter by Format */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-ios-blue"
            >
              <option value="all">所有格式 ({activities.length})</option>
              <option value="fit">FIT 原生码表</option>
              <option value="gpx">GPX 轨迹</option>
              <option value="tcx">TCX 训练</option>
              <option value="demo">拟真示范数据</option>
            </select>
          </div>
        </div>

        {/* Activity List Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {searchQuery ? '未找到符合条件的活动记录' : '战队档案库暂无活动'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? '请尝试更换搜索关键字或清除格式筛选条件。'
                    : '你可以拖拽或批量上传 .fit/.gpx/.tcx 码表文件，或直接载入 15 场经典拟真赛季拉练数据。'}
                </p>
              </div>

              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleSeedDemoSeason}
                  disabled={isSeeding}
                  className="apple-touch h-9 px-4 rounded-xl bg-ios-blue text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-ios-sm hover:bg-ios-blue/90 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSeeding ? '正在写入...' : '一键载入 15 场拟真赛季拉练数据'}</span>
                </button>
              )}
            </div>
          ) : (
            filteredActivities.map((act) => {
              const isSelected = act.id === activeActivityId;
              const dateStr = new Date(act.startDate || act.startTime).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={act.id}
                  onClick={() => onLoadActivity(act)}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-ios-blue/5 border-ios-blue/40 shadow-xs'
                      : 'bg-white dark:bg-[#2C2C2E]/50 border-slate-200/70 dark:border-white/10 hover:border-ios-blue/30 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {/* Left: Metadata */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {act.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {act.fileType}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ios-blue text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>当前正在分析</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono tabular-nums">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        {act.distanceKm.toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3 text-slate-400" />
                        {formatDuration(act.movingTimeSec || act.totalDurationSec)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mountain className="w-3 h-3 text-slate-400" />
                        +{act.elevationGainM}m
                      </span>
                    </div>

                    {/* Telemetry badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-ios-orange/10 text-ios-orange tabular-nums">
                        NP {act.normalizedPower} W
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-ios-blue/10 text-ios-blue tabular-nums">
                        IF {act.intensityFactor}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-ios-purple/10 text-ios-purple tabular-nums">
                        TSS {act.tss}
                      </span>
                      {act.hasShifting && act.shiftCount && (
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 tabular-nums">
                          电变 {act.shiftCount}次
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadActivity(act);
                      }}
                      className="apple-touch h-9 px-3 rounded-xl bg-ios-blue/10 hover:bg-ios-blue/20 text-ios-blue text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>载入分析</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, act.id, act.name)}
                      className="apple-touch h-9 w-9 rounded-xl bg-slate-100 hover:bg-ios-red/10 hover:text-ios-red dark:bg-white/10 text-slate-400 transition flex items-center justify-center"
                      title="删除此记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer / Maintenance Hub */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#1C1C1E] flex flex-wrap items-center justify-between gap-2">
          {/* Left: Backup & Demo seed */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleExportBackup}
              className="apple-touch h-9 px-3 rounded-xl bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出备份</span>
            </button>

            <label className="apple-touch h-9 px-3 rounded-xl bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>恢复备份</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleSeedDemoSeason}
              disabled={isSeeding}
              className="apple-touch h-9 px-3 rounded-xl bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-ios-blue font-semibold hover:bg-ios-blue/5 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSeeding ? '写入中...' : '载入拟真赛季(15场)'}</span>
            </button>
          </div>

          {/* Right: Clear All & Close */}
          <div className="flex items-center gap-2">
            {activities.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="apple-touch h-9 px-3 rounded-xl text-xs text-ios-red hover:bg-ios-red/10 font-semibold transition"
              >
                清空档案库
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="apple-touch h-9 px-4 rounded-xl bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-300 dark:hover:bg-white/30 transition"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
