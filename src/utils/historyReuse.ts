import type { RollHistoryItem } from '../hooks/useDiceState';
import type { DiceData } from '../types';

/**
 * The dice a History row rolled, ready to put back out unrolled (owner,
 * 2026-11-07: "Tap a past roll in History to put those dice back out").
 * Faces come from the roll's dice record; color and name from what new rolls
 * keep. Rolls from before colors were kept come back in the default color.
 * Returns null when the row can't be put back: a single die, or a roll too old
 * to have kept its dice.
 */
export function diceFromHistory(item: RollHistoryItem): Partial<DiceData>[] | null {
  if (item.single || !item.set) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(item.set); } catch { return null; }
  if (!Array.isArray(parsed) || !Array.isArray(parsed[0]) || parsed[0].length === 0) return null;
  return (parsed[0] as unknown[]).map((raw, i) => {
    const [faces, customFaces] = Array.isArray(raw) ? raw : [];
    return {
      faces: Number(faces),
      customFaces: Array.isArray(customFaces) ? customFaces : [],
      numberValue: 1,
      currentFaceIndex: 0,
      color: item.colors?.[i],
      name: item.names?.[i] ?? '',
      held: false,
    };
  });
}

/** True when tapping the row does something: put dice back, or a typed roll back in the box */
export const canReuse = (item: RollHistoryItem) => !item.single && (!!item.typed || diceFromHistory(item) !== null);
