import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DEFAULT_NAV_SHORTCUTS, ALL_NAV_TOOLS } from '../utils/toolNavHelper';
import {
  BikeProfile,
  BikeCategory,
  DrivetrainConfig,
  WheelTireConfig,
  FittingGeometryConfig,
  DEFAULT_ENRICHED_BIKE_GARAGE,
  migrateBikeProfile
} from '../types/garage';

export type {
  BikeProfile,
  BikeCategory,
  DrivetrainConfig,
  WheelTireConfig,
  FittingGeometryConfig
};
export { migrateBikeProfile };

export interface RiderProfile {
  id?: string;
  name?: string;
  role?: 'gc' | 'sprinter' | 'climber' | 'rouleur' | 'domestique' | 'custom';
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

export interface TeamRider extends RiderProfile {
  id: string;
  name: string;
  role: 'gc' | 'sprinter' | 'climber' | 'rouleur' | 'domestique' | 'custom';
}

export const DEFAULT_TEAM_ROSTER: TeamRider[] = [
  {
    id: 'rider-gc',
    name: '车手 1 (主将 GC Leader)',
    role: 'gc',
    heightCm: 176,
    inseamCm: 81.5,
    weightKg: 66,
    bikeWeightKg: 6.9,
    ftpWatts: 410,
    restingHr: 42,
    maxHr: 198,
    gender: 'male',
    age: 26,
  },
  {
    id: 'rider-sprinter',
    name: '车手 2 (冲刺手 Sprinter)',
    role: 'sprinter',
    heightCm: 181,
    inseamCm: 83.5,
    weightKg: 75,
    bikeWeightKg: 7.2,
    ftpWatts: 380,
    restingHr: 48,
    maxHr: 195,
    gender: 'male',
    age: 28,
  },
  {
    id: 'rider-climber',
    name: '车手 3 (纯爬坡手 Climber)',
    role: 'climber',
    heightCm: 173,
    inseamCm: 80.5,
    weightKg: 59,
    bikeWeightKg: 6.4,
    ftpWatts: 375,
    restingHr: 44,
    maxHr: 202,
    gender: 'male',
    age: 25,
  },
  {
    id: 'rider-tt',
    name: '车手 4 (计时突围手 TT Specialist)',
    role: 'rouleur',
    heightCm: 193,
    inseamCm: 91.0,
    weightKg: 82,
    bikeWeightKg: 8.4,
    ftpWatts: 460,
    restingHr: 46,
    maxHr: 190,
    gender: 'male',
    age: 27,
  }
];

export const DEFAULT_BIKE_GARAGE: BikeProfile[] = DEFAULT_ENRICHED_BIKE_GARAGE;

interface RiderProfileContextType {
  profile: RiderProfile;
  updateProfile: (partial: Partial<RiderProfile>) => void;
  resetProfile: () => void;
  
  // Team Roster
  roster: TeamRider[];
  activeRiderId: string;
  activeRider: TeamRider;
  switchRider: (id: string) => void;
  addRider: (rider: TeamRider) => void;
  deleteRider: (id: string) => void;
  updateRider: (id: string, partial: Partial<TeamRider>) => void;

  // Bike Garage & Data Bus
  bikes: BikeProfile[];
  activeBikeId: string;
  activeBike: BikeProfile;
  switchBike: (id: string) => void;
  addBike: (bike: BikeProfile) => void;
  deleteBike: (id: string) => void;
  updateBike: (id: string, partial: Partial<BikeProfile>) => void;
  updateActiveBike: (partial: Partial<BikeProfile>) => void;
  updateActiveBikeDrivetrain: (partial: Partial<DrivetrainConfig>) => void;
  updateActiveBikeWheelTire: (partial: Partial<WheelTireConfig>) => void;
  updateActiveBikeGeometry: (partial: Partial<FittingGeometryConfig>) => void;

