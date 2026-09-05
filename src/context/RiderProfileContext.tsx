import React, { createContext, useContext, useState, useEffect } from 'react';

import { DEFAULT_NAV_SHORTCUTS, ALL_NAV_TOOLS } from '../utils/toolNavHelper';

export interface RiderProfile {
  heightCm: number;
  inseamCm: number;
  weightKg: number;
  bikeWeightKg: number;
  ftpWatts: number;
  restingHr: number;
  maxHr: number;
  gender: 'male' | 'female';
  age: number;
}

const DEFAULT_RIDER_PROFILE: RiderProfile = {
  heightCm: 175,
  inseamCm: 81,
  weightKg: 68,
  bikeWeightKg: 8.5,
  ftpWatts: 230,
  restingHr: 58,
  maxHr: 190,
  gender: 'male',
  age: 28,
};

interface RiderProfileContextType {
  profile: RiderProfile;
  updateProfile: (partial: Partial<RiderProfile>) => void;
  resetProfile: () => void;
  navShortcuts: string[];
  setNavShortcut: (slotIndex: number, toolId: string) => boolean;
  setAllNavShortcuts: (shortcuts: string[]) => boolean;
  resetNavShortcuts: () => void;
}

const RiderProfileContext = createContext<RiderProfileContextType | null>(null);

export const RiderProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<RiderProfile>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_rider_profile');
      if (saved) {
        return { ...DEFAULT_RIDER_PROFILE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load rider profile from localStorage', e);
    }
    return DEFAULT_RIDER_PROFILE;
  });

  const [navShortcuts, setNavShortcuts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('solorider_bottom_nav_shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === 4 &&
          new Set(parsed).size === 4 &&
          parsed.every(id => ALL_NAV_TOOLS.some(t => t.id === id))
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load nav shortcuts from localStorage', e);
    }
    return DEFAULT_NAV_SHORTCUTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_rider_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save rider profile to localStorage', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('solorider_bottom_nav_shortcuts', JSON.stringify(navShortcuts));
    } catch (e) {
      console.warn('Failed to save nav shortcuts to localStorage', e);
    }
  }, [navShortcuts]);

  const updateProfile = (partial: Partial<RiderProfile>) => {
    setProfile(prev => ({ ...prev, ...partial }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_RIDER_PROFILE);
  };

  // Slot-based shortcut updater with strict deduplication guard
  const setNavShortcut = (slotIndex: number, toolId: string): boolean => {
    if (slotIndex < 0 || slotIndex >= 4) return false;
    // Check if tool is valid
    if (!ALL_NAV_TOOLS.some(t => t.id === toolId)) return false;

    // Strict duplicate check: if toolId is already in another slot, reject
    if (navShortcuts.includes(toolId) && navShortcuts[slotIndex] !== toolId) {
      return false;
    }

    setNavShortcuts(prev => {
      const updated = [...prev];
      updated[slotIndex] = toolId;
      return updated;
    });
    return true;
  };

  const setAllNavShortcuts = (shortcuts: string[]): boolean => {
    const valid = shortcuts.filter(id => ALL_NAV_TOOLS.some(t => t.id === id));
    const unique = Array.from(new Set(valid));
    if (unique.length !== 4) return false;
    setNavShortcuts(unique);
    return true;
  };

  const resetNavShortcuts = () => {
    setNavShortcuts(DEFAULT_NAV_SHORTCUTS);
  };

  return (
    <RiderProfileContext.Provider
      value={{
        profile,
        updateProfile,
        resetProfile,
        navShortcuts,
        setNavShortcut,
        setAllNavShortcuts,
        resetNavShortcuts
      }}
    >
      {children}
    </RiderProfileContext.Provider>
  );
};

export const useRiderProfile = () => {
  const context = useContext(RiderProfileContext);
  if (!context) {
    throw new Error('useRiderProfile must be used within a RiderProfileProvider');
  }
  return context;
};
