import React, { useState, useEffect, useRef } from 'react';
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
  decimals
}) => {
  // Determine effective decimal precision: if decimals is not provided, infer from step
  const stepDecimals = step.toString().includes('.') ? step.toString().split('.')[1].length : 0;
  const effectiveDecimals = decimals !== undefined ? decimals : stepDecimals;

  const [localText, setLocalText] = useState<string>(() =>
    value !== undefined && value !== null && !isNaN(value) ? String(value) : ''
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalText(value !== undefined && value !== null && !isNaN(value) ? String(value) : '');
    }
  }, [value, isFocused]);

  const commitValue = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === '' || trimmed === '-' || isNaN(parseFloat(trimmed))) {
      // Revert to valid value or min
      const fallback = Math.max(min, Math.min(max, value ?? min));
      setLocalText(String(fallback));
      onChange(fallback);
      return;
    }

    let parsed = parseFloat(trimmed);
    parsed = Math.max(min, Math.min(max, parsed));
    if (effectiveDecimals > 0) {
      parsed = parseFloat(parsed.toFixed(effectiveDecimals));
    } else {
      parsed = Math.round(parsed);
    }

    setLocalText(String(parsed));
    onChange(parsed);
  };

  const handleDecrement = () => {
    const currentVal = isNaN(parseFloat(localText)) ? (value ?? min) : parseFloat(localText);
    let next = currentVal - step;
    next = Math.max(min, next);
    if (effectiveDecimals > 0) {
      next = parseFloat(next.toFixed(effectiveDecimals));
    } else {
      next = Math.round(next);
    }
    setLocalText(String(next));
    onChange(next);
  };

  const handleIncrement = () => {
    const currentVal = isNaN(parseFloat(localText)) ? (value ?? min) : parseFloat(localText);
    let next = currentVal + step;
    next = Math.min(max, next);
    if (effectiveDecimals > 0) {
      next = parseFloat(next.toFixed(effectiveDecimals));
    } else {
      next = Math.round(next);
    }
    setLocalText(String(next));
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty string (user deleting everything to type a new number)
    if (raw === '') {
      setLocalText('');
      return;
    }

    // Allow minus sign at start if min < 0
    if (raw === '-' && min < 0) {
      setLocalText('-');
      return;
    }

    // Regex check: allow optional minus, digits, optional single decimal point
    const isNegativeAllowed = min < 0;
    const isDecimalAllowed = effectiveDecimals > 0;
    const regex = isDecimalAllowed
      ? (isNegativeAllowed ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/)
      : (isNegativeAllowed ? /^-?\d*$/ : /^\d*$/);

    if (!regex.test(raw)) {
      return; // reject invalid characters
    }

    setLocalText(raw);

    // If it's a complete valid number, notify parent if within range
    // DO NOT clamp to min here, so user can type "1" -> "18" -> "180" when min=100
    if (!raw.endsWith('.') && raw !== '-') {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= min && parsed <= max) {
        onChange(parsed);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Select all on focus for effortless overwrite
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(localText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue(localText);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalText(String(value ?? min));
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
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
          ref={inputRef}
          type="text"
          inputMode={effectiveDecimals > 0 ? 'decimal' : 'numeric'}
          value={localText}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
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
