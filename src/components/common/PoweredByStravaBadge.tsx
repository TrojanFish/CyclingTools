import React from 'react';

interface PoweredByStravaBadgeProps {
  className?: string;
}

export const PoweredByStravaBadge: React.FC<PoweredByStravaBadgeProps> = ({
  className = ''
}) => {
  return (
    <a
      href="https://www.strava.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FC4C02]/10 hover:bg-[#FC4C02]/15 border border-[#FC4C02]/20 text-[#FC4C02] text-[11px] font-bold tracking-tight transition shadow-2xs ${className}`}
      title="Powered by Strava"
    >
      <svg className="w-3.5 h-3.5 fill-[#FC4C02] shrink-0" viewBox="0 0 24 24" role="img">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.925 15.632h4.17" />
      </svg>
      <span>Powered by <strong>Strava</strong></span>
    </a>
  );
};
