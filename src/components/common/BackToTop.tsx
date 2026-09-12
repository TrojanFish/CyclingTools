import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { smoothScrollToTop } from '../../utils/toolNavHelper';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const mainEl = document.getElementById('main-content-scroll');
    const handleScroll = () => {
      const scrollPos = mainEl && window.innerWidth >= 1024
        ? mainEl.scrollTop
        : window.scrollY;
      setIsVisible(scrollPos > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={smoothScrollToTop}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-3 sm:right-6 z-30 p-2.5 sm:p-3 rounded-xl apple-touch bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl text-slate-700 dark:text-slate-300 hover:text-ios-blue dark:hover:text-ios-blue border border-black/[0.05] dark:border-white/[0.1] shadow-ios-md transition duration-200 active:scale-90 flex items-center justify-center group animate-in fade-in zoom-in-75 duration-200 no-print opacity-90 hover:opacity-100"
      title="返回顶部"
      aria-label="返回顶部"
    >
      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
};
