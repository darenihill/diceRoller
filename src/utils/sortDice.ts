import type { DiceData } from '../types';

/**
 * Sort dice after each roll (owner, 2026-11-06). These only decide where the
 * dice sit on screen: the dice list itself, its saved order, share links and
 * History keep the order the player built.
 */

/** Ids from the lowest roll to the highest; equal rolls keep their own order. */
export function lowToHigh(list: DiceData[]): string[] {
  return list
    .map((d, i) => ({ id: d.id, value: d.numberValue, i }))
    .sort((a, b) => a.value - b.value || a.i - b.i)
    .map(d => d.id);
}

/** The dice in the order they sit: `order` first, any die it doesn't name after, in list order. */
export function arrangeDice(list: DiceData[], order: string[]): DiceData[] {
  const byId = new Map(list.map(d => [d.id, d]));
  const placed = order.flatMap(id => {
    const d = byId.get(id);
    if (!d) return [];
    byId.delete(id);
    return [d];
  });
  return [...placed, ...list.filter(d => byId.has(d.id))];
}
