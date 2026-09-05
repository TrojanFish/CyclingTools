import React, { createContext, useContext, useState, useEffect } from 'react';
import { zh } from '../locales/zh';
import { zhTW } from '../locales/zh-TW';

export type Language = 'zh' | 'zh-TW';
export type UnitSystem = 'metric' | 'imperial';

type TranslationKey = keyof typeof zh;

interface LanguageAndUnitContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  unitSystem: UnitSystem;
  setUnitSystem: (unit: UnitSystem) => void;
  toggleUnitSystem: () => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  // Unit conversion utilities
  convertWeight: (kg: number) => { value: number; unit: string; formatted: string };
  convertDistance: (km: number) => { value: number; unit: string; formatted: string };
  convertElevation: (m: number) => { value: number; unit: string; formatted: string };
  convertSpeed: (kmh: number) => { value: number; unit: string; formatted: string };
  convertTemp: (c: number) => { value: number; unit: string; formatted: string };
}

const LanguageAndUnitContext = createContext<LanguageAndUnitContextType | undefined>(undefined);

export const LanguageAndUnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Detect language: use stored preference or auto-detect based on browser (Simplified or Traditional Chinese)
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('solorider_lang');
      if (saved === 'zh' || saved === 'zh-TW') return saved;
      // Auto-detect browser language
      const navLang = (navigator.language || '').toLowerCase();
      if (navLang.includes('tw') || navLang.includes('hk') || navLang.includes('mo') || navLang.includes('hant')) {
        return 'zh-TW';
      }
      return 'zh';
    } catch {
      return 'zh';
    }
  });

  // Detect unit system: stored or default (Imperial for US/UK/en, Metric for others)
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    try {
      const saved = localStorage.getItem('solorider_unit');
      if (saved === 'metric' || saved === 'imperial') return saved;
      const navLang = navigator.language || '';
      if (navLang.includes('US') || navLang.includes('GB')) return 'imperial';
      return 'metric';
    } catch {
      return 'metric';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('solorider_lang', language);
    } catch (e) {
      // ignore
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('solorider_unit', unitSystem);
    } catch (e) {
      // ignore
    }
  }, [unitSystem]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'zh' ? 'zh-TW' : 'zh'));
  };

  const setUnitSystem = (unit: UnitSystem) => setUnitSystemState(unit);
  const toggleUnitSystem = () => setUnitSystemState(prev => (prev === 'metric' ? 'imperial' : 'metric'));

  // Translation lookup
  const t = (key: TranslationKey, replacements?: Record<string, string | number>): string => {
    const dict = language === 'zh-TW' ? zhTW : zh;
    let str: string = (dict as any)[key] || (zh as any)[key] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([rKey, rVal]) => {
        str = str.replace(new RegExp(`\\{${rKey}\\}`, 'g'), String(rVal));
      });
    }

    return str;
  };

  // Convert weight (kg -> lbs)
  const convertWeight = (kg: number) => {
    if (unitSystem === 'imperial') {
      const lbs = kg * 2.20462;
      return { value: parseFloat(lbs.toFixed(1)), unit: 'lbs', formatted: `${lbs.toFixed(1)} lbs` };
    }
    return { value: parseFloat(kg.toFixed(1)), unit: 'kg', formatted: `${kg.toFixed(1)} kg` };
  };

  // Convert distance (km -> mi)
  const convertDistance = (km: number) => {
    if (unitSystem === 'imperial') {
      const mi = km * 0.621371;
      return { value: parseFloat(mi.toFixed(1)), unit: 'mi', formatted: `${mi.toFixed(1)} mi` };
    }
    return { value: parseFloat(km.toFixed(1)), unit: 'km', formatted: `${km.toFixed(1)} km` };
  };

  // Convert elevation (m -> ft)
  const convertElevation = (m: number) => {
    if (unitSystem === 'imperial') {
      const ft = m * 3.28084;
      return { value: Math.round(ft), unit: 'ft', formatted: `${Math.round(ft)} ft` };
    }
    return { value: Math.round(m), unit: 'm', formatted: `${Math.round(m)} m` };
  };

  // Convert speed (km/h -> mph)
  const convertSpeed = (kmh: number) => {
    if (unitSystem === 'imperial') {
      const mph = kmh * 0.621371;
      return { value: parseFloat(mph.toFixed(1)), unit: 'mph', formatted: `${mph.toFixed(1)} mph` };
    }
    return { value: parseFloat(kmh.toFixed(1)), unit: 'km/h', formatted: `${kmh.toFixed(1)} km/h` };
  };

  // Convert temperature (°C -> °F)
  const convertTemp = (c: number) => {
    if (unitSystem === 'imperial') {
      const f = (c * 9) / 5 + 32;
      return { value: Math.round(f), unit: '°F', formatted: `${Math.round(f)}°F` };
    }
    return { value: Math.round(c), unit: '°C', formatted: `${Math.round(c)}°C` };
  };

  return (
    <LanguageAndUnitContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        unitSystem,
        setUnitSystem,
        toggleUnitSystem,
        t,
        convertWeight,
        convertDistance,
        convertElevation,
        convertSpeed,
        convertTemp,
      }}
    >
      {children}
    </LanguageAndUnitContext.Provider>
  );
};

export const useLanguageAndUnit = () => {
  const context = useContext(LanguageAndUnitContext);
  if (!context) {
    throw new Error('useLanguageAndUnit must be used within a LanguageAndUnitProvider');
  }
  return context;
};
