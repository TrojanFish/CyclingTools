import { describe, it, expect } from 'vitest';

describe('Drivetrain Physics & Mechanics Formulas', () => {
  describe('Chain Length Calculation (Rigby vs Shimano Direct Method)', () => {
    // Helper function reproducing Rigby formula
    function calculateRigbyChainLinks(
      chainstayMm: number,
      bigRing: number,
      bigCog: number,
      pulleyTeeth = 11,
      isFullSuspension = false,
      chainstayGrowthMm = 15
    ) {
      const effectiveChainstayMm = isFullSuspension ? chainstayMm + chainstayGrowthMm : chainstayMm;
      const cInches = effectiveChainstayMm / 25.4;
      const pulleyExtraInches = pulleyTeeth > 11 ? (pulleyTeeth - 11) * 0.15 : 0;
      const rawLengthInches = 2 * cInches + bigRing / 4 + bigCog / 4 + 1 + pulleyExtraInches;
      const finalRawLinks = rawLengthInches * 2;
      return Math.ceil(finalRawLinks / 2) * 2;
    }

    // Helper function reproducing Shimano method
    function calculateShimanoChainLinks(
      chainstayMm: number,
      bigRing: number,
      bigCog: number,
      isSingleRing = false
    ) {
      const cInches = chainstayMm / 25.4;
      return Math.ceil((4 * cInches + (bigRing + bigCog) / 2 + (isSingleRing ? 4 : 2)) / 2) * 2;
    }

    it('calculates standard 108-112 links for compact 50/34T and 11-34T on 410mm chainstay', () => {
      const links = calculateRigbyChainLinks(410, 50, 34);
      expect(links).toBeGreaterThanOrEqual(108);
      expect(links).toBeLessThanOrEqual(112);
      expect(links % 2).toBe(0); // Must be an even number of half-links
    });

    it('adds extra links for full suspension chain growth under bottom-out', () => {
      const rigid = calculateRigbyChainLinks(430, 34, 51, 12, false, 0);
      const fullSuspension = calculateRigbyChainLinks(430, 34, 51, 12, true, 20);
      expect(fullSuspension).toBeGreaterThan(rigid);
    });

    it('calculates Shimano direct method links with quick-link allowance', () => {
      const shimanoLinks = calculateShimanoChainLinks(410, 50, 34, false);
      expect(shimanoLinks % 2).toBe(0);
      expect(shimanoLinks).toBeGreaterThanOrEqual(108);
    });
  });

  describe('Rear Derailleur Capacity & Gear Ratio Mechanics', () => {
    function calculateCapacity(bigRing: number, smallRing: number, bigCog: number, smallCog: number, is1x = false) {
      const frontDiff = is1x ? 0 : Math.max(0, bigRing - smallRing);
      const rearDiff = Math.max(0, bigCog - smallCog);
      return frontDiff + rearDiff;
    }

    it('calculates drivetrain total capacity requirement', () => {
      // Compact 50/34 (16T diff) + 11-34 (23T diff) = 39T total capacity requirement
      const capacityCompact = calculateCapacity(50, 34, 34, 11, false);
      expect(capacityCompact).toBe(39);

      // Semi-compact 52/36 (16T diff) + 11-30 (19T diff) = 35T capacity requirement
      const capacitySemi = calculateCapacity(52, 36, 30, 11, false);
      expect(capacitySemi).toBe(35);

      // 1x Gravel 40T + 10-44T (34T diff) = 34T capacity requirement
      const capacity1x = calculateCapacity(40, 40, 44, 10, true);
      expect(capacity1x).toBe(34);
    });

    it('computes exact speed from cadence, gear ratio, and wheel circumference', () => {
      // Standard 700x28c wheel circumference is ~2.136m
      const circumferenceM = 2.136;
      const cadenceRpm = 90;
      const frontTeeth = 50;
      const rearTeeth = 17;

      const gearRatio = frontTeeth / rearTeeth; // ~2.941
      const speedKmh = (cadenceRpm * gearRatio * circumferenceM * 60) / 1000;

      // 90 rpm in 50x17 with 700x28c tire produces ~34.0 km/h
      expect(speedKmh).toBeGreaterThan(33.5);
      expect(speedKmh).toBeLessThan(34.5);
    });
  });
});
