import { parseRollNotation } from './rollNotation';

/** A typed roll kept as a button under the Type a roll box. */
export interface SavedRoll {
  name: string;
  /** The roll as the box writes it back, e.g. "2d6+3" or "d20+5 adv" */
  text: string;
}

export const SAVED_ROLLS_KEY = 'savedRolls';
export const MAX_SAVED_ROLLS = 20;
export const MAX_ROLL_NAME = 20;

/** Keeps only entries with a name and a roll the box can read; anything else is dropped. */
export function sanitizeSavedRolls(input: unknown): SavedRoll[] {
  if (!Array.isArray(input)) return [];
  const out: SavedRoll[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const { name, text } = item as Record<string, unknown>;
    if (typeof name !== 'string' || typeof text !== 'string') continue;
    const cleanName = name.trim().slice(0, MAX_ROLL_NAME);
    const parsed = parseRollNotation(text);
    if (!cleanName || !parsed.ok) continue;
    if (out.some(r => r.name === cleanName)) continue;
    out.push({ name: cleanName, text: parsed.roll.text });
    if (out.length >= MAX_SAVED_ROLLS) break;
  }
  return out;
}

export function loadSavedRolls(): SavedRoll[] {
  try {
    return sanitizeSavedRolls(JSON.parse(localStorage.getItem(SAVED_ROLLS_KEY) || '[]'));
  } catch {
    return [];
  }
}

/** Adds a roll, or updates the roll of one with the same name, keeping its place. */
export function withSavedRoll(list: SavedRoll[], roll: SavedRoll): SavedRoll[] {
  const i = list.findIndex(r => r.name === roll.name);
  if (i >= 0) return list.map((r, j) => (j === i ? roll : r));
  return [...list, roll].slice(-MAX_SAVED_ROLLS);
}
