import type { DiceData } from '../types';
import type { RollHistoryItem } from '../hooks/useDiceState';

/**
 * Rolls sorted by game: which dice made them, by faces only. Colours, names,
 * holds and RPG settings are left out, so recolouring Catan or changing the
 * modifier is still the same game, but loading That's Pretty Clever is not
 * (owner, 2026-11-05: histories got conflated when switching games).
 */
type Die = [number, string[]];

function keyOf(dice: Die[]): string {
  return JSON.stringify(dice.map(d => JSON.stringify(d)).sort());
}

/** The game a set of dice belongs to */
export function gameKeyFor(dice: Pick<DiceData, 'faces' | 'customFaces'>[]): string | null {
  if (dice.length === 0) return null;
  return keyOf(dice.map(d => [d.faces, d.customFaces ?? []]));
}

/** The game a roll belongs to, read from the dice it recorded; null for a
 *  single die or a roll saved before dice were recorded */
export function gameKeyOf(item: RollHistoryItem): string | null {
  if (item.single || !item.set) return null;
  try {
    const parsed = JSON.parse(item.set);
    const dice = Array.isArray(parsed) ? parsed[0] : null;
    if (!Array.isArray(dice) || dice.length === 0) return null;
    return keyOf(dice.map((d: unknown) => {
      const [faces, faceList] = Array.isArray(d) ? d : [];
      return [Number(faces) || 0, Array.isArray(faceList) ? faceList.map(String) : []] as Die;
    }));
  } catch {
    return null;
  }
}

/** A short name for dice with no game name: "2d6", "d20 + d8", "3 custom dice" */
export function diceSummary(key: string): string {
  let dice: Die[];
  try {
    dice = (JSON.parse(key) as string[]).map(s => JSON.parse(s) as Die);
  } catch {
    return 'Dice';
  }
  const counts = new Map<string, number>();
  for (const [faces, custom] of dice) {
    const name = custom.length > 0 ? 'custom' : `d${faces}`;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const parts = [...counts.entries()]
    .sort((a, b) => (a[0] === 'custom' ? 1 : b[0] === 'custom' ? -1 : Number(b[0].slice(1)) - Number(a[0].slice(1))))
    .map(([name, n]) => name === 'custom' ? `${n} custom ${n === 1 ? 'die' : 'dice'}` : `${n > 1 ? n : ''}${name}`);
  return parts.join(' + ') || 'Dice';
}

export interface RollGroup {
  key: string;
  label: string;
  count: number;
}

/**
 * The games in the history, newest first: the one on the table now (when it
 * has rolls), then up to `others` earlier ones. Older games stay in the log
 * and under All; they just don't get a chip.
 */
export function recentGroups(history: RollHistoryItem[], currentKey: string | null, others = 3): RollGroup[] {
  const order: string[] = [];
  const counts = new Map<string, number>();
  const names = new Map<string, string>();
  for (const item of history) {
    const key = gameKeyOf(item);
    if (!key) continue;
    if (!counts.has(key)) order.push(key);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!names.has(key) && item.game) names.set(key, item.game);
  }
  const rest = order.filter(k => k !== currentKey).slice(0, others);
  const keys = currentKey && counts.has(currentKey) ? [currentKey, ...rest] : rest;
  return keys.map(key => ({ key, label: names.get(key) ?? diceSummary(key), count: counts.get(key) ?? 0 }));
}

/** The name to show for a game in the log */
export function groupLabel(history: RollHistoryItem[], key: string): string {
  return history.find(i => i.game && gameKeyOf(i) === key)?.game ?? diceSummary(key);
}
