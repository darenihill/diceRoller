import { useCallback, useEffect, useState } from 'react';

/** Chrome, Edge and Android's install offer, kept until the player asks for it. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** True when the app already runs from the home screen. */
export const runsInstalled = () =>
  (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Install app: holds the browser's own install box so it opens only when the
 * player taps Install app (no pop-up on its own). Where there is no install box,
 * as on iPhone Safari, `install` reports that the how-to should show instead.
 */
export function useInstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(runsInstalled);

  useEffect(() => {
    const onOffer = (e: Event) => {
      // Stop the browser's own banner; the menu tile offers it instead
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onOffer);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onOffer);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  /** Opens the install box; returns false when the how-to should show instead. */
  const install = useCallback(async (): Promise<boolean> => {
    if (!prompt) return false;
    // The browser's offer works once; drop it whatever the answer
    setPrompt(null);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    } catch {
      return false;
    }
    return true;
  }, [prompt]);

  return { installed, install };
}
