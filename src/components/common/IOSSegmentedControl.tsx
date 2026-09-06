import React from 'react';
import { triggerHaptic } from '../../utils/haptics';

export type SegmentOption<T extends string = string> = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  dot?: boolean;
  dotColor?: string;
} & (
  | { value: T; id?: T }
  | { id: T; value?: T }
);

export type SegmentTint = 'blue' | 'purple' | 'mint' | 'red' | 'orange' | 'green';

interface IOSSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  tint?: SegmentTint;
  fullWidth?: boolean;
  hideIconOnMobile?: boolean;
  className?: string;
}

const TINT_STYLES: Record<SegmentTint, {
  activeLight: string;
  activeDark: string;
  iconActive: string;
  badgeActive: string;
}> = {
  blue: {
    activeLight: 'bg-white text-ios-blue ring-1.5 ring-ios-blue/35 shadow-[0_2px_8px_rgba(0,122,255,0.18),0_1px_2px_rgba(0,0,0,0.06)]',
    activeDark: 'dark:bg-ios-blue dark:text-white dark:ring-0 dark:shadow-[0_2px_10px_rgba(0,122,255,0.4)]',
    iconActive: 'text-ios-blue dark:text-white',
    badgeActive: 'bg-ios-blue/15 text-ios-blue dark:bg-white/25 dark:text-white',
  },
  purple: {
    activeLight: 'bg-white text-ios-purple ring-1.5 ring-ios-purple/35 shadow-[0_2px_8px_rgba(175,82,222,0.18),0_1px_2px_rgba(0,0,0,0.06)]',
    activeDark: 'dark:bg-ios-purple dark:text-white dark:ring-0 dark:shadow-[0_2px_10px_rgba(175,82,222,0.4)]',
    iconActive: 'text-ios-purple dark:text-white',
    badgeActive: 'bg-ios-purple/15 text-ios-purple dark:bg-white/25 dark:text-white',
  },
  mint: {
    activeLight: 'bg-white text-emerald-600 ring-1.5 ring-emerald-500/35 shadow-[0_2px_8px_rgba(16,185,129,0.18),0_1px_2px_rgba(0,0,0,0.06)]',
    activeDark: 'dark:bg-emerald-600 dark:text-white dark:ring-0 dark:shadow-[0_2px_10px_rgba(16,185,129,0.4)]',
    iconActive: 'text-emerald-600 dark:text-white',
    badgeActive: 'bg-emerald-500/15 text-emerald-600 dark:bg-white/25 dark:text-white',
  },
  red: {
    activeLight: 'bg-white text-ios-red ring-1.5 ring-ios-red/35 shadow-[0_2px_8px_rgba(255,59,48,0.18),0_1px_2px_rgba(0,0,0,0.06)]',
    activeDark: 'dark:bg-ios-red dark:text-white dark:ring-0 dark:shadow-[0_2px_10px_rgba(255,59,48,0.4)]',
    iconActive: 'text-ios-red dark:text-white',
    badgeActive: 'bg-ios-red/15 text-ios-red dark:bg-white/25 dark:text-white',
  },
  orange: {
    activeLight: 'bg-white text-ios-orange ring-1.5 ring-ios-orange/35 shadow-[0_2px_8px_rgba(255,149,0,0.18),0_1px_2px_rgba(0,0,0,0.06)]',
    activeDark: 'dark:bg-ios-orange dark:text-white dark:ring-0 dark:shadow-[0_2px_10px_rgba(255,149,0,0.4)]',
    iconActive: 'text-ios-orange dark:text-white',
    badgeActive: 'bg-ios-orange/15 text-ios-orange dark:bg-white/25 dark:text-white',
  },
  green: {
    activeLight: 'bg-white text-ios-green ring-1.5 ring-ios-green/35 shadow-[0_2px_8px_rgba(52,199,89,0.18),0_1px_2px_rgba(0,0,0,0.06)]',
    activeDark: 'dark:bg-ios-green dark:text-white dark:ring-0 dark:shadow-[0_2px_10px_rgba(52,199,89,0.4)]',
    iconActive: 'text-ios-green dark:text-white',
    badgeActive: 'bg-ios-green/15 text-ios-green dark:bg-white/25 dark:text-white',
  },
};

export function IOSSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  tint = 'blue',
  fullWidth = false,
  hideIconOnMobile = false,
  className = '',
}: IOSSegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-xs',
    lg: 'p-1.5 text-sm',
  }[size];

  const itemPadding = {
    sm: 'px-1.5 sm:px-2.5 py-1',
    md: 'px-2.5 sm:px-3.5 py-1.5',
    lg: 'px-3 sm:px-4 py-2',
  }[size];

  const currentTint = TINT_STYLES[tint] || TINT_STYLES.blue;

  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-xl bg-slate-200/80 dark:bg-white/[0.08] backdrop-blur-md p-0.5 transition-colors duration-200 border border-black/[0.06] dark:border-white/[0.08] select-none overflow-hidden ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses} ${className}`}
    >
      {options.map((opt) => {
        const optVal = (opt.value ?? opt.id) as T;
        const isSelected = optVal === value;
        const Icon = opt.icon;

        return (
          <button
            key={optVal}
            role="tab"
            aria-selected={isSelected}
            onClick={() => {
              triggerHaptic('selection');
              onChange(optVal);
            }}
            className={`relative flex items-center justify-center gap-1 sm:gap-1.5 rounded-[10px] transition-all duration-200 ease-out apple-touch ${itemPadding} ${
              fullWidth ? 'flex-1 min-w-0' : ''
            } ${
              isSelected
                ? `${currentTint.activeLight} ${currentTint.activeDark} font-bold z-10 scale-[1.01]`
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            {Icon && (
              <Icon
                className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                  hideIconOnMobile ? 'hidden sm:inline-block' : ''
                } ${
                  isSelected ? currentTint.iconActive : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            )}
            <span className="truncate">{opt.label}</span>
            {opt.dot && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  opt.dotColor || 'bg-emerald-500'
                }`}
              />
            )}
            {opt.badge !== undefined && (
              <span
                className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                  isSelected
                    ? currentTint.badgeActive
                    : 'bg-slate-300/60 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
