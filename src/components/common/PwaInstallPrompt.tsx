import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle, Share } from 'lucide-react';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

export const PwaInstallPrompt: React.FC = () => {
  const { language } = useLanguageAndUnit();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('solorider_pwa_dismissed') === 'true';
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
      sessionStorage.setItem('solorider_pwa_dismissed', 'true');
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
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/30 border border-cyan-500/30 dark:border-cyan-500/20 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium truncate text-slate-700 dark:text-slate-300">
              {language === 'en'
                ? 'Add to Home Screen for full-screen offline use'
                : language === 'zh-TW'
                ? '加入主畫面，享全螢幕離線計算'
                : '添加到主屏幕，享全屏离线体验'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition shadow-xs active:scale-95"
            >
              <Download className="w-3 h-3 text-slate-950" />
              <span>
                {language === 'en'
                  ? 'Install'
                  : language === 'zh-TW'
                  ? '安裝'
                  : '安装'}
              </span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-4 text-slate-900 dark:text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-500">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">
                  {language === 'en' ? 'Add to Home Screen' : language === 'zh-TW' ? '加入主畫面說明' : '添加到手机主屏幕'}
                </h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'en'
                ? 'iOS Safari does not support one-click install, but you can easily add it manually:'
                : language === 'zh-TW'
                ? 'iOS 系統請透過 Safari 瀏覽器加入主畫面：'
                : 'iOS 系统请通过 Safari 浏览器添加至主屏幕：'}
            </p>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span>
                  {language === 'en' ? 'Tap the ' : '点击 Safari 底部的 '}
                  <Share className="w-3.5 h-3.5 inline mx-1 text-cyan-500" />
                  {language === 'en' ? 'Share button at the bottom.' : '分享按钮'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span>
                  {language === 'en'
                    ? 'Scroll down and select "Add to Home Screen".'
                    : language === 'zh-TW'
                    ? '下滑選取「加入主畫面」標籤。'
                    : '下滑选择「添加到主屏幕」图标。'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span>
                  {language === 'en' ? 'Tap "Add" in the top-right corner.' : '点击右上角「添加」，即可从桌面启动！'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-xs transition shadow-md shadow-cyan-500/20"
            >
              {language === 'en' ? 'Got It' : '我知道了'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
