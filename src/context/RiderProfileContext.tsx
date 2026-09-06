import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DEFAULT_NAV_SHORTCUTS, ALL_NAV_TOOLS } from '../utils/toolNavHelper';

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

export interface BikeProfile {
  id: string;
  name: string;
  type: 'road_aero' | 'road_climb' | 'road_tt' | 'gravel' | 'mtb_xc' | 'mtb_enduro';
  weightKg: number;
  crr: number;
  cda: number;
  notes?: string;
  mileageKm?: number;
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

export const DEFAULT_BIKE_GARAGE: BikeProfile[] = [
  {
    id: 'bike-aero',
    name: 'Colnago V4Rs / 顶级气动公路车',
    type: 'road_aero',
    weightKg: 6.9,
    crr: 0.0038,
    cda: 0.28,
    notes: '平路巡航与起伏大组赛利器'
  },
  {
    id: 'bike-climb',
    name: 'Specialized Aethos / 极限轻量爬坡车',
    type: 'road_climb',
    weightKg: 6.1,
    crr: 0.0036,
    cda: 0.31,
    notes: '高山大坡特化，UCI 6.8kg 极限减重'
  },
  {
    id: 'bike-tt',
    name: 'Canyon Speedmax TT / 计时赛战车',
    type: 'road_tt',
    weightKg: 8.4,
    crr: 0.0032,
    cda: 0.22,
    notes: '极限破风头管与封闭轮'
  },
  {
    id: 'bike-gravel',
    name: 'Cervélo Áspero / 竞技砂石越野车',
    type: 'gravel',
    weightKg: 8.2,
    crr: 0.0048,
    cda: 0.34,
    notes: '40c 宽胎碎石路耐力设定'
  },
  {
    id: 'bike-mtb-xc',
    name: 'Scott Spark RC / 120mm 全避震山地车',
    type: 'mtb_xc',
    weightKg: 10.2,
    crr: 0.0075,
    cda: 0.42,
    notes: 'XC 山地越野双气室避震'
  }
];

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

  // Bike Garage
  bikes: BikeProfile[];
  activeBikeId: string;
  activeBike: BikeProfile;
  switchBike: (id: string) => void;
  addBike: (bike: BikeProfile) => void;
  deleteBike: (id: string) => void;
  updateBike: (id: string, partial: Partial<BikeProfile>) => void;

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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
