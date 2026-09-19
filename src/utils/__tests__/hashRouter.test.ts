import { describe, it, expect } from 'vitest';
import { parseToolIdFromHash, formatHashForTool } from '../hashRouter';

describe('Hash Router Deep Linking Engine', () => {
  describe('parseToolIdFromHash', () => {
    it('returns null for empty hash, root hash, or home hash', () => {
      expect(parseToolIdFromHash('')).toBeNull();
      expect(parseToolIdFromHash('#')).toBeNull();
      expect(parseToolIdFromHash('#/')).toBeNull();
      expect(parseToolIdFromHash('#home')).toBeNull();
      expect(parseToolIdFromHash('#/home')).toBeNull();
    });

    it('decodes PWA manifest shortcut format (#tool-xxx)', () => {
      expect(parseToolIdFromHash('#tool-power-calc')).toBe('power-calc');
      expect(parseToolIdFromHash('#tool-tire-pressure')).toBe('tire-pressure');
      expect(parseToolIdFromHash('#tool-bike-fitter')).toBe('bike-fitter');
      expect(parseToolIdFromHash('#tool-roadbook-library')).toBe('roadbook-library');
    });

    it('decodes SPA path format (#/tool/xxx)', () => {
      expect(parseToolIdFromHash('#/tool/gear-calculator')).toBe('gear-calculator');
      expect(parseToolIdFromHash('#/tool/chain-calculator')).toBe('chain-calculator');
      expect(parseToolIdFromHash('#/tool/mtb-suspension')).toBe('mtb-suspension');
    });

    it('decodes direct hash ID format (#xxx)', () => {
      expect(parseToolIdFromHash('#climb-pacing')).toBe('climb-pacing');
      expect(parseToolIdFromHash('#workout-builder')).toBe('workout-builder');
      expect(parseToolIdFromHash('#activity-analyzer')).toBe('activity-analyzer');
    });

    it('rejects invalid or unknown tool IDs gracefully', () => {
      expect(parseToolIdFromHash('#tool-unknown-xyz')).toBeNull();
      expect(parseToolIdFromHash('#random-hash-string')).toBeNull();
      expect(parseToolIdFromHash('#tool-')).toBeNull();
    });
  });

  describe('formatHashForTool', () => {
    it('returns empty string for null, empty, or invalid toolId', () => {
      expect(formatHashForTool(null)).toBe('');
      expect(formatHashForTool('')).toBe('');
      expect(formatHashForTool('non-existent-tool')).toBe('');
    });

    it('generates canonical hash format (#tool-xxx) for valid tools', () => {
      expect(formatHashForTool('tire-pressure')).toBe('#tool-tire-pressure');
      expect(formatHashForTool('bike-fitter')).toBe('#tool-bike-fitter');
      expect(formatHashForTool('power-calc')).toBe('#tool-power-calc');
    });
  });
});
