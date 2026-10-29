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

/** A held die keeps its value, so it adds that value every time */
function heldValue(d: DiceData): number {
  return d.customFaces.length > 0 ? faceNumericValue(d.customFaces[d.currentFaceIndex ?? 0]) : d.numberValue;
}

function dieOdds(d: DiceData): Odds {
  const odds: Odds = new Map();
  if (d.held) {
    odds.set(heldValue(d), 1);
  } else if (d.customFaces.length > 0) {
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

/**
 * Best (or worst) of k free dN, alongside any held dice in the same group
 * (`kept` is the best held value with Advantage, the worst with Disadvantage).
 */
function keptOdds(n: number, k: number, keepHighest: boolean, kept?: number): Odds {
  const free: Odds = new Map();
  if (k === 0) {
    free.set(kept ?? 0, 1);
    return free;
  }
  for (let v = 1; v <= n; v++) {
    const p = keepHighest
      ? (v / n) ** k - ((v - 1) / n) ** k
      : ((n - v + 1) / n) ** k - ((n - v) / n) ** k;
    free.set(v, p);
  }
  if (kept === undefined) return free;
  const out: Odds = new Map();
  for (const [v, p] of free) {
    const r = keepHighest ? Math.max(v, kept) : Math.min(v, kept);
    out.set(r, (out.get(r) ?? 0) + p);
  }
  return out;
}

function add(a: Odds, b: Odds): Odds {
  const out: Odds = new Map();
  for (const [x, px] of a) for (const [y, py] of b) out.set(x + y, (out.get(x + y) ?? 0) + px * py);
  return out;
}

/** Past this much work the marks are skipped, so a huge table never stalls the app */
export const MAX_ODDS_WORK = 2_000_000;

export function fairOdds(dice: DiceData[], rpgMode: boolean, modifier: number, advantage: RollAdvantageMode): Odds {
  if (dice.length === 0) return new Map();
  let parts: Odds[] = [];
  if (rpgMode && advantage !== 'normal' && dice.length > 1) {
    // Same grouping as a roll: plain dice (or 1..n numbered faces) by face count
    const best = advantage === 'advantage';
    const groups = new Map<number, { free: number; kept?: number }>();
    for (const d of dice) {
      if (d.customFaces.length > 0 && !isNumberedFaces(d.customFaces)) { parts.push(dieOdds(d)); continue; }
      const g = groups.get(d.faces) ?? { free: 0 };
      if (d.held) {
        const v = heldValue(d);
        g.kept = g.kept === undefined ? v : best ? Math.max(g.kept, v) : Math.min(g.kept, v);
      } else {
        g.free += 1;
      }
      groups.set(d.faces, g);
    }
    for (const [n, g] of groups) parts.push(keptOdds(n, g.free, best, g.kept));
  } else {
    parts = dice.map(dieOdds);
  }
  // Rough cost of the exact sums; too big and the marks are left off
  let work = 0;
  let span = 1;
  for (const p of parts) {
    work += span * p.size;
    span += p.size;
    if (work > MAX_ODDS_WORK) return new Map();
  }
  let total: Odds = new Map([[rpgMode ? modifier : 0, 1]]);
  for (const p of parts) total = add(total, p);
  return total;
}

/**
 * What a roll used (the dice, which were held and at what, and the RPG
 * settings), for telling when any of it changed between rolls
 */
export function luckSet(dice: DiceData[], rpgMode = false, modifier = 0, advantage: RollAdvantageMode = 'normal'): string {
  return JSON.stringify([
    dice.map(d => [d.faces, d.customFaces, d.held ? heldValue(d) : null]),
    rpgMode ? [modifier, advantage] : null,
  ]);
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
