import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getToolDraft,
  setToolDraft,
  clearToolDraft,
  hasToolDraft,
} from '../../hooks/useToolDraftState';

class MockLocalStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe('Tool Draft Persistence Engine', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns fallback value when no draft exists', () => {
    const fallback = { weight: 68, pressure: 75 };
    const draft = getToolDraft('tire-test', fallback);
    expect(draft).toEqual(fallback);
    expect(hasToolDraft('tire-test')).toBe(false);
  });

  it('correctly sets and retrieves draft state', () => {
    const data = { saddleHeight: 742, reach: 385, stem: 110 };
    const success = setToolDraft('fitter-test', data);
    expect(success).toBe(true);
    expect(hasToolDraft('fitter-test')).toBe(true);

    const retrieved = getToolDraft('fitter-test', { saddleHeight: 700, reach: 350, stem: 90 });
    expect(retrieved).toEqual(data);
  });

  it('clears draft state properly', () => {
    setToolDraft('clean-test', { a: 1 });
    expect(hasToolDraft('clean-test')).toBe(true);

    clearToolDraft('clean-test');
    expect(hasToolDraft('clean-test')).toBe(false);
    expect(getToolDraft('clean-test', { fallback: true })).toEqual({ fallback: true });
  });

  it('gracefully falls back when stored JSON is malformed', () => {
    mockStorage.setItem('rouleur_draft_malformed', '{invalid json syntax}');
    const fallback = { safe: true };
    const retrieved = getToolDraft('malformed', fallback);
    expect(retrieved).toEqual(fallback);
  });

  it('handles localStorage exceptions (QuotaExceededError or security restrictions)', () => {
    vi.spyOn(mockStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const success = setToolDraft('quota-test', { large: 'payload' });
    expect(success).toBe(false);
  });

  it('falls back safely when storage is unavailable (SSR/restricted)', () => {
    vi.stubGlobal('localStorage', undefined);
    vi.stubGlobal('window', {});

    const fallback = { default: 42 };
    expect(getToolDraft('no-storage', fallback)).toEqual(fallback);
    expect(setToolDraft('no-storage', { a: 1 })).toBe(false);
    expect(hasToolDraft('no-storage')).toBe(false);
  });
});
