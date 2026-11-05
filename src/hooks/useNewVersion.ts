import { useCallback, useEffect, useState } from 'react';

/** How often an open app checks for a new version while it is on screen */
const CHECK_EVERY_MS = 30 * 60 * 1000;
/** The offline worker lets requests carrying this through to the network (public/sw.js) */
export const VERSION_CHECK_PARAM = 'version-check';

/** The app's main script, e.g. "main-B7xnGLqp.js": a new deploy gets a new name */
export function mainScriptName(source: string): string | null {
  const m = source.match(/assets\/(main-[\w-]+\.js)/);
  return m ? m[1] : null;
}

/**
 * Tells an app that has been left open when a newer version is out (owner's
 * pick, 2026-11-03: "The installed app shows a bar when a new version is
 * ready"). It reads the live page's main script name and compares it with the
 * one this page loaded: when the app comes back on screen, when signal
 * returns, and every 30 minutes while it stays on screen.
 */
export function useNewVersion(): { ready: boolean; later: () => void } {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    const own = document.querySelector<HTMLScriptElement>('script[type="module"][src*="assets/main-"]');
    const current = own ? mainScriptName(own.getAttribute('src') ?? '') : null;
    // Dev server, tests and a page without a built script: nothing to compare
    if (!current || typeof fetch !== 'function') return;

    let stopped = false;
    const check = () => {
      if (document.visibilityState === 'hidden' || navigator.onLine === false) return;
      const url = `${import.meta.env.BASE_URL}index.html?${VERSION_CHECK_PARAM}=${Date.now()}`;
      fetch(url, { cache: 'no-store' })
        .then(r => (r.ok ? r.text() : ''))
        .then(html => {
          const live = mainScriptName(html);
          if (!stopped && live && live !== current) { setLatest(live); setReady(true); }
        })
        .catch(() => { /* no signal: try again next time */ });
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', check);
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', check);
      clearInterval(timer);
    };
  }, []);

  // "Later" hides the bar for this version; a newer one brings it back
  const later = useCallback(() => setDismissed(latest), [latest]);
  return { ready: ready && dismissed !== latest, later };
}
