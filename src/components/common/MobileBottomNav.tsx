import React from 'react';
import { Home } from 'lucide-react';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { getNavToolById } from '../../utils/toolNavHelper';

interface MobileBottomNavProps {
  currentToolId: string | null;
  onNavigateHome: () => void;
  onSelectTool: (id: string) => void;
  onOpenProfile?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentToolId,
  onNavigateHome,
  onSelectTool
}) => {
  const { language } = useLanguageAndUnit();
  const { navShortcuts } = useRiderProfile();

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
  }

  const homeItem: NavItem = {
    id: 'home',
    label: language === 'zh-TW' ? '首頁' : '首页',
    icon: Home,
    isActive: currentToolId === null,
    onClick: onNavigateHome
  };

  const dynamicItems: NavItem[] = [];
  navShortcuts.forEach((toolId) => {
    const tool = getNavToolById(toolId);
    if (tool) {
      dynamicItems.push({
        id: tool.id,
        label: language === 'zh-TW' ? tool.shortTitleTw : tool.shortTitle,
        icon: tool.icon,
        isActive: currentToolId === tool.id,
        onClick: () => onSelectTool(tool.id)
      });
    }
  });

  const navItems: NavItem[] = [homeItem, ...dynamicItems];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#1C1C1E]/85 border-t border-black/[0.06] dark:border-white/[0.08] backdrop-blur-2xl saturate-180 px-3 py-1 shadow-[0_-1px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_-1px_16px_rgba(0,0,0,0.4)] no-print transition-colors"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all apple-touch ${
                active
                  ? 'text-ios-blue dark:text-ios-blue-dark font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all duration-200 ${active ? 'bg-ios-blue/12 dark:bg-ios-blue/20 scale-105' : ''}`}>
                <Icon className={`w-4 h-4 transition-all ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-sans select-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
