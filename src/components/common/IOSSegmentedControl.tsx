import React from 'react';

export type SegmentOption<T extends string = string> = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
} & (
  | { value: T; id?: T }
  | { id: T; value?: T }
);

interface IOSSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function IOSSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: IOSSegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-xs',
    lg: 'p-1.5 text-sm',
  }[size];

  const itemPadding = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-4 py-2',
  }[size];

  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-xl bg-slate-200/70 dark:bg-white/[0.08] backdrop-blur-md p-0.5 transition-colors duration-200 border border-black/[0.04] dark:border-white/[0.06] select-none ${
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
            onClick={() => onChange(optVal)}
            className={`relative flex items-center justify-center gap-1.5 rounded-[10px] font-medium transition-all duration-200 ease-out apple-touch ${itemPadding} ${
              fullWidth ? 'flex-1' : ''
            } ${
              isSelected
                ? 'bg-white dark:bg-[#636366] text-slate-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)] font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {Icon && (
              <Icon
                className={`w-3.5 h-3.5 transition-colors ${
                  isSelected ? 'text-ios-blue dark:text-ios-blue-dark' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            )}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected
                    ? 'bg-ios-blue/15 text-ios-blue dark:text-ios-blue-dark'
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
