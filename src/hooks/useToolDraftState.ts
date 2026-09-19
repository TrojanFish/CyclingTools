import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_STORAGE_PREFIX = 'rouleur_draft_';

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Safely load draft state from localStorage.
 */
export function getToolDraft<T>(key: string, fallback: T): T {
  try {
    const storage = getStorage();
    if (!storage) return fallback;
    const raw = storage.getItem(`${DRAFT_STORAGE_PREFIX}${key}`);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely save draft state to localStorage with quota defense.
 */
export function setToolDraft<T>(key: string, value: T): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(`${DRAFT_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch {
    // Graceful fallback for QuotaExceededError or private browsing restrictions
    return false;
  }
}

/**
 * Safely delete a tool draft from localStorage.
 */
export function clearToolDraft(key: string): void {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(`${DRAFT_STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore clear errors
  }
}

/**
 * Check if a tool draft currently exists.
 */
export function hasToolDraft(key: string): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    return storage.getItem(`${DRAFT_STORAGE_PREFIX}${key}`) !== null;
  } catch {
    return false;
  }
}

export interface UseToolDraftStateReturn<T> {
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
  resetDraft: () => void;
  hasSavedDraft: boolean;
  saveDraft: (val?: T) => boolean;
}

/**
 * Apple HIG compliant persistent draft state hook for calculators & tool forms.
 * Safely captures input changes into local storage and recovers them on reload,
 * protecting user customization from accidental navigation or refresh.
 */
export function useToolDraftState<T>(
  key: string,
  initialValue: T,
  autoSave = true
): UseToolDraftStateReturn<T> {
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(() => hasToolDraft(key));
  const [draft, setDraft] = useState<T>(() => getToolDraft<T>(key, initialValue));

  const isInitialMount = useRef(true);

  // Auto-sync draft changes to localStorage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (autoSave) {
      const ok = setToolDraft(key, draft);
      if (ok) {
        setHasSavedDraft(true);
      }
    }
  }, [key, draft, autoSave]);

  const resetDraft = useCallback(() => {
    clearToolDraft(key);
    setDraft(initialValue);
    setHasSavedDraft(false);
  }, [key, initialValue]);

  const saveDraft = useCallback((val?: T) => {
    const valueToSave = val !== undefined ? val : draft;
    const ok = setToolDraft(key, valueToSave);
    if (ok) {
      setHasSavedDraft(true);
    }
    return ok;
  }, [key, draft]);

  return {
    draft,
    setDraft,
    resetDraft,
    hasSavedDraft,
    saveDraft,
  };
}