  // Nav Shortcuts
  navShortcuts: string[];
  setNavShortcut: (slotIndex: number, toolId: string) => boolean;
  setAllNavShortcuts: (shortcuts: string[]) => boolean;
  resetNavShortcuts: () => void;
}

const RiderProfileContext = createContext<RiderProfileContextType | null>(null);

export const RiderProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load Team Roster
  const [roster, setRoster] = useState<TeamRider[]>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_team_roster');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load roster from localStorage', e);
    }
    return DEFAULT_TEAM_ROSTER;
  });

  // Active Rider ID
  const [activeRiderId, setActiveRiderId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_active_rider_id');
      if (saved) return saved;
    } catch (e) {
      console.warn('Failed to load active rider id', e);
    }
    return DEFAULT_TEAM_ROSTER[0].id;
  });

  // Bike Garage
  const [bikes, setBikes] = useState<BikeProfile[]>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_bike_garage');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(b => migrateBikeProfile(b));
        }
      }
    } catch (e) {
      console.warn('Failed to load bike garage from localStorage', e);
    }
    return DEFAULT_BIKE_GARAGE;
  });

  // Active Bike ID
  const [activeBikeId, setActiveBikeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_active_bike_id');
      if (saved) return saved;
    } catch (e) {
      console.warn('Failed to load active bike id', e);
    }
    return DEFAULT_BIKE_GARAGE[0].id;
  });

  // Active Rider & Active Bike computations
  const activeRider = useMemo(() => {
    return roster.find(r => r.id === activeRiderId) || roster[0] || DEFAULT_TEAM_ROSTER[0];
  }, [roster, activeRiderId]);

  const activeBike = useMemo(() => {
    return bikes.find(b => b.id === activeBikeId) || bikes[0] || DEFAULT_BIKE_GARAGE[0];
  }, [bikes, activeBikeId]);

  // Backward-compatible single profile view
  const profile: RiderProfile = useMemo(() => {
    return {
      ...activeRider,
      bikeWeightKg: activeBike ? activeBike.weightKg : activeRider.bikeWeightKg
    };
  }, [activeRider, activeBike]);

  // Nav shortcuts
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

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_team_roster', JSON.stringify(roster));
    } catch (e) {
      console.warn('Failed to save team roster', e);
    }
  }, [roster]);

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_active_rider_id', activeRiderId);
    } catch (e) {
      console.warn('Failed to save active rider id', e);
    }
  }, [activeRiderId]);

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_bike_garage', JSON.stringify(bikes));
    } catch (e) {
      console.warn('Failed to save bike garage', e);
    }
  }, [bikes]);

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_active_bike_id', activeBikeId);
    } catch (e) {
      console.warn('Failed to save active bike id', e);
    }
  }, [activeBikeId]);

  useEffect(() => {
    try {
      localStorage.setItem('solorider_bottom_nav_shortcuts', JSON.stringify(navShortcuts));
    } catch (e) {
      console.warn('Failed to save nav shortcuts to localStorage', e);
    }
  }, [navShortcuts]);

  // Roster methods
  const switchRider = (id: string) => {
    if (roster.some(r => r.id === id)) {
      setActiveRiderId(id);
    }
  };

  const addRider = (rider: TeamRider) => {
    setRoster(prev => [...prev, rider]);
    setActiveRiderId(rider.id);
  };

  const deleteRider = (id: string) => {
    if (roster.length <= 1) return;
    setRoster(prev => {
      const next = prev.filter(r => r.id !== id);
      if (activeRiderId === id && next.length > 0) {
        setActiveRiderId(next[0].id);
      }
      return next;
    });
  };

  const updateRider = (id: string, partial: Partial<TeamRider>) => {
    setRoster(prev => prev.map(r => r.id === id ? { ...r, ...partial } : r));
  };

  const updateProfile = (partial: Partial<RiderProfile>) => {
    if (activeRider) {
      updateRider(activeRider.id, partial);
    }
  };

  const resetProfile = () => {
    setRoster(DEFAULT_TEAM_ROSTER);
    setActiveRiderId(DEFAULT_TEAM_ROSTER[0].id);
    setBikes(DEFAULT_BIKE_GARAGE);
    setActiveBikeId(DEFAULT_BIKE_GARAGE[0].id);
  };

  // Bike Garage methods
  const switchBike = (id: string) => {
    if (bikes.some(b => b.id === id)) {
      setActiveBikeId(id);
    }
  };

  const addBike = (bike: BikeProfile) => {
    setBikes(prev => [...prev, bike]);
    setActiveBikeId(bike.id);
  };

  const deleteBike = (id: string) => {
    if (bikes.length <= 1) return;
    setBikes(prev => {
      const next = prev.filter(b => b.id !== id);
      if (activeBikeId === id && next.length > 0) {
        setActiveBikeId(next[0].id);
      }
      return next;
    });
  };

  const updateBike = (id: string, partial: Partial<BikeProfile>) => {
    setBikes(prev => prev.map(b => b.id === id ? { ...b, ...partial } : b));
  };

  const updateActiveBike = (partial: Partial<BikeProfile>) => {
    if (activeBikeId) {
      updateBike(activeBikeId, partial);
    }
  };

  const updateActiveBikeDrivetrain = (partial: Partial<DrivetrainConfig>) => {
    if (activeBike) {
      updateBike(activeBikeId, {
        drivetrain: { ...activeBike.drivetrain, ...partial }
      });
    }
  };

  const updateActiveBikeWheelTire = (partial: Partial<WheelTireConfig>) => {
    if (activeBike) {
      updateBike(activeBikeId, {
        wheelTire: { ...activeBike.wheelTire, ...partial }
      });
    }
  };

  const updateActiveBikeGeometry = (partial: Partial<FittingGeometryConfig>) => {
    if (activeBike) {
      updateBike(activeBikeId, {
        geometry: { ...(activeBike.geometry || {}), ...partial }
      });
    }
  };

  // Slot-based shortcut updater
  const setNavShortcut = (slotIndex: number, toolId: string): boolean => {
    if (slotIndex < 0 || slotIndex >= 4) return false;
    if (!ALL_NAV_TOOLS.some(t => t.id === toolId)) return false;

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
        roster,
        activeRiderId,
        activeRider,
        switchRider,
        addRider,
        deleteRider,
        updateRider,
        bikes,
        activeBikeId,
        activeBike,
        switchBike,
        addBike,
        deleteBike,
        updateBike,
        updateActiveBike,
        updateActiveBikeDrivetrain,
        updateActiveBikeWheelTire,
        updateActiveBikeGeometry,
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
