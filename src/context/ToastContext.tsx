import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (title: string, type?: 'success' | 'error' | 'info' | 'warning', message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', message?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    const newToast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toasts Container (Theme-aware and positioned above mobile bottom nav) */}
      <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 pointer-events-none w-full max-w-sm px-4">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3 sm:p-3.5 rounded-2xl border shadow-xl backdrop-blur-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 transition-all ${
                isSuccess
                  ? 'bg-white/95 dark:bg-slate-950/95 border-emerald-500/35 dark:border-emerald-500/40 shadow-emerald-500/5'
                  : isError
                  ? 'bg-white/95 dark:bg-slate-950/95 border-rose-500/35 dark:border-rose-500/40 shadow-rose-500/5'
                  : isWarning
                  ? 'bg-white/95 dark:bg-slate-950/95 border-amber-500/35 dark:border-amber-500/40 shadow-amber-500/5'
                  : 'bg-white/95 dark:bg-slate-950/95 border-ios-blue/35 dark:border-ios-blue/40 shadow-ios-blue/5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : isError
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : isWarning
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-ios-blue/15 text-ios-blue dark:text-ios-blue-dark'
                  }`}
                >
                  {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                  {isError && <AlertTriangle className="w-4 h-4" />}
                  {isWarning && <AlertTriangle className="w-4 h-4" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {toast.title}
                  </div>
                  {toast.message && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                      {toast.message}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                title="关闭提示"
                aria-label="Close toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
