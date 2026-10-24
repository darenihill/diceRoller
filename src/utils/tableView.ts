import type { DiceData } from '../types';
import { parseFaceContent, faceNumericValue, FACE_ICON_PREFIX } from './diceUtils';

/** A die as the big table view shows it: a small tile with its face. */
export interface TableTile {
  id: string;
  text: string;
  value: number;
  dropped: boolean;
  held: boolean;
}

const ROTATED: Record<string, string> = { '0': '0', '1': '1', '6': '9', '8': '8', '9': '6' };

/**
 * True when a number would read as a different number upside down (6, 9, 16,
 * 61...), so the table view underlines it, like 6 and 9 on real dice.
 */
export function needsUnderline(text: string): boolean {
  if (!/^\d+$/.test(text) || !/[69]/.test(text)) return false;
  if (![...text].every(c => c in ROTATED)) return false;
  const flipped = [...text].reverse().map(c => ROTATED[c]).join('');
  return flipped !== text;
}

/** Each die's current face, for the small tiles under the big total. */
export function tableTiles(dice: DiceData[]): TableTile[] {
  return dice.map(d => {
    let text = String(d.numberValue);
    let value = d.numberValue;
    if (d.customFaces.length > 0) {
      const raw = d.customFaces[d.currentFaceIndex ?? 0] ?? '';
      const face = parseFaceContent(raw).content;
      value = faceNumericValue(raw);
      // An icon face has no text to show, so its tile shows the number it counts as
      text = face.startsWith(FACE_ICON_PREFIX) || !face ? String(value) : face;
    }
    return { id: d.id, text, value, dropped: !!d.dropped, held: d.held };
  });
}

/** Most dice the math line lists one by one before it shows only the modifier. */
export const MATH_DICE_LIMIT = 12;

/**
 * The math under the big total: "4 + 3 + 2" for the dice, then the modifier
 * ("4 + 3 − 2"). Null when there is nothing to add up (one die, no modifier).
 */
export function tableMath(tiles: TableTile[], modifier: number): string | null {
  const counted = tiles.filter(t => !t.dropped).map(t => t.value);
  if (counted.length > MATH_DICE_LIMIT) {
    const dice = counted.reduce((a, b) => a + b, 0);
    return modifier ? `${dice} ${modifier > 0 ? '+' : '−'} ${Math.abs(modifier)}` : null;
  }
  const mod = modifier ? ` ${modifier > 0 ? '+' : '−'} ${Math.abs(modifier)}` : '';
  if (counted.length + (modifier ? 1 : 0) < 2) return null;
  return `${counted.join(' + ')}${mod}`;
}
