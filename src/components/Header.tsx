import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Bike, User, X, Gauge, Settings } from 'lucide-react';
import { BackgroundMusicControl } from './BackgroundMusicControl';
import { RiderProfileModal } from './common/RiderProfileModal';
import { useRiderProfile } from '../context/RiderProfileContext';
import { useLanguageAndUnit } from '../context/LanguageAndUnitContext';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  themeMode?: 'system' | 'dark' | 'light';
  setThemeMode?: (mode: 'system' | 'dark' | 'light') => void;
  onNavigateHome: () => void;
  currentToolId: string | null;
  onSelectTool: (id: string) => void;
  profileModalOpen?: boolean;
  setProfileModalOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  isDark,
  setIsDark,
  themeMode,
  setThemeMode,
  onNavigateHome,
  profileModalOpen,
  setProfileModalOpen
}) => {
  const [internalProfileOpen, setInternalProfileOpen] = useState<boolean>(false);
  const isProfileOpen = profileModalOpen !== undefined ? profileModalOpen : internalProfileOpen;
  const setProfileOpen = setProfileModalOpen || setInternalProfileOpen;
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { profile } = useRiderProfile();
  const { language, unitSystem, toggleUnitSystem, t, convertWeight } = useLanguageAndUnit();

  // Keyboard shortcut listener: '/' to focus search, 'Escape' to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setMobileSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setProfileOpen(false);
        setMobileSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setProfileOpen]);

  const formattedWeight = convertWeight(profile.weightKg || 68);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-xl bg-white/85 dark:bg-slate-950/80 transition-colors shadow-xs dark:shadow-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[52px] sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Clean Brand Logo with Bike Icon */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0 group" onClick={onNavigateHome}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md sm:shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition shrink-0">
              <Bike className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5 font-mono">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100">{t('brandName')}</span>
                <span className="text-cyan-500 dark:text-cyan-400 font-bold text-sm sm:text-base">{t('brandSuffix')}</span>
                <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono">{t('brandPro')}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 tracking-wider hidden sm:block">
                {t('slogan')}
              </div>
            </div>
          </div>

          {/* Center Search Input (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded select-none">
                /
              </kbd>
            </div>
          </div>

          {/* Right Actions: Unit Switch + Search + Rider Settings (⚙) + BGM + Theme Switch */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Unit System Toggle (Metric / Imperial) - Desktop & Tablet */}
            <button
              onClick={toggleUnitSystem}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 text-slate-600 dark:text-slate-300 text-[11px] font-mono font-medium transition shrink-0"
              title={unitSystem === 'metric' ? 'Switch to Imperial units (miles, lbs)' : 'Switch to Metric units (km, kg)'}
            >
              <Gauge className="w-4 h-4 text-cyan-500" />
              <span>{unitSystem === 'metric' ? 'km/kg' : 'mi/lbs'}</span>
            </button>

            {/* Mobile Search Button - Uniform 32-36px button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95 transition shrink-0"
              title="Search Tools"
              aria-label="Search Tools"
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Rider Profile & Settings Button (Gear ⚙ Icon for both Mobile & Desktop) */}
            <button
              onClick={() => setProfileOpen(true)}
              className="w-8 h-8 sm:w-auto sm:h-9 sm:px-2.5 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 active:scale-95 transition gap-1.5 group shrink-0"
              title={language === 'zh-TW' ? '系統設定與車手檔案 (⚙)' : '系统设置与车手档案 (⚙)'}
              aria-label="Settings & Rider Profile"
            >
              <Settings className="w-4 h-4 text-cyan-500 group-hover:rotate-45 transition-transform duration-300" />
              <span className="hidden lg:inline text-xs font-semibold">{profile.heightCm}cm / {formattedWeight.formatted}</span>
            </button>

            {/* Streamlined Background Music Switch (Uniform 32-36px button) */}
            <BackgroundMusicControl />

            {/* Theme Toggle Button (Uniform 32-36px button) */}
            <button
              onClick={() => {
                if (setThemeMode) {
                  setThemeMode(isDark ? 'light' : 'dark');
                } else {
                  setIsDark(!isDark);
                }
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 transition shrink-0"
              title={
                themeMode === 'system'
                  ? (isDark
                      ? (language === 'zh-TW' ? '跟隨手機(深色) - 點擊切換為淺色' : '跟随手机(深色) - 点击切换为浅色')
                      : (language === 'zh-TW' ? '跟隨手機(淺色) - 點擊切換為深色' : '跟随手机(浅色) - 点击切换为深色'))
                  : (isDark
                      ? (language === 'zh-TW' ? '深色模式 - 點擊切換為淺色' : '深色模式 - 点击切换为浅色')
                      : (language === 'zh-TW' ? '淺色模式 - 點擊切換為深色' : '浅色模式 - 点击切换为深色'))
              }
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Expand Drawer */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-200 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchPrompt')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </header>

      {/* Header spacer to prevent content underlap when fixed at top */}
      <div className="h-[calc(52px+env(safe-area-inset-top,0px))] sm:h-[calc(64px+env(safe-area-inset-top,0px))] w-full shrink-0" aria-hidden="true" />

      {/* Global Rider Profile Modal */}
      <RiderProfileModal
        isOpen={isProfileOpen}
        onClose={() => setProfileOpen(false)}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />
    </>
  );
};
