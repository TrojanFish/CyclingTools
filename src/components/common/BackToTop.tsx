import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-30 p-2 sm:p-3 rounded-xl sm:rounded-2xl glass-panel bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 shadow-xl transition duration-200 active:scale-90 flex items-center justify-center group animate-in fade-in zoom-in-75 duration-200 no-print opacity-90 hover:opacity-100"
      title="返回顶部"
      aria-label="返回顶部"
    >
      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
};
