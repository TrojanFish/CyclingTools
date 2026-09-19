import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

/**
 * Apple HIG Compliant Offline Perception Pill.
 * Floats unobtrusively above bottom navigation or in the bottom-right corner of macOS desktop.
 * Provides transparent feedback on PWA offline readiness and automatically notifies when connectivity returns.
 */
export const OfflineStatusPill: React.FC = () => {
  const { language } = useLanguageAndUnit();
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });

  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (dismissed || (!isOffline && !showReconnected)) {
    return null;
  }

  const isTw = language === 'zh-TW';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-40 bottom-20 left-1/2 -translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2"
    >
      <div
        className={`h-9 px-3.5 rounded-full flex items-center gap-2 shadow-ios-popover backdrop-blur-md border text-xs sm:text-sm font-medium select-none apple-touch cursor-pointer ${
          showReconnected
            ? 'bg-ios-green/10 border-ios-green/30 text-ios-green dark:bg-ios-green/20 dark:border-ios-green/40'
            : 'bg-white/90 border-slate-200/80 text-slate-700 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-200'
        }`}
        onClick={() => setDismissed(true)}
        title={isTw ? '點擊關閉提示' : '点击关闭提示'}
      >
        {showReconnected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-ios-green shrink-0" />
            <Wifi className="w-3.5 h-3.5 text-ios-green shrink-0" />
            <span className="tabular-nums">
              {isTw ? '網路連線已恢復' : '网络连接已恢复'}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-ios-orange animate-pulse shrink-0" />
            <WifiOff className="w-3.5 h-3.5 text-ios-orange shrink-0" />
            <span className="tabular-nums hidden sm:inline">
              {isTw ? '離線模式 · 本地離線計算就緒' : '离线模式 · 本地离线计算就绪'}
            </span>
            <span className="tabular-nums sm:hidden">
              {isTw ? '離線模式 · 本地就緒' : '离线模式 · 本地就绪'}
            </span>
          </>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          className="ml-1 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label={isTw ? '關閉提示' : '关闭提示'}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
