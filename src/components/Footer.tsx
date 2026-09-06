import React from 'react';
import { Bike, Shield, Lock } from 'lucide-react';
import { useLanguageAndUnit } from '../context/LanguageAndUnitContext';

interface FooterProps {
  onNavigateHome: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateHome }) => {
  const { t } = useLanguageAndUnit();

  return (
    <footer className="mt-12 border-t border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/70 backdrop-blur-xl no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Compliance & Legal Disclaimer Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-300">
              <Shield className="w-3.5 h-3.5 text-ios-blue" />
              <span>{t('footerDisclaimerTitle')}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t('footerDisclaimerText')}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('footerPrivacyTitle')}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t('footerPrivacyText')}
            </p>
          </div>
        </div>

        {/* Bottom Bar: Brand, Shortcuts & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          {/* Brand & Slogan */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={onNavigateHome}
          >
            <div className="w-8 h-8 rounded-xl bg-ios-blue text-white flex items-center justify-center font-bold shadow-ios-sm group-hover:scale-105 transition">
              <Bike className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <div className="flex items-center gap-1 font-mono">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">{t('brandName')}</span>
                <span className="text-ios-blue dark:text-ios-blue font-bold text-sm">{t('brandSuffix')}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-ios-blue/10 border border-ios-blue/20 text-ios-blue font-mono font-semibold">{t('brandPro')}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">· {t('slogan')}</span>
            </div>
          </div>

          {/* Quick Keyboard Shortcuts Capsule */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-[11px]">
              <span>{t('footerSearch')}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-ios-blue bg-white dark:bg-slate-800/90 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">/</kbd>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-[11px]">
              <span>{t('footerClose')}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-ios-blue bg-white dark:bg-slate-800/90 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">ESC</kbd>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-[11px]">
              <span>{t('footerPrint')}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-ios-blue bg-white dark:bg-slate-800/90 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">Ctrl+P</kbd>
            </div>
          </div>

          {/* Clean Copyright & Status Indicator */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            <span>© {new Date().getFullYear()} SoloRiderTools. Global Cycling Science.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
