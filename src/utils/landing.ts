import { dicePresets } from './presets';
import { sanitizeDiceList } from './diceUtils';
import { MAX_NAME_LENGTH } from './constants';
import type { DiceData } from '../types';

export interface LandingStart {
  heading: string | null;
  dice: DiceData[];
  name: string | null;
  rpg: boolean;
}

// A landing page (landing/pages.mjs) puts its starting state on the root
// element as data-start. The home page has none and returns null.
export function parseLandingStart(raw: string | undefined): LandingStart | null {
  if (!raw) return null;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const preset = typeof data.preset === 'string' ? dicePresets.find(p => p.name === data.preset) : undefined;
  const dice = sanitizeDiceList(preset ? preset.dice : data.dice);
  if (dice.length === 0) return null;
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, MAX_NAME_LENGTH) : null);
  return {
    heading: text(data.heading),
    dice,
    name: preset ? preset.name : text(data.name),
    rpg: data.rpg === true,
  };
}

export function readLandingStart(): LandingStart | null {
  return parseLandingStart(document.getElementById('root')?.dataset.start);
}

// The page's writing ships in the HTML (for search engines) but is shown in
// the About dialog rather than below the dice. Returns it without its heading,
// which the dialog title already shows.
export function readLandingAbout(): string | null {
  const article = document.querySelector('.landing-article');
  if (!article) return null;
  const copy = article.cloneNode(true) as HTMLElement;
  copy.querySelector('.landing-title')?.remove();
  return copy.innerHTML.trim() || null;
}
