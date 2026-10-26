import type { RollAdvantageMode } from '../hooks/useDiceState';
import { MAX_DICE_LIMIT } from './constants';

/** One kind of die in a typed roll, e.g. 2d6 is { count: 2, faces: 6 }. */
export interface DiceGroup {
  count: number;
  faces: number;
}

export interface TypedRoll {
  groups: DiceGroup[];
  modifier: number;
  advantage: RollAdvantageMode;
  /** The roll written back tidily, e.g. "d20+5 adv", for history and messages */
  text: string;
}

export type ParseResult = { ok: true; roll: TypedRoll } | { ok: false; note: string };

const MAX_FACES = 1000;
const MAX_MODIFIER = 999;
const EXAMPLES = 'Try 2d6+3, d20 adv or 1d8+2d6.';

/**
 * Reads everyday roll notation: NdX, dX, plus or minus a number, mixed dice
 * (1d8+2d6) and adv/dis. Anything else gets a short plain note instead.
 */
export function parseRollNotation(input: string): ParseResult {
  // Phones type a real minus or dash; read them all as a plain minus
  let s = input.trim().toLowerCase().replace(/[−–—]/g, '-');
  if (!s) return { ok: false, note: `Type a roll first. ${EXAMPLES}` };

  let advantage: RollAdvantageMode = 'normal';
  const advMatch = s.match(/\s*\b(adv|advantage|dis|disadv|disadvantage)\s*$/);
  if (advMatch) {
    advantage = advMatch[1].startsWith('adv') ? 'advantage' : 'disadvantage';
    s = s.slice(0, advMatch.index).trim();
  }

  const compact = s.replace(/\s+/g, '');
  if (!compact) return { ok: false, note: `Add the dice too, like d20 adv.` };
  if (!/^[+-]?[0-9d]+([+-][0-9d]+)*$/.test(compact)) {
    return { ok: false, note: `That roll has something the app can't read. ${EXAMPLES}` };
  }

  const groups: DiceGroup[] = [];
  let modifier = 0;
  for (const term of compact.match(/[+-]?[^+-]+/g) ?? []) {
    const sign = term.startsWith('-') ? -1 : 1;
    const body = term.replace(/^[+-]/, '');
    const dice = body.match(/^(\d*)d(\d+)$/);
    if (dice) {
      if (sign < 0) return { ok: false, note: 'Dice can only be added, not taken away.' };
      const count = dice[1] === '' ? 1 : parseInt(dice[1], 10);
      const faces = parseInt(dice[2], 10);
      if (count < 1) return { ok: false, note: 'Roll at least one die.' };
      if (faces < 2 || faces > MAX_FACES) return { ok: false, note: `Dice can have 2 to ${MAX_FACES} sides.` };
      const same = groups.find(g => g.faces === faces);
      if (same) same.count += count;
      else groups.push({ count, faces });
    } else if (/^\d+$/.test(body)) {
      modifier += sign * parseInt(body, 10);
    } else {
      return { ok: false, note: `"${body}" isn't a roll the app can read. ${EXAMPLES}` };
    }
  }

  if (groups.length === 0) return { ok: false, note: `Add some dice, like 2d6+3.` };
  if (Math.abs(modifier) > MAX_MODIFIER) return { ok: false, note: `Keep the plus or minus under ${MAX_MODIFIER + 1}.` };

  if (advantage !== 'normal') {
    // Advantage keeps the best of one kind of die, so "d20 adv" means two d20
    if (groups.length > 1) {
      return { ok: false, note: 'Advantage works with one kind of die, like d20 adv.' };
    }
    if (groups[0].count === 1) groups[0].count = 2;
  }

  const total = groups.reduce((n, g) => n + g.count, 0);
  if (total > MAX_DICE_LIMIT) return { ok: false, note: `That's ${total} dice; the most is ${MAX_DICE_LIMIT}.` };

  return { ok: true, roll: { groups, modifier, advantage, text: formatRoll(groups, modifier, advantage) } };
}

function formatRoll(groups: DiceGroup[], modifier: number, advantage: RollAdvantageMode): string {
  // "d20 adv" reads better than "2d20 adv", since the second die is implied
  const dice = groups
    .map(g => (advantage !== 'normal' && g.count === 2 ? `d${g.faces}` : `${g.count}d${g.faces}`))
    .join('+');
  const mod = modifier > 0 ? `+${modifier}` : modifier < 0 ? `-${Math.abs(modifier)}` : '';
  const adv = advantage === 'advantage' ? ' adv' : advantage === 'disadvantage' ? ' dis' : '';
  return `${dice}${mod}${adv}`;
}

/** Typed dice match the D&D dice in the add menu */
export const TYPED_DIE_COLOR = '#384050';
