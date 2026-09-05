import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface NumberStepperProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  className?: string;
  decimals?: number;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  unit = '',
  className = '',
  decimals = 0
}) => {
  const handleDecrement = () => {
    const next = Math.max(min, parseFloat((value - step).toFixed(decimals || 1)));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, parseFloat((value + step).toFixed(decimals || 1)));
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <div className={`flex items-center bg-slate-100/90 dark:bg-[#2C2C2E]/80 border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-200 focus-within:ring-2 focus-within:ring-ios-blue/40 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-25 disabled:hover:bg-transparent transition-all apple-touch shrink-0"
        aria-label="Decrease value"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
      </button>

      <div className="flex-1 flex items-center justify-center px-1 border-x border-black/[0.04] dark:border-white/[0.06] min-w-0">
        <input
          type="number"
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full text-center bg-transparent text-slate-900 dark:text-white font-mono text-sm font-semibold tabular-nums focus:outline-none py-1.5 min-w-0"
        />
        {unit && <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans mr-1 select-none shrink-0">{unit}</span>}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-25 disabled:hover:bg-transparent transition-all apple-touch shrink-0"
        aria-label="Increase value"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
      </button>
    </div>
  );
};
