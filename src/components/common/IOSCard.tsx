import React from 'react';

interface IOSCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'inset' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const IOSCard: React.FC<IOSCardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
}) => {
  const variantClasses = {
    default:
      'bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
    inset:
      'bg-slate-50 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]',
    glass:
      'bg-white/75 dark:bg-[#1C1C1E]/75 backdrop-blur-2xl saturate-180 border border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)]',
    elevated:
      'bg-white dark:bg-[#2C2C2E] border border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)]',
  }[variant];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[padding];

  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${variantClasses} ${paddingClasses} ${className}`}
    >
      {children}
    </div>
  );
};

interface IOSCardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  action?: React.ReactNode;
  className?: string;
}

export const IOSCardHeader: React.FC<IOSCardHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-ios-blue bg-ios-blue/10 dark:bg-ios-blue/20',
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-3 pb-3 border-b border-black/[0.04] dark:border-white/[0.06] ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

export type IOSAccent = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'mint' | 'cyan' | 'amber' | string;

export interface IOSMetricTileProps {
  label: string;
  value: React.ReactNode | { value?: number | string; unit?: string; formatted?: string };
  unit?: string;
  subtext?: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  accentColor?: IOSAccent;
  accent?: IOSAccent;
  theme?: IOSAccent;
  className?: string;
}

export const IOSMetricTile: React.FC<IOSMetricTileProps> = ({
  label,
  value,
  unit,
  subtext,
  subValue,
  icon,
  accentColor,
  accent,
  theme,
  className = '',
}) => {
  const chosenAccent = (accentColor || accent || theme || 'blue') as string;
  const mappedAccent = chosenAccent === 'cyan' ? 'blue' : chosenAccent === 'amber' ? 'orange' : chosenAccent;

  const accentStyles = {
    blue: {
      icon: 'text-ios-blue bg-ios-blue/10 dark:bg-ios-blue/20',
      glow: 'group-hover:border-ios-blue/40',
      highlight: 'text-ios-blue dark:text-ios-blue-dark',
    },
    green: {
      icon: 'text-ios-green bg-ios-green/10 dark:bg-ios-green/20',
      glow: 'group-hover:border-ios-green/40',
      highlight: 'text-ios-green dark:text-ios-green-dark',
    },
    orange: {
      icon: 'text-ios-orange bg-ios-orange/10 dark:bg-ios-orange/20',
      glow: 'group-hover:border-ios-orange/40',
      highlight: 'text-ios-orange dark:text-ios-orange-dark',
    },
    red: {
      icon: 'text-ios-red bg-ios-red/10 dark:bg-ios-red/20',
      glow: 'group-hover:border-ios-red/40',
      highlight: 'text-ios-red dark:text-ios-red-dark',
    },
    purple: {
      icon: 'text-ios-purple bg-ios-purple/10 dark:bg-ios-purple/20',
      glow: 'group-hover:border-ios-purple/40',
      highlight: 'text-ios-purple dark:text-ios-purple-dark',
    },
    mint: {
      icon: 'text-ios-mint bg-ios-mint/10 dark:bg-ios-mint/20',
      glow: 'group-hover:border-ios-mint/40',
      highlight: 'text-ios-mint dark:text-ios-mint-dark',
    },
  }[mappedAccent as 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'mint'] || {
    icon: 'text-ios-blue bg-ios-blue/10 dark:bg-ios-blue/20',
    glow: 'group-hover:border-ios-blue/40',
    highlight: 'text-ios-blue dark:text-ios-blue-dark',
  };

  const displaySubtext = subtext ?? subValue;

  let displayValue: React.ReactNode = value as any;
  let displayUnit = unit;
  if (value && typeof value === 'object' && !React.isValidElement(value)) {
    if ('formatted' in (value as any)) {
      displayValue = (value as any).formatted;
    } else if ('value' in (value as any)) {
      displayValue = (value as any).value;
      if ('unit' in (value as any) && !unit) {
        displayUnit = (value as any).unit;
      }
    }
  }

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="w-3.5 h-3.5" />;
  };

  return (
    <div
      className={`group relative p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-all duration-200 ${accentStyles.glow} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accentStyles.icon}`}>
            {renderIcon()}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 font-mono">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {displayValue}
        </span>
        {displayUnit && (
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            {displayUnit}
          </span>
        )}
      </div>
      {displaySubtext && (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
          {displaySubtext}
        </div>
      )}
    </div>
  );
};
