import React, { useState, useMemo } from 'react';
import { AudioProvider } from './context/AudioContext';
import { ToastProvider } from './context/ToastContext';
import { RiderProfileProvider } from './context/RiderProfileContext';
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
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { TOOLS_LIST } from './data/toolsList';
import { ArrowLeft, ChevronRight, ChevronLeft, Home } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [currentToolId, setCurrentToolId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);
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
        (tool.titleEn && tool.titleEn.toLowerCase().includes(q)) ||
        tool.subtitle.toLowerCase().includes(q) ||
        (tool.subtitleEn && tool.subtitleEn.toLowerCase().includes(q)) ||
        tool.description.toLowerCase().includes(q) ||
        (tool.descriptionEn && tool.descriptionEn.toLowerCase().includes(q)) ||
        tool.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (tool.tagsEn && tool.tagsEn.some(tag => tag.toLowerCase().includes(q)));

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
        {/* PWA Installation Prompt Bar (Mobile & Desktop) */}
        <PwaInstallPrompt />

        {/* Top Header */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDark={isDark}
          setIsDark={setIsDark}
          onNavigateHome={() => {
            setCurrentToolId(null);
            setSelectedCategory('all');
          }}
          currentToolId={currentToolId}
          onSelectTool={(id) => setCurrentToolId(id)}
          profileModalOpen={profileModalOpen}
          setProfileModalOpen={setProfileModalOpen}
        />

        {/* Main Container with extra bottom padding on mobile for MobileBottomNav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-8">
          <main className="space-y-6">
            {/* Top Breadcrumb & Next/Prev Tool Switcher (Inside a tool) */}
            {currentToolId && currentToolMeta && (
              <div className="glass-panel px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm no-print">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentToolId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t('backToHome')}
                  </button>

                  <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium ml-2">
                    <span
                      className="cursor-pointer hover:text-cyan-500 flex items-center gap-1 transition"
                      onClick={() => setCurrentToolId(null)}
                    >
                      <Home className="w-3.5 h-3.5" />
                      {t('navHome')}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                    <span>
                      {language === 'en' && currentToolMeta.categoryLabelEn
                        ? currentToolMeta.categoryLabelEn
                        : language === 'zh-TW' && currentToolMeta.categoryLabelTw
                        ? currentToolMeta.categoryLabelTw
                        : currentToolMeta.categoryLabel}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">
                      {language === 'en' && currentToolMeta.titleEn
                        ? currentToolMeta.titleEn
                        : language === 'zh-TW' && currentToolMeta.titleTw
                        ? currentToolMeta.titleTw
                        : currentToolMeta.title}
                    </span>
                  </div>
                </div>

                {/* Sequential Tool Navigation (Prev / Next) + Jump Selector */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevTool}
                    disabled={currentToolIndex <= 0}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-cyan-500 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                    title={t('prevTool')}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('prevTool')}</span>
                  </button>

                  <select
                    value={currentToolId}
                    onChange={(e) => {
                      setCurrentToolId(e.target.value);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 text-xs text-slate-800 dark:text-slate-300 font-medium focus:outline-none focus:border-cyan-500 max-w-[180px] sm:max-w-[240px] truncate"
                  >
                    {TOOLS_LIST.map((tItem) => {
                      const displayTitle = language === 'en' && tItem.titleEn
                        ? tItem.titleEn
                        : language === 'zh-TW' && tItem.titleTw
                        ? tItem.titleTw
                        : tItem.title;
                      return (
                        <option key={tItem.id} value={tItem.id}>
                          {displayTitle}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={handleNextTool}
                    disabled={currentToolIndex >= TOOLS_LIST.length - 1}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-cyan-500 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                    title={t('nextTool')}
                  >
                    <span className="hidden sm:inline">{t('nextTool')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
            {currentToolId === 'power-radar' && <PowerProfileRadar />}
            {currentToolId === 'health-calculator' && <HealthCalculator />}
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
      <RiderProfileProvider>
        <ToastProvider>
          <AudioProvider>
            <MainAppContent />
          </AudioProvider>
        </ToastProvider>
      </RiderProfileProvider>
    </LanguageAndUnitProvider>
  );
};
