import React from 'react';
import { Share2 } from 'lucide-react';
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
  const currentTint = TINT_MAP[tint] || TINT_MAP.blue;
  const defaultShareTooltip = language === 'zh-TW' ? '生成分享海報' : '生成分享海报';

  return (
    <IOSCard variant="glass" className={`relative overflow-hidden isolate p-4 sm:p-5 ${className}`}>
      {/* Dynamic Apple Glow Sphere */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 ${currentTint.glow}`}
      />

      {/* Mobile Top-Right Share Icon Button */}
      {onShare && (
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 sm:hidden z-20">
          <button
            type="button"
            onClick={onShare}
            className="apple-touch w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 hover:text-ios-blue dark:hover:text-ios-blue transition flex items-center justify-center shadow-2xs"
            title={shareTitle || defaultShareTooltip}
            aria-label={shareTitle || defaultShareTooltip}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className={`space-y-1 ${onShare ? 'pr-11 sm:pr-0' : ''}`}>
          {category && (
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold mb-1 ${currentTint.badge}`}
            >
              {CategoryIcon && <CategoryIcon className="w-3.5 h-3.5 shrink-0" />}
              <span>{category}</span>
            </div>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {(actions || onShare) && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-auto w-full sm:w-auto">
            {actions && (
              <div className="flex-1 sm:flex-initial min-w-0 w-full sm:w-auto flex flex-wrap items-center gap-2.5 sm:gap-3">
                {actions}
              </div>
            )}
            {/* Desktop Share Icon Button */}
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="hidden sm:flex apple-touch w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 hover:text-ios-blue dark:hover:text-ios-blue transition items-center justify-center shadow-2xs shrink-0"
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
        <div className="relative z-10 mt-4 pt-3.5 border-t border-black/[0.05] dark:border-white/[0.08]">
          {children}
        </div>
      )}
    </IOSCard>
  );
};
