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
    <div className={`flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-700 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="px-2.5 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95 flex items-center justify-center shrink-0"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 flex items-center justify-center px-1">
        <input
          type="number"
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full text-center bg-transparent text-slate-100 font-mono text-sm font-semibold focus:outline-none py-1.5"
        />
        {unit && <span className="text-[11px] text-slate-500 font-sans mr-1 select-none">{unit}</span>}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="px-2.5 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95 flex items-center justify-center shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
