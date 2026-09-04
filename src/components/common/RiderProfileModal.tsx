import React from 'react';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useToast } from '../../context/ToastContext';
import { User, X, Check, RotateCcw, Activity, ShieldCheck } from 'lucide-react';
import { NumberStepper } from './NumberStepper';

interface RiderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiderProfileModal: React.FC<RiderProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, resetProfile } = useRiderProfile();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleReset = () => {
    resetProfile();
    showToast('车手档案已重置为标准默认值', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-700 shadow-2xl bg-slate-950/95 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">车手通用个人档案</h2>
              <p className="text-[11px] text-slate-400">修改后将全站自动联动同步至 9 大计算工具</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Inputs Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">身高 (Height)</label>
            <NumberStepper
              value={profile.heightCm}
              onChange={(v) => updateProfile({ heightCm: v })}
              step={0.5}
              min={120}
              max={220}
              unit="cm"
              decimals={1}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">跨高 (Inseam)</label>
            <NumberStepper
              value={profile.inseamCm}
              onChange={(v) => updateProfile({ inseamCm: v })}
              step={0.5}
              min={50}
              max={110}
              unit="cm"
              decimals={1}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">车手净重 (Weight)</label>
            <NumberStepper
              value={profile.weightKg}
              onChange={(v) => updateProfile({ weightKg: v })}
              step={0.5}
              min={30}
              max={150}
              unit="kg"
              decimals={1}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">整车+装备重 (Bike)</label>
            <NumberStepper
              value={profile.bikeWeightKg}
              onChange={(v) => updateProfile({ bikeWeightKg: v })}
              step={0.1}
              min={5}
              max={25}
              unit="kg"
              decimals={1}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">功能阈值功率 (FTP)</label>
            <NumberStepper
              value={profile.ftpWatts}
              onChange={(v) => updateProfile({ ftpWatts: v })}
              step={5}
              min={50}
              max={600}
              unit="W"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">车手年龄 (Age)</label>
            <NumberStepper
              value={profile.age}
              onChange={(v) => updateProfile({ age: v })}
              step={1}
              min={10}
              max={99}
              unit="岁"
            />
          </div>
        </div>

        {/* Sync Info Banner */}
        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            档案数据已保存在当前浏览器本地存储中。当您在 Fitting、动力学推算、胎压或团骑工具中计算时，将自动以该档案为基准。
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置默认
          </button>
          <button
            onClick={() => {
              onClose();
              showToast('车手档案已更新并同步！', 'success');
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20"
          >
            <Check className="w-4 h-4" />
            保存并同步全站
          </button>
        </div>
      </div>
    </div>
  );
};
