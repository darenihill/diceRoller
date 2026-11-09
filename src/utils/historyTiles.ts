import type { RollHistoryItem } from '../hooks/useDiceState';

export interface HistoryTile {
  /** What the die landed on: a number, or a custom face's word or symbol */
  face: string;
  /** The die's color, or plain white for rolls from before colors were kept */
  color: string;
  /** The die Advantage or Disadvantage left out of the total */
  dropped: boolean;
}

const PLAIN = '#E9EAEC';
const SAFE_COLOR = /^#[0-9a-fA-F]{3,8}$/;

/**
 * The small dice a History row shows (owner, 2026-11-07: "History shows each
 * roll as small dice, not 'd6 #1: 2, d6 #2: 4'"). Read from the roll's lines,
 * "d6 #1: 4" or "Lunch die: Tacos (dropped)", and the colors new rolls keep.
 */
export function historyTiles(item: RollHistoryItem): HistoryTile[] {
  return item.details
    .filter(line => !line.startsWith('Modifier: '))
    .map((line, i) => {
      const dropped = line.endsWith(' (dropped)');
      const body = dropped ? line.slice(0, -' (dropped)'.length) : line;
      const cut = body.indexOf(': ');
      // "Star (6)": the tile shows the face, the number it counts as stays in the full text
      const face = (cut >= 0 ? body.slice(cut + 2) : body).replace(/ \(-?\d+\)$/, '');
      const color = item.colors?.[i];
      return { face, color: color && SAFE_COLOR.test(color) ? color : PLAIN, dropped };
    });
}

/** The name under the roll number: the game, the typed roll, or the one die rolled */
export function historySubtitle(item: RollHistoryItem): string {
  if (item.game) return item.game;
  if (item.typed) return item.typed;
  if (item.single) {
    const line = item.details[0] ?? '';
    const cut = line.indexOf(': ');
    const label = cut > 0 ? line.slice(0, cut) : '';
    // A plain "d6 #3" reads as "One d6"
    const plain = label.match(/^(d\d+) #\d+$/);
    return plain ? `One ${plain[1]}` : label || 'One die';
  }
  return '';
}
