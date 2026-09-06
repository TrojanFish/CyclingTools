/**
 * Web Haptics Utility
 * Simulates Apple Taptic Engine tactile vibrations on supported mobile devices
 */

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning';

export const triggerHaptic = (type: HapticFeedbackType = 'light'): void => {
  if (typeof window === 'undefined') return;

  // Check if navigator.vibrate is available (Android Chrome, PWA installed apps, etc.)
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(8);
          break;
        case 'selection':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(22);
          break;
        case 'heavy':
          navigator.vibrate(36);
          break;
        case 'success':
          navigator.vibrate([10, 45, 12]);
          break;
        case 'warning':
          navigator.vibrate([25, 40, 25]);
          break;
        default:
          navigator.vibrate(10);
      }
    } catch {
      // Fail silently if vibration is blocked by user gesture policy
    }
  }
};
