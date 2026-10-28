import { useEffect } from 'react';

type WakeLockLike = { release: () => Promise<void>; addEventListener?: (type: 'release', fn: () => void) => void };
type WakeLockApi = { request: (type: 'screen') => Promise<WakeLockLike> };

/**
 * Keeps the screen awake while Dice Roller is on screen, so a phone on the
 * table doesn't lock between turns. The browser lets go by itself when the
 * page is hidden, so it is asked again each time the page is shown.
 * Browsers without a wake lock, or that refuse it, carry on as before.
 */
export function useWakeLock(): void {
  useEffect(() => {
    const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (!api || typeof api.request !== 'function') return;

    let lock: WakeLockLike | null = null;
    let stopped = false;

    const request = async () => {
      if (stopped || lock || document.visibilityState !== 'visible') return;
      try {
        const next = await api.request('screen');
        if (stopped) {
          next.release().catch(() => {});
          return;
        }
        lock = next;
        next.addEventListener?.('release', () => {
          if (lock === next) lock = null;
        });
      } catch {
        // Refused (battery saver, no permission): the screen sleeps as usual.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void request();
      } else {
        lock = null; // the browser has already let go
      }
    };

    void request();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      lock?.release().catch(() => {});
      lock = null;
    };
  }, []);
}
