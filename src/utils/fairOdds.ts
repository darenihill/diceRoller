/**
 * Fair-dice odds for the Luck Meter: the chance of each total with the dice
 * on the table now, worked out exactly (no simulation). It follows the same
 * rules as a roll: custom faces count their numeric value, RPG Mode adds the
 * modifier, and Advantage or Disadvantage keeps the best or worst of each
 * group of matching plain dice.
 */
import type { DiceData } from '../types';
import type { RollAdvantageMode } from '../hooks/useDiceState';
import { faceNumericValue, isNumberedFaces } from './diceUtils';

/** total -> chance (0..1) */
export type Odds = Map<number, number>;

function dieOdds(d: DiceData): Odds {
  const odds: Odds = new Map();
  if (d.customFaces.length > 0) {
    const each = 1 / d.customFaces.length;
    for (const f of d.customFaces) {
      const v = faceNumericValue(f);
      odds.set(v, (odds.get(v) ?? 0) + each);
    }
  } else {
    for (let v = 1; v <= d.faces; v++) odds.set(v, 1 / d.faces);
  }
  return odds;
}

/** Best (or worst) of k plain dN */
function keptOdds(n: number, k: number, keepHighest: boolean): Odds {
  const odds: Odds = new Map();
  for (let v = 1; v <= n; v++) {
    const p = keepHighest
      ? (v / n) ** k - ((v - 1) / n) ** k
      : ((n - v + 1) / n) ** k - ((n - v) / n) ** k;
    odds.set(v, p);
  }
  return odds;
}

function add(a: Odds, b: Odds): Odds {
  const out: Odds = new Map();
  for (const [x, px] of a) for (const [y, py] of b) out.set(x + y, (out.get(x + y) ?? 0) + px * py);
  return out;
}

export function fairOdds(dice: DiceData[], rpgMode: boolean, modifier: number, advantage: RollAdvantageMode): Odds {
  if (dice.length === 0) return new Map();
  let parts: Odds[] = [];
  if (rpgMode && advantage !== 'normal' && dice.length > 1) {
    // Same grouping as a roll: plain dice (or 1..n numbered faces) by face count
    const groups = new Map<number, number>();
    for (const d of dice) {
      if (d.customFaces.length > 0 && !isNumberedFaces(d.customFaces)) parts.push(dieOdds(d));
      else groups.set(d.faces, (groups.get(d.faces) ?? 0) + 1);
    }
    for (const [n, k] of groups) {
      // A lone die keeps itself: best of one is just the die
      parts.push(keptOdds(n, k, advantage === 'advantage'));
    }
  } else {
    parts = dice.map(dieOdds);
  }
  let total: Odds = new Map([[rpgMode ? modifier : 0, 1]]);
  for (const p of parts) total = add(total, p);
  return total;
}

/** Which dice a roll used, for telling when the dice changed between rolls */
export function luckSet(dice: Pick<DiceData, 'faces' | 'customFaces'>[]): string {
  return JSON.stringify(dice.map(d => [d.faces, d.customFaces]));
}

export interface LuckRow { total: number; count: number; fair: number }

/**
 * Rows for the Luck Meter: every total the dice can make (with zero rows for
 * ones not rolled yet, when the range is short enough to list), plus any
 * rolled total outside it. `fair` is the expected count for that many rolls.
 */
export function luckRows(counts: Map<number, number>, odds: Odds, rolls: number, maxRows = 40): LuckRow[] {
  const totals = new Set<number>(counts.keys());
  const possible = [...odds.entries()].filter(([, p]) => p > 0).map(([t]) => t);
  if (possible.length > 0 && possible.length <= maxRows) possible.forEach(t => totals.add(t));
  return [...totals].sort((a, b) => a - b).map(t => ({ total: t, count: counts.get(t) ?? 0, fair: (odds.get(t) ?? 0) * rolls }));
}

/** The total that came up most out of step with fair dice */
export function furthestFromFair(rows: LuckRow[]): LuckRow | null {
  let best: LuckRow | null = null;
  for (const r of rows) if (!best || Math.abs(r.count - r.fair) > Math.abs(best.count - best.fair)) best = r;
  return best;
}
