import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_rider_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save rider profile to localStorage', e);
    }
  }, [profile]);

  const updateProfile = (partial: Partial<RiderProfile>) => {
    setProfile(prev => ({ ...prev, ...partial }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_RIDER_PROFILE);
  };

  return (
    <RiderProfileContext.Provider value={{ profile, updateProfile, resetProfile }}>
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
