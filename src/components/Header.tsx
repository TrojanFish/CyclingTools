import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, User, X, Settings, PanelLeft, Heart } from 'lucide-react';
import { RouleurLogo } from './common/RouleurLogo';
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
  const [sponsorOpen, setSponsorOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const sponsorRef = useRef<HTMLDivElement | null>(null);
  const sponsorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { profile } = useRiderProfile();
  const { language, t, convertWeight } = useLanguageAndUnit();

  const handleSponsorMouseEnter = () => {
    if (sponsorTimerRef.current) {
      clearTimeout(sponsorTimerRef.current);
      sponsorTimerRef.current = null;
    }
    setSponsorOpen(true);
  };

  const handleSponsorMouseLeave = () => {
    sponsorTimerRef.current = setTimeout(() => {
      setSponsorOpen(false);
    }, 250);
  };

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
        setSponsorOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (sponsorRef.current && !sponsorRef.current.contains(e.target as Node)) {
        setSponsorOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (sponsorTimerRef.current) clearTimeout(sponsorTimerRef.current);
    };
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
                title={isSidebarOpen ? (language === 'zh-TW' ? '收起側邊欄' : '收起侧边栏') : (language === 'zh-TW' ? '展開側邊欄' : '展开侧边栏')}
                aria-label="Toggle Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0 group apple-touch" onClick={onNavigateHome}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ios-blue to-blue-600 flex items-center justify-center text-white shadow-sm shadow-ios-blue/30 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <RouleurLogo className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1 sm:gap-1.5 font-sans">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">{t('brandName')}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-ios-blue/10 dark:bg-ios-blue/20 text-ios-blue dark:text-ios-blue-dark font-mono font-bold tracking-tight">{t('brandPro')}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tracking-normal hidden xl:block">
                  {t('slogan')}
                </div>
              </div>
            </div>
          </div>

          {/* Center Search Input (Desktop) - iOS Spotlight style */}
          <div className="hidden sm:flex items-center flex-1 max-w-md mx-4 lg:mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-9 bg-slate-200/50 dark:bg-[#2C2C2E]/80 border border-black/[0.04] dark:border-white/[0.08] rounded-xl pl-9 pr-12 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ios-blue/40 focus:bg-white dark:focus:bg-[#2C2C2E] transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-[#3A3A3C] border border-black/[0.06] dark:border-white/[0.08] rounded-md shadow-xs select-none">
                /
              </kbd>
            </div>
          </div>

          {/* Right Actions: Search + Rider Settings + BGM + Theme Switch */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button - Uniform Apple HIG 36px button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100/90 dark:bg-[#2C2C2E]/80 border border-black/[0.05] dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white apple-touch transition shrink-0"
              title="Search Tools"
              aria-label="Search Tools"
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Sponsor / Appreciation Button & Centered Modal */}
            <div className="relative" ref={sponsorRef}>
              <button
                onClick={() => setSponsorOpen((prev) => !prev)}
                onMouseEnter={handleSponsorMouseEnter}
                onMouseLeave={handleSponsorMouseLeave}
                className="apple-touch h-9 px-2.5 sm:px-3 flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold gap-1.5 transition active:scale-95 shrink-0"
                title={language === 'zh-TW' ? '贊助支持作者' : '赞助支持作者'}
                aria-label="Sponsor"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                <span className="hidden sm:inline">{language === 'zh-TW' ? '贊助' : '赞助'}</span>
              </button>

              {sponsorOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setSponsorOpen(false);
                  }}
                >
                  <div
                    onMouseEnter={handleSponsorMouseEnter}
                    onMouseLeave={handleSponsorMouseLeave}
                    className="relative w-full max-w-sm p-5 sm:p-6 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-ios-popover z-50 animate-in zoom-in-95 duration-200 text-left"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06] dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {language === 'zh-TW' ? '贊助支持作者' : '赞助支持作者'}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'zh-TW' ? '感謝您對單車工坊的認可與喜愛' : '感谢您对单车工坊的认可与喜爱'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSponsorOpen(false)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                        aria-label="Close Sponsor Modal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-black/5 shadow-xs flex flex-col items-center">
                      <img
                        src="/sponsor-qrcode.jpg"
                        alt="微信赞赏码"
                        className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                      />
                      <p className="mt-2.5 text-xs font-semibold text-slate-700 text-center leading-tight">
                        微信扫一扫 · 给 Keiyee 赞赏
                      </p>
                    </div>

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                      {language === 'zh-TW'
                        ? '如果單車工坊對您的騎行有所幫助，歡迎請作者喝杯咖啡 ☕ 您的支持是持續打磨的最大動力！'
                        : '如果单车工坊对您的骑行有所帮助，欢迎请作者喝杯咖啡 ☕ 您的支持是持续打磨的最大动力！'}
                    </p>
                  </div>
                </div>
              )}
            </div>

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
          <div className="sm:hidden px-4 pb-3 pt-1 border-t border-slate-200/80 dark:border-white/10 animate-in fade-in slide-in-from-top-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchPrompt')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full h-9 bg-slate-100 dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 rounded-xl pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-ios-blue"
              />
            </div>
          </div>
        )}
      </header>

      {/* Header spacer to prevent content underlap when fixed at top */}
      <div className="h-[calc(52px+env(safe-area-inset-top,0px))] sm:h-[calc(56px+env(safe-area-inset-top,0px))] w-full shrink-0" aria-hidden="true" />

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
