import React, { useState } from 'react';
import { Share2, Info } from 'lucide-react';
import { IOSCard } from './IOSCard';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

export type ToolHeaderTint = 'blue' | 'purple' | 'mint' | 'red' | 'orange' | 'green' | 'indigo';

interface IOSToolHeaderProps {
  title: React.ReactNode;
  description: React.ReactNode;
  category?: string;
  categoryIcon?: React.ComponentType<{ className?: string }>;
  tint?: ToolHeaderTint;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onShare?: () => void;
  shareTitle?: string;
}

const TINT_MAP: Record<ToolHeaderTint, {
  glow: string;
  badge: string;
}> = {
  blue: {
    glow: 'bg-ios-blue/15',
    badge: 'bg-ios-blue/10 border-ios-blue/20 text-ios-blue',
  },
  purple: {
    glow: 'bg-ios-purple/15',
    badge: 'bg-ios-purple/10 border-ios-purple/20 text-ios-purple',
  },
  mint: {
    glow: 'bg-ios-mint/15',
    badge: 'bg-ios-mint/10 border-ios-mint/20 text-ios-mint',
  },
  red: {
    glow: 'bg-ios-red/15',
    badge: 'bg-ios-red/10 border-ios-red/20 text-ios-red',
  },
  orange: {
    glow: 'bg-ios-orange/15',
    badge: 'bg-ios-orange/10 border-ios-orange/20 text-ios-orange',
  },
  green: {
    glow: 'bg-ios-green/15',
    badge: 'bg-ios-green/10 border-ios-green/20 text-ios-green',
  },
  indigo: {
    glow: 'bg-ios-indigo/15',
    badge: 'bg-ios-indigo/10 border-ios-indigo/20 text-ios-indigo',
  },
};

export const IOSToolHeader: React.FC<IOSToolHeaderProps> = ({
  title,
  description,
  category,
  categoryIcon: CategoryIcon,
  tint = 'blue',
  actions,
  children,
  className = '',
  onShare,
  shareTitle,
}) => {
  const { language } = useLanguageAndUnit();
  const [showMobileDesc, setShowMobileDesc] = useState<boolean>(false);
  const currentTint = TINT_MAP[tint] || TINT_MAP.blue;
  const defaultShareTooltip = language === 'zh-TW' ? '生成分享海報' : '生成分享海报';
  const infoTooltip = language === 'zh-TW' ? '工具說明' : '工具说明';

  const hasActions = Boolean(actions);

  return (
    <IOSCard variant="glass" className={`relative overflow-hidden isolate p-3 sm:px-5 sm:py-3.5 ${className}`}>
      {/* Dynamic Apple Glow Sphere */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 w-72 h-72 rounded-full blur-3xl opacity-50 ${currentTint.glow}`}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Left Section: Category Badge + Title + Description */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Identity Row: Inline Category Pill + Title + Mobile Utility Buttons (Share & Info) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              {category && (
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-semibold shrink-0 select-none ${currentTint.badge}`}
                >
                  {CategoryIcon && <CategoryIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
                  <span>{category}</span>
                </div>
              )}
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight truncate">
                {title}
              </h1>
            </div>

            {/* Mobile Utility Actions (Right aligned in identity row: Info toggle + Share) */}
            <div className="flex items-center gap-1.5 sm:hidden shrink-0">
              {description && hasActions && (
                <button
                  type="button"
                  onClick={() => setShowMobileDesc((prev) => !prev)}
                  className={`apple-touch w-8 h-8 rounded-xl border transition flex items-center justify-center shadow-2xs ${
                    showMobileDesc
                      ? 'bg-ios-blue/15 border-ios-blue/30 text-ios-blue'
                      : 'bg-black/5 dark:bg-white/10 border-black/[0.04] dark:border-white/[0.06] text-slate-600 dark:text-slate-400'
                  }`}
                  title={infoTooltip}
                  aria-label={infoTooltip}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  className="apple-touch w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/[0.04] dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-ios-blue dark:hover:text-ios-blue transition flex items-center justify-center shadow-2xs"
                  title={shareTitle || defaultShareTooltip}
                  aria-label={shareTitle || defaultShareTooltip}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Description (Always visible on desktop) */}
          {description && (
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}

          {/* Mobile Description: If tool has NO actions, display compact text automatically; otherwise display if user toggled info */}
          {description && !hasActions && (
            <p className="sm:hidden text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">
              {description}
            </p>
          )}

          {description && hasActions && showMobileDesc && (
            <div className="sm:hidden text-[11px] text-slate-600 dark:text-slate-300 bg-black/[0.03] dark:bg-white/[0.05] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] mt-1.5 leading-relaxed animate-in fade-in-50">
              {description}
            </div>
          )}
        </div>

        {/* Right Section / Bottom Mobile Actions: Functional Actions & Desktop Share */}
        {(actions || onShare) && (
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto mt-0.5 sm:mt-0">
            {actions && (
              <div className="flex-1 sm:flex-initial min-w-0 w-full sm:w-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {actions}
              </div>
            )}
            {/* Desktop Share Icon Button */}
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="hidden sm:flex apple-touch w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/[0.04] dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-ios-blue dark:hover:text-ios-blue transition items-center justify-center shadow-2xs shrink-0"
                title={shareTitle || defaultShareTooltip}
                aria-label={shareTitle || defaultShareTooltip}
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {children && (
        <div className="relative z-10 mt-3 pt-2.5 border-t border-black/[0.05] dark:border-white/[0.08]">
          {children}
        </div>
      )}
    </IOSCard>
  );
};
