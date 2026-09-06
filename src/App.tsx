import React, { useState, useMemo, useEffect } from 'react';
import { AudioProvider } from './context/AudioContext';
import { ToastProvider } from './context/ToastContext';
import { RiderProfileProvider } from './context/RiderProfileContext';
import { StravaProvider } from './context/StravaContext';
import { LanguageAndUnitProvider, useLanguageAndUnit } from './context/LanguageAndUnitContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { BackToTop } from './components/common/BackToTop';
import { CyclePowerCalculator } from './components/tools/CyclePowerCalculator';
import { RoadBikeFitter } from './components/tools/RoadBikeFitter';
import { TirePressureCalculator } from './components/tools/TirePressureCalculator';
import { GearSpeedCadenceCalculator } from './components/tools/GearSpeedCadenceCalculator';
import { ChainLengthCalculator } from './components/tools/ChainLengthCalculator';
import { ClimbPacingPlanner } from './components/tools/ClimbPacingPlanner';
import { UpgradeRoiCalculator } from './components/tools/UpgradeRoiCalculator';
import { PowerProfileRadar } from './components/tools/PowerProfileRadar';
import { RoadBikePainChecker } from './components/tools/RoadBikePainChecker';
import { RoadbookLibrary } from './components/tools/RoadbookLibrary';
import { GpxRouteCreator } from './components/tools/GpxRouteCreator';
import { GroupRideSimulator } from './components/tools/GroupRideSimulator';
import { CyclingWeatherAdvisor } from './components/tools/CyclingWeatherAdvisor';
import { HealthCalculator } from './components/tools/HealthCalculator';
import { FitActivityAnalyzer } from './components/tools/FitActivityAnalyzer';
import { TubelessSealantCalculator } from './components/tools/TubelessSealantCalculator';
import { SpokeLengthCalculator } from './components/tools/SpokeLengthCalculator';
import { MtbSuspensionTuner } from './components/tools/MtbSuspensionTuner';
import { WorkoutBuilder } from './components/tools/WorkoutBuilder';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { CustomToolSelect, StravaLogo } from './components/common/CustomToolSelect';
import { TOOLS_LIST } from './data/toolsList';
import { ArrowLeft, ChevronRight, ChevronLeft, Home } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [currentToolId, setCurrentToolId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Theme Mode: 'system' | 'dark' | 'light'
  // Auto-detect phone OS prefers-color-scheme, plus persistent manual toggle
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solorider_theme_mode');
      if (saved === 'system' || saved === 'dark' || saved === 'light') {
        return saved;
      }
    }
    return 'system'; // Default to automatic phone system detection
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen for mobile phone OS dark mode changes reactively
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute active effective dark state
  const isDark = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  const handleSetThemeMode = (mode: 'system' | 'dark' | 'light') => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('solorider_theme_mode', mode);
    }
  };

  // Synchronize documentElement class for HTML and root CSS
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const { language, t } = useLanguageAndUnit();

  // Filter tools by category & search term
  const filteredTools = useMemo(() => {
    return TOOLS_LIST.filter(tool => {
      const matchCat = selectedCategory === 'all' || tool.category === selectedCategory;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return matchCat;

      const matchSearch =
        tool.title.toLowerCase().includes(q) ||
        (tool.titleTw && tool.titleTw.toLowerCase().includes(q)) ||
        tool.subtitle.toLowerCase().includes(q) ||
        (tool.subtitleTw && tool.subtitleTw.toLowerCase().includes(q)) ||
        tool.description.toLowerCase().includes(q) ||
        (tool.descriptionTw && tool.descriptionTw.toLowerCase().includes(q)) ||
        tool.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (tool.tagsTw && tool.tagsTw.some(tag => tag.toLowerCase().includes(q)));

      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Current active tool meta & navigation indexes
  const currentToolIndex = useMemo(() => {
    return TOOLS_LIST.findIndex(t => t.id === currentToolId);
  }, [currentToolId]);

  const currentToolMeta = useMemo(() => {
    return TOOLS_LIST.find(t => t.id === currentToolId);
  }, [currentToolId]);

  const handlePrevTool = () => {
    if (currentToolIndex > 0) {
      setCurrentToolId(TOOLS_LIST[currentToolIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextTool = () => {
    if (currentToolIndex < TOOLS_LIST.length - 1) {
      setCurrentToolId(TOOLS_LIST[currentToolIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${isDark ? 'dark bg-[#0b0f19] text-slate-100' : 'light bg-slate-50 text-slate-900'}`}>
      <div>
        {/* Top Header (Fixed at top: 0 with built-in height spacer) */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDark={isDark}
          setIsDark={(dark) => handleSetThemeMode(dark ? 'dark' : 'light')}
          themeMode={themeMode}
          setThemeMode={handleSetThemeMode}
          onNavigateHome={() => {
            setCurrentToolId(null);
            setSelectedCategory('all');
          }}
          currentToolId={currentToolId}
          onSelectTool={(id) => setCurrentToolId(id)}
          profileModalOpen={profileModalOpen}
          setProfileModalOpen={setProfileModalOpen}
        />

        {/* PWA Installation Prompt Bar (Mobile & Desktop, positioned below header) */}
        <PwaInstallPrompt />

        {/* Main Container with extra bottom padding on mobile for MobileBottomNav */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 md:pb-8">
          <main className="space-y-4 sm:space-y-6">
            {/* Top Breadcrumb & Next/Prev Tool Switcher (Inside a tool) */}
            {currentToolId && currentToolMeta && (
              <div className="glass-panel px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs no-print">
                {/* Left: Simplified Back Button & Breadcrumbs */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setCurrentToolId(null)}
                    className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition active:scale-95 text-xs font-bold shrink-0"
                    title={t('backToHome')}
                    aria-label={t('backToHome')}
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline ml-1.5">{t('backToHome')}</span>
                  </button>

                  <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                    <span
                      className="cursor-pointer hover:text-cyan-500 flex items-center gap-1 transition"
                      onClick={() => setCurrentToolId(null)}
                    >
                      <Home className="w-3.5 h-3.5" />
                      {t('navHome')}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                    <span>
                      {language === 'zh-TW' && currentToolMeta.categoryLabelTw
                        ? currentToolMeta.categoryLabelTw
                        : currentToolMeta.categoryLabel}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                    <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[160px]">
                      {language === 'zh-TW' && currentToolMeta?.titleTw
                        ? currentToolMeta.titleTw
                        : currentToolMeta?.title}
                    </span>
                    {currentToolMeta?.hasStravaIntegration && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FC4C02]/10 text-[#FC4C02] text-[10px] font-bold border border-[#FC4C02]/20 shrink-0 ml-0.5"
                        title={language === 'zh-TW' ? '支援 Strava 雲端數據連動' : '支持 Strava 云端数据联动'}
                      >
                        <StravaLogo className="w-2.5 h-2.5" />
                        <span>Strava</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Sequential Tool Navigation (Prev / Next) + Fluid Jump Selector */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end min-w-0">
                  {/* Realtime Strava Integration SVG Indicator */}
                  {currentToolMeta?.hasStravaIntegration && (
                    <div
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#FC4C02]/10 border border-[#FC4C02]/25 text-[#FC4C02] text-xs font-semibold shrink-0 animate-in fade-in transition shadow-2xs"
                      title={language === 'zh-TW' ? '此工具支援 Strava 雲端數據即時連動' : '此工具支持 Strava 云端数据实时联动'}
                    >
                      <StravaLogo className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline font-bold text-[11px] tracking-tight">Strava</span>
                    </div>
                  )}

                  <button
                    onClick={handlePrevTool}
                    disabled={currentToolIndex <= 0}
                    className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-cyan-500 disabled:opacity-30 disabled:hover:text-slate-400 transition shrink-0"
                    title={t('prevTool')}
                    aria-label={t('prevTool')}
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline sm:ml-1">{t('prevTool')}</span>
                  </button>

                  <CustomToolSelect
                    currentToolId={currentToolId}
                    onSelectTool={(id) => setCurrentToolId(id)}
                    language={language}
                  />

                  <button
                    onClick={handleNextTool}
                    disabled={currentToolIndex >= TOOLS_LIST.length - 1}
                    className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-cyan-500 disabled:opacity-30 disabled:hover:text-slate-400 transition shrink-0"
                    title={t('nextTool')}
                    aria-label={t('nextTool')}
                  >
                    <span className="hidden sm:inline sm:mr-1">{t('nextTool')}</span>
                    <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Render Active View */}
            {currentToolId === null && (
              <Dashboard
                onSelectTool={(id) => {
                  setCurrentToolId(id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                filteredTools={filteredTools}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {currentToolId === 'power-calc' && <CyclePowerCalculator />}
            {currentToolId === 'tire-pressure' && <TirePressureCalculator />}
            {currentToolId === 'gear-calculator' && <GearSpeedCadenceCalculator />}
            {currentToolId === 'chain-calculator' && <ChainLengthCalculator />}
            {currentToolId === 'climb-pacing' && <ClimbPacingPlanner />}
            {currentToolId === 'upgrade-roi' && <UpgradeRoiCalculator />}
            {currentToolId === 'bike-fitter' && <RoadBikeFitter />}
            {currentToolId === 'pain-checker' && <RoadBikePainChecker />}
            {currentToolId === 'roadbook-library' && <RoadbookLibrary onNavigateTool={(id) => setCurrentToolId(id)} />}
            {currentToolId === 'gpx-creator' && <GpxRouteCreator />}
            {currentToolId === 'group-ride' && <GroupRideSimulator />}
            {currentToolId === 'weather-advisor' && <CyclingWeatherAdvisor />}
            {currentToolId === 'power-radar' && <PowerProfileRadar onNavigateTool={(id) => setCurrentToolId(id)} />}
            {currentToolId === 'health-calculator' && <HealthCalculator />}
            {currentToolId === 'activity-analyzer' && <FitActivityAnalyzer onNavigateTool={(id) => setCurrentToolId(id)} />}
            {currentToolId === 'workout-builder' && <WorkoutBuilder />}
            {currentToolId === 'tubeless-sealant' && <TubelessSealantCalculator />}
            {currentToolId === 'spoke-calculator' && <SpokeLengthCalculator />}
            {currentToolId === 'mtb-suspension' && <MtbSuspensionTuner />}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Dock Navigation */}
      <MobileBottomNav
        currentToolId={currentToolId}
        onNavigateHome={() => {
          setCurrentToolId(null);
          setSelectedCategory('all');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectTool={(id) => {
          setCurrentToolId(id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Global Footer & Back to Top Button */}
      <Footer
        onNavigateHome={() => {
          setCurrentToolId(null);
          setSelectedCategory('all');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <BackToTop />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageAndUnitProvider>
      <ToastProvider>
        <RiderProfileProvider>
          <StravaProvider>
            <AudioProvider>
              <MainAppContent />
            </AudioProvider>
          </StravaProvider>
        </RiderProfileProvider>
      </ToastProvider>
    </LanguageAndUnitProvider>
  );
};
