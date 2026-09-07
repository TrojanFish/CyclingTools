import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Bike, User, X, Settings, PanelLeft } from 'lucide-react';
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
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
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
  setProfileModalOpen,
  isSidebarOpen = true,
  onToggleSidebar
}) => {
  const [internalProfileOpen, setInternalProfileOpen] = useState<boolean>(false);
  const isProfileOpen = profileModalOpen !== undefined ? profileModalOpen : internalProfileOpen;
  const setProfileOpen = setProfileModalOpen || setInternalProfileOpen;
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { profile } = useRiderProfile();
  const { language, t, convertWeight } = useLanguageAndUnit();

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
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-black/[0.05] dark:border-white/[0.08] backdrop-blur-2xl saturate-180 bg-white/75 dark:bg-[#1C1C1E]/80 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6 h-[52px] sm:h-14 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Sidebar Toggle + Clean Brand Logo with Bike Icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-ios-blue hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-all apple-touch shrink-0"
                title={isSidebarOpen ? '收起侧边栏 (Toggle Sidebar)' : '展开侧边栏 (Toggle Sidebar)'}
                aria-label="Toggle Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0 group apple-touch" onClick={onNavigateHome}>
              <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-ios-blue to-blue-600 flex items-center justify-center text-white shadow-sm shadow-ios-blue/30 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <Bike className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1 sm:gap-1.5 font-sans">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">{t('brandName')}</span>
                  <span className="text-ios-blue dark:text-ios-blue-dark font-semibold text-sm sm:text-base">{t('brandSuffix')}</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-ios-blue/10 dark:bg-ios-blue/20 text-ios-blue dark:text-ios-blue-dark font-mono font-bold tracking-tight">{t('brandPro')}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 tracking-normal hidden xl:block">
                  {t('slogan')}
                </div>
              </div>
            </div>
          </div>

          {/* Center Search Input (Desktop) - iOS Spotlight style */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-9 bg-slate-200/50 dark:bg-[#2C2C2E]/80 border border-black/[0.04] dark:border-white/[0.08] rounded-xl pl-9 pr-12 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ios-blue/40 focus:bg-white dark:focus:bg-[#2C2C2E] transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-[#3A3A3C] border border-black/[0.06] dark:border-white/[0.08] rounded-md shadow-xs select-none">
                /
              </kbd>
            </div>
          </div>

          {/* Right Actions: Search + Rider Settings + BGM + Theme Switch */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button - Uniform Apple HIG 36px button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100/90 dark:bg-[#2C2C2E]/80 border border-black/[0.05] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white apple-touch transition shrink-0"
              title="Search Tools"
              aria-label="Search Tools"
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Rider Profile & Settings Button - Apple HIG 36px button */}
            <button
              onClick={() => setProfileOpen(true)}
              className="w-9 h-9 sm:w-auto sm:h-9 sm:px-3 flex items-center justify-center rounded-xl bg-slate-100/90 dark:bg-[#2C2C2E]/80 border border-black/[0.05] dark:border-white/[0.08] hover:bg-slate-200/80 dark:hover:bg-[#3A3A3C] text-slate-700 dark:text-slate-200 hover:text-ios-blue dark:hover:text-ios-blue-dark apple-touch transition gap-1.5 group shrink-0 shadow-xs"
              title={language === 'zh-TW' ? '系統設定與車手檔案' : '系统设置与车手档案'}
              aria-label="Settings & Rider Profile"
            >
              <Settings className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark group-hover:rotate-45 transition-transform duration-300" />
              <span className="hidden lg:inline text-xs font-semibold tabular-nums">{profile.heightCm}cm / {formattedWeight.formatted}</span>
            </button>

            {/* Streamlined Background Music Switch */}
            <BackgroundMusicControl />

            {/* Theme Toggle Button - Apple HIG 36px button */}
            <button
              onClick={() => {
                if (setThemeMode) {
                  setThemeMode(isDark ? 'light' : 'dark');
                } else {
                  setIsDark(!isDark);
                }
              }}
              className="apple-touch w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 active:scale-95 transition shrink-0"
              title={
                themeMode === 'system'
                  ? (isDark
                      ? (language === 'zh-TW' ? '跟隨手機(深色) - 點擊切換為淺色' : '跟随手机(深色) - 点击切换为浅色')
                      : (language === 'zh-TW' ? '跟隨手機(淺色) - 點擊切換為深色' : '跟随手机(浅色) - 点击切换为深色'))
                  : (isDark
                      ? (language === 'zh-TW' ? '深色模式 - 點擊切換為淺色' : '深色模式 - 点击切换为浅色')
                      : (language === 'zh-TW' ? '淺色模式 - 點擊切换为深色' : '浅色模式 - 点击切换为深色'))
              }
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Expand Drawer */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-200/80 dark:border-white/10 animate-in fade-in slide-in-from-top-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchPrompt')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-slate-100 dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-ios-blue"
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
