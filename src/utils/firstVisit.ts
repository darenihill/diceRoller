import { readItem, saveQuietly } from './safeStorage';
import { SAVED } from './savedValues';
import { SAVED_ROLLS_KEY } from './savedRolls';
import { BUZZ_KEY, BUZZ_SHOWN_KEY } from './buzz';

/**
 * First visit: the first die starts with its buttons open, once per phone
 * (owner, 2026-11-10, way "Show the buttons once"). This mark, saved the
 * moment they open, stops them ever opening by themselves again. It is this
 * phone's own and stays out of backups.
 */
export const DIE_BUTTONS_SHOWN_KEY = 'dieButtonsShown';

/**
 * Nothing saved on this phone yet: no mark, no games, settings, History or
 * saved rolls. The metrics switch doesn't count: Erase everything keeps it as
 * it was set, and the app then opens like a first visit (owner, 2026-11-10)
 */
export function isFirstVisit(): boolean {
  if (readItem(DIE_BUTTONS_SHOWN_KEY) !== null) return false;
  const keys = [...Object.values(SAVED).filter(key => key !== SAVED.telemetry), SAVED_ROLLS_KEY, BUZZ_KEY, BUZZ_SHOWN_KEY];
  return keys.every(key => readItem(key) === null);
}

/** Saves the mark. A phone that can't save just isn't told, since nothing was lost */
export function markDieButtonsShown(): void {
  saveQuietly(DIE_BUTTONS_SHOWN_KEY, 'true');
}
