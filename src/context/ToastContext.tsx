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

      {/* Floating Toasts Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className="pointer-events-auto glass-panel p-3.5 rounded-2xl border shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
              style={{
                borderColor: isSuccess ? 'rgba(16, 185, 129, 0.4)' : isError ? 'rgba(244, 63, 94, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(0, 175, 255, 0.4)',
                backgroundColor: 'rgba(15, 23, 42, 0.95)'
              }}
            >
              <div className="flex items-center gap-2.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isError && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}

                <div>
                  <div className="text-xs font-bold text-slate-100">{toast.title}</div>
                  {toast.message && <div className="text-[10px] text-slate-400 mt-0.5">{toast.message}</div>}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
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
