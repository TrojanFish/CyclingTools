import React from 'react';
import { IOSCard } from './IOSCard';

export const IOSToolSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-5 animate-pulse" aria-busy="true" aria-label="Loading tool content">
      {/* Tool Header Skeleton */}
      <IOSCard variant="glass" padding="md" className="relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Category Icon placeholder */}
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-36 rounded-lg bg-slate-200 dark:bg-white/10" />
                <div className="h-4 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="h-3.5 w-56 sm:w-80 rounded-md bg-slate-100 dark:bg-white/5" />
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      </IOSCard>

      {/* Main Content Layout Skeleton: 2-column or grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left/Main Card */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <IOSCard variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 rounded-lg bg-slate-200 dark:bg-white/10" />
              <div className="h-4 w-12 rounded-md bg-slate-100 dark:bg-white/5" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-slate-100 dark:bg-white/5" />
                <div className="h-9 rounded-xl bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-white/5" />
                <div className="h-9 rounded-xl bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-slate-100 dark:bg-white/5" />
                <div className="h-9 rounded-xl bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-white/5" />
                <div className="h-9 rounded-xl bg-slate-100 dark:bg-white/5" />
              </div>
            </div>

            <div className="h-28 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5" />
          </IOSCard>
        </div>

        {/* Right/Secondary Card */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          <IOSCard variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded-lg bg-slate-200 dark:bg-white/10" />
              <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
                <div className="h-3 w-14 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-6 w-20 rounded-md bg-slate-300 dark:bg-white/20" />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
                <div className="h-3 w-14 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-6 w-20 rounded-md bg-slate-300 dark:bg-white/20" />
              </div>
            </div>

            <div className="h-36 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5" />
          </IOSCard>
        </div>
      </div>
    </div>
  );
};
