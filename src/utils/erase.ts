/**
 * Erase everything (owner, 2026-11-10, way "Bottom of Usage stats"): every
 * value Dice Roller keeps on this phone goes, with Google's ID cookie, and
 * the app opens again like a first visit. The metrics switch stays as it was
 * set. The offline copy of the site's own files (the service worker's cache)
 * holds nothing of yours, so it stays and the app still opens offline.
 */
import { readItem } from './safeStorage';
import { SAVED } from './savedValues';
import { clearGoogleCookies } from './analytics';
import { getFaceImages, releaseFaceImageHolds, resetFaceImageCache } from './faceImages';

export interface SavedCounts {
  games: number;
  rolls: number;
  pictures: number;
  stats: boolean;
}

const countOf = (key: string, read: (v: unknown) => number): number => {
  try {
    const raw = readItem(key);
    return raw ? read(JSON.parse(raw)) : 0;
  } catch {
    return 0;
  }
};

/** What Erase all would take, for the ask-first panel */
export function countSaved(): SavedCounts {
  return {
    games: countOf(SAVED.games, v => (v && typeof v === 'object' ? Object.keys(v).filter(k => k !== 'systemAutosave').length : 0)),
    rolls: countOf(SAVED.rollHistory, v => (Array.isArray(v) ? v.length : 0)),
    pictures: Object.keys(getFaceImages()).length,
    stats: readItem(SAVED.usageStats) !== null,
  };
}

const counted = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** "Erase 3 games, 120 rolls, 4 pictures and your stats? This can't be undone." Parts that are zero are left out. */
export function eraseQuestion(c: SavedCounts): string {
  const parts = [
    c.games > 0 ? counted(c.games, 'game', 'games') : null,
    c.rolls > 0 ? counted(c.rolls, 'roll', 'rolls') : null,
    c.pictures > 0 ? counted(c.pictures, 'picture', 'pictures') : null,
    c.stats ? 'your stats' : null,
  ].filter((p): p is string => p !== null);
  const what = parts.length === 0 ? 'everything saved on this phone'
    : parts.length === 1 ? parts[0]
    : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `Erase ${what}? This can't be undone.`;
}

/**
 * Takes every saved value off this phone, keeps the metrics switch as it was
 * and deletes Google's ID cookie. The caller has already stopped the page from
 * saving (freezeSaves) and then reloads. Returns whether storage could be emptied.
 */
export function eraseEverything(): boolean {
  const metrics = readItem(SAVED.telemetry);
  releaseFaceImageHolds();
  let erased = true;
  try {
    localStorage.clear();
    if (metrics !== null) localStorage.setItem(SAVED.telemetry, metrics);
  } catch (e) {
    console.error('Could not erase', e);
    erased = false;
  }
  resetFaceImageCache();
  clearGoogleCookies();
  return erased;
}

/** Opens the home page afresh, without a share link or a search page's game, so it starts like a first visit */
export function reloadAfterErase(): void {
  window.location.replace(import.meta.env.BASE_URL);
}
