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
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-2 text-xs flex items-center justify-between shadow-md relative z-30 transition-all">
        <div className="flex items-center gap-2 max-w-2xl">
          <Smartphone className="w-4 h-4 shrink-0 text-cyan-200" />
          <span className="font-medium truncate">
            {language === 'en'
              ? 'Install SoloRider WebApp to your home screen for full-screen offline use!'
              : language === 'zh-TW'
              ? '將 SoloRider 安裝至主畫面，享全螢幕離線單車科學體驗！'
              : '将 SoloRider 安装至手机主屏幕，享原生全屏离线骑行体验！'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-slate-950 font-bold hover:bg-cyan-50 text-[11px] transition shadow-xs active:scale-95"
          >
            <Download className="w-3 h-3 text-cyan-600" />
            <span>
              {language === 'en'
                ? 'Install'
                : language === 'zh-TW'
                ? '立即安裝'
                : '立即安装'}
            </span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded-lg transition text-white/80 hover:text-white"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
