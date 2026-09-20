import React, { useState } from 'react';
import { Bike, Check } from 'lucide-react';

export interface IOSGarageSyncFooterProps {
  bikeName: string;
  badgeText?: string;
  detailText: React.ReactNode;
  buttonText: string;
  onSave: () => void;
  className?: string;
}

export const IOSGarageSyncFooter: React.FC<IOSGarageSyncFooterProps> = ({
  bikeName,
  badgeText = '已联动',
  detailText,
  buttonText,
  onSave,
  className = '',
}) => {
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
    }, 2000);
  };

  const shortName = bikeName.split('/')[0].trim();

  return (
    <div
      className={`-mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:p-4 mt-2 rounded-b-2xl border-t border-black/[0.05] dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-ios-blue/10 dark:bg-ios-blue/20 text-ios-blue flex items-center justify-center shrink-0">
          <Bike className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span>当前装配战车</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ios-blue/10 text-ios-blue font-medium shrink-0">
              {badgeText}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            <strong className="text-slate-700 dark:text-slate-300 font-medium">{shortName}</strong>
            <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
            <span className="tabular-nums">{detailText}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={justSaved}
        className={`h-9 px-3.5 sm:px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98] apple-touch shrink-0 w-full sm:w-auto ${
          justSaved
            ? 'bg-ios-green/15 text-ios-green dark:bg-ios-green/20'
            : 'bg-ios-blue hover:bg-blue-600 text-white shadow-ios-sm'
        }`}
      >
        <Check className={`w-3.5 h-3.5 ${justSaved ? 'stroke-[2.5]' : ''}`} />
        <span>{justSaved ? '已同步至战车' : buttonText}</span>
      </button>
    </div>
  );
};
