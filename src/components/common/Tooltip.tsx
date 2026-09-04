import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center group">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-slate-400 hover:text-cyan-400 focus:outline-none transition p-0.5 ml-1"
      >
        {children || <HelpCircle className="w-3.5 h-3.5" />}
      </button>

      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 bg-slate-900/95 border border-slate-700 text-slate-200 text-[11px] rounded-xl shadow-2xl backdrop-blur-xl leading-relaxed animate-in fade-in zoom-in-95 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
        </div>
      )}
    </div>
  );
};
