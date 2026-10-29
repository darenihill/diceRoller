/**
 * Natural 20 confetti: about a second of confetti bursting from the die.
 * canvas-confetti draws on its own see-through canvas with pointer-events off,
 * so nothing moves and taps still reach the buttons. It is loaded only when a
 * natural 20 lands, so it never slows the first visit.
 */
const COLOURS = ['#FFD54F', '#FFB300', '#4FC3F7', '#F06292', '#AED581', '#FFFFFF'];

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Where the burst starts: the middle of the die, as a fraction of the screen */
function dieOrigin(id: string): { x: number; y: number } {
  const el = document.querySelector<HTMLElement>(`[data-dice-id="${CSS.escape(id)}"]`);
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  if (!el) return { x: 0.5, y: 0.4 };
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / w, y: (r.top + r.height / 2) / h };
}

/** Fires one burst per natural 20 die; does nothing with Reduce motion on */
export async function celebrateNatural20(ids: string[]): Promise<boolean> {
  if (ids.length === 0 || prefersReducedMotion()) return false;
  const { default: confetti } = await import('canvas-confetti');
  for (const id of ids) {
    confetti({
      origin: dieOrigin(id),
      particleCount: 80,
      spread: 360,
      startVelocity: 28,
      gravity: 0.9,
      ticks: 90,
      scalar: 0.9,
      colors: COLOURS,
      zIndex: 2000,
      disableForReducedMotion: true
    });
  }
  return true;
}
