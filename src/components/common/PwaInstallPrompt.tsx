import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle, Share } from 'lucide-react';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';

export const PwaInstallPrompt: React.FC = () => {
  const { language } = useLanguageAndUnit();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  const { sheetStyle: iosGuideStyle, handlers: iosGuideSwipeHandlers } = useSwipeToDismiss({
    onClose: () => setShowIosGuide(false)
  });

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('rouleur_pwa_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Check if running as standalone WebApp
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capture beforeinstallprompt for Chrome / Android / Desktop Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  // Handle native install prompt
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('rouleur_pwa_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // Only show if we have an active install trigger or on iOS
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-2.5 no-print">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-ios-blue/10 dark:bg-ios-blue/15 border border-ios-blue/30 dark:border-ios-blue/20 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-ios-blue/20 text-ios-blue dark:text-ios-blue-dark flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium truncate text-slate-700 dark:text-slate-300">
              {language === 'zh-TW'
                ? '加入主畫面，享全螢幕離線計算'
                : '添加到主屏幕，享全屏离线体验'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="apple-touch flex items-center gap-1 h-7 px-2.5 rounded-xl bg-ios-blue hover:bg-ios-blue/90 text-white font-bold text-[11px] transition shadow-xs active:scale-95"
            >
              <Download className="w-3 h-3 text-white" />
              <span>
                {language === 'zh-TW' ? '安裝' : '安装'}
              </span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition apple-touch"
              title="Dismiss"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Add to Home Screen Instructions Modal */}
      {showIosGuide && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIosGuide(false);
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 dark:bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200"
        >
          <div
            style={iosGuideStyle}
            className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl p-4 sm:p-5 rounded-t-[28px] sm:rounded-2xl border border-black/[0.05] dark:border-white/[0.1] max-w-sm w-full space-y-4 text-slate-900 dark:text-white shadow-ios-popover relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-5"
          >
            {/* iOS Presentation Detent Drag Indicator with Native Swipe to Dismiss */}
            <div
              {...iosGuideSwipeHandlers}
              className="sm:hidden w-full py-2 -mt-2 mb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            >
              <div className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/25" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-ios-blue/15 text-ios-blue">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">
                  {language === 'zh-TW' ? '加入主畫面說明' : '添加到手机主屏幕'}
                </h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 apple-touch">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'zh-TW'
                ? 'iOS 系統請透過 Safari 瀏覽器加入主畫面：'
                : 'iOS 系统请通过 Safari 浏览器添加至主屏幕：'}
            </p>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08]">
                <span className="w-5 h-5 rounded-full bg-ios-blue text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span>
                  {language === 'zh-TW' ? '點擊 Safari 底部的 ' : '点击 Safari 底部的 '}
                  <Share className="w-3.5 h-3.5 inline mx-1 text-ios-blue" />
                  {language === 'zh-TW' ? '分享按鈕' : '分享按钮'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08]">
                <span className="w-5 h-5 rounded-full bg-ios-blue text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span>
                  {language === 'zh-TW'
                    ? '下滑選取「加入主畫面」標籤。'
                    : '下滑选择「添加到主屏幕」图标。'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08]">
                <span className="w-5 h-5 rounded-full bg-ios-blue text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span>
                  {language === 'zh-TW' ? '點擊右上角「加入」，即可從桌面啟動！' : '点击右上角「添加」，即可从桌面启动！'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="apple-touch w-full h-9 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-xl font-bold text-xs transition shadow-ios-sm flex items-center justify-center"
            >
              {language === 'zh-TW' ? '我知道了' : '我知道了'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
