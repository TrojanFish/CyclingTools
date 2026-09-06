import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

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

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const timeoutRef = useRef<number | null>(null);

  const stopHold = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopHold();
  }, []);

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

  const doStep = (direction: 1 | -1): number => {
    const currentVal = isNaN(parseFloat(localText)) ? (valueRef.current ?? min) : parseFloat(localText);
    let next = currentVal + direction * step;
    next = Math.max(min, Math.min(max, next));
    if (effectiveDecimals > 0) {
      next = parseFloat(next.toFixed(effectiveDecimals));
    } else {
      next = Math.round(next);
    }
    setLocalText(String(next));
    onChangeRef.current(next);
    triggerHaptic('light');
    return next;
  };

  const startHold = (direction: 1 | -1) => {
    stopHold();
    const nextVal = doStep(direction);
    if ((direction > 0 && nextVal >= max) || (direction < 0 && nextVal <= min)) {
      return;
    }

    let holdCount = 0;
    // Initial delay 380ms
    timeoutRef.current = window.setTimeout(() => {
      const runInterval = () => {
        holdCount++;
        const steppedVal = doStep(direction);
        if ((direction > 0 && steppedVal >= max) || (direction < 0 && steppedVal <= min)) {
          stopHold();
          return;
        }
        // Accelerate interval: 140ms -> 80ms -> 45ms
        const delay = holdCount > 12 ? 45 : holdCount > 4 ? 80 : 140;
        timeoutRef.current = window.setTimeout(runInterval, delay);
      };
      runInterval();
    }, 380);
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
      doStep(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      doStep(-1);
    }
  };

  return (
    <div className={`flex items-center bg-slate-100/90 dark:bg-[#2C2C2E]/80 border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-200 focus-within:ring-2 focus-within:ring-ios-blue/40 ${className}`}>
      <button
        type="button"
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
          startHold(-1);
        }}
        onPointerUp={(e) => {
          try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
          stopHold();
        }}
        onPointerCancel={(e) => {
          try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
          stopHold();
        }}
        onContextMenu={(e) => e.preventDefault()}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-25 disabled:hover:bg-transparent transition-all apple-touch shrink-0 select-none touch-none active:scale-95"
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
        onPointerDown={(e) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
          startHold(1);
        }}
        onPointerUp={(e) => {
          try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
          stopHold();
        }}
        onPointerCancel={(e) => {
          try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
          stopHold();
        }}
        onContextMenu={(e) => e.preventDefault()}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] disabled:opacity-25 disabled:hover:bg-transparent transition-all apple-touch shrink-0 select-none touch-none active:scale-95"
        aria-label="Increase value"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
      </button>
    </div>
  );
};
