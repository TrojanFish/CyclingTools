import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, Bike, User, X, Globe, Gauge } from 'lucide-react';
import { BackgroundMusicControl } from './BackgroundMusicControl';
import { RiderProfileModal } from './common/RiderProfileModal';
import { useRiderProfile } from '../context/RiderProfileContext';
import { useLanguageAndUnit } from '../context/LanguageAndUnitContext';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
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
  const { language, setLanguage, toggleLanguage, unitSystem, toggleUnitSystem, t, convertWeight } = useLanguageAndUnit();

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
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-xl bg-white/85 dark:bg-slate-950/80 transition-colors shadow-xs dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
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

          {/* Right Actions: Language Switch + Unit Switch + Rider Profile + BGM + Theme Switch */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Compact Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="sm:hidden px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 text-xs font-bold font-mono active:scale-95 transition"
              title="Toggle Language (简 / 繁 / EN)"
            >
              {language === 'zh' ? '简' : language === 'zh-TW' ? '繁' : 'EN'}
            </button>

            {/* Desktop 3-Language Segmented Switch (简 / 繁 / EN) */}
            <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setLanguage('zh')}
                className={`px-2 py-1 rounded-lg transition ${
                  language === 'zh'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="简体中文"
              >
                简
              </button>
              <button
                onClick={() => setLanguage('zh-TW')}
                className={`px-2 py-1 rounded-lg transition ${
                  language === 'zh-TW'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="繁體中文"
              >
                繁
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition ${
                  language === 'en'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Unit System Toggle (Metric / Imperial) - Desktop & Tablet */}
            <button
              onClick={toggleUnitSystem}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 text-slate-600 dark:text-slate-300 text-[11px] font-mono font-medium transition"
              title={unitSystem === 'metric' ? 'Switch to Imperial units (miles, lbs)' : 'Switch to Metric units (km, kg)'}
            >
              <Gauge className="w-3 h-3 text-cyan-500" />
              <span>{unitSystem === 'metric' ? 'km/kg' : 'mi/lbs'}</span>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95 transition"
              title="Search Tools"
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Desktop Rider Profile Button (Hidden on Mobile because MobileBottomNav already provides Profile) */}
            <button
              onClick={() => setProfileOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs font-semibold transition"
              title="Rider Profile & Dimensions"
            >
              <User className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden lg:inline">{profile.heightCm}cm / {formattedWeight.formatted}</span>
            </button>

            {/* Streamlined Background Music Switch */}
            <BackgroundMusicControl />

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 transition"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

      {/* Global Rider Profile Modal */}
      <RiderProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};
