import LZString from 'lz-string';
import { dicePresets } from './presets';
import { sanitizeDiceList } from './diceUtils';
import { MAX_NAME_LENGTH } from './constants';
import type { DiceData } from '../types';

// What makes a dice set "the same game": each die's faces, symbols, color and
// label. Rolled values, holds and ids change during play and are left out, so
// rolling Catan is still Catan, but adding, removing or editing a die is not.
export function diceSignature(dice: Partial<DiceData>[]): string {
  return JSON.stringify(dice.map(d => [
    d.faces ?? 6,
    d.customFaces ?? [],
    (d.color ?? '').toUpperCase(),
    d.name ?? ''
  ]));
}

/** Which dice are out, for telling when the dice change after a roll.
 *  Values and holds are left out: rolling or holding is not a change. */
export function rollSignature(dice: DiceData[]): string {
  return JSON.stringify(dice.map(d => d.id)) + diceSignature(dice);
}

export interface LoadedSet {
  name: string;
  signature: string;
}

// The name to show for the dice on screen: the set that was last loaded while
// the dice still match it, else a built-in game the dice match exactly (so a
// shared link or a reload of Catan still says Catan), else nothing.
export function currentSetName(dice: Partial<DiceData>[], loaded: LoadedSet | null): string | null {
  if (dice.length === 0) return null;
  const signature = diceSignature(dice);
  if (loaded && loaded.signature === signature) return loaded.name;
  const preset = dicePresets.find(p => diceSignature(p.dice) === signature);
  return preset ? preset.name : null;
}

// Share links carry the set's name after the dice: #share=<dice>&name=<name>.
// The compressed dice never contain "&", so older links without a name still read.
export function splitShareHash(hash: string): { data: string; name: string | null } {
  const body = hash.replace(/^#share=/, '');
  const at = body.indexOf('&name=');
  if (at === -1) return { data: body, name: null };
  let name: string | null;
  try {
    name = decodeURIComponent(body.slice(at + 6)).trim().slice(0, MAX_NAME_LENGTH) || null;
  } catch {
    name = null;
  }
  return { data: body.slice(0, at), name };
}

/** Longest unpacked share link read, in characters */
export const MAX_SHARE_JSON = 1_000_000;

// A link may only carry a built-in game's name (any letter case) when its dice
// are that game's dice, so other dice can't pose as "Catan". Other names pass.
export function shareNameFor(dice: Partial<DiceData>[], name: string | null): string | null {
  if (!name) return name;
  const key = name.trim().toLowerCase();
  const preset = dicePresets.find(p => p.name.toLowerCase() === key);
  return !preset || diceSignature(preset.dice) === diceSignature(dice) ? name : null;
}

// A share link is a hand-craftable URL, so its dice are treated as untrusted.
// Returns no dice when the link cannot be read.
export function readShareLink(hash: string): { dice: DiceData[]; name: string | null } {
  const { data, name } = splitShareHash(hash);
  try {
    const json = LZString.decompressFromEncodedURIComponent(data);
    // A tiny link can unpack to megabytes and freeze the page; the biggest
    // real set is about half this (review 2026-11-06)
    if (!json || json.length > MAX_SHARE_JSON) return { dice: [], name };
    const dice = sanitizeDiceList(JSON.parse(json));
    return { dice, name: shareNameFor(dice, name) };
  } catch (e) {
    console.error("Failed to load shared dice set from URL", e);
    return { dice: [], name };
  }
}

/** "Catan" taken? Gives "Catan (2)", or the next free number after it. */
export function nextFreeSaveName(name: string, taken: Iterable<string>): string {
  const names = new Set(taken);
  const base = name.trim().replace(/\s\(\d+\)$/, '');
  let n = 2;
  while (names.has(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

/** A die's own name from Dice Settings; the plain "d6" a die can carry doesn't count */
const givenName = (d: Partial<DiceData>) => {
  const n = (d.name ?? '').trim();
  return n && !/^d\d+$/i.test(n) ? n : '';
};

/** Room kept for the " 2" a taken name gets, so the result stays within the save name length */
const SUGGEST_ROOM = MAX_NAME_LENGTH - 4;

/** `base`, or `base 2`, `base 3`… when that name is taken; "Catan 2" taken gives "Catan 3", not "Catan 2 2" */
function freeName(base: string, names: Set<string>): string {
  let root = base.slice(0, SUGGEST_ROOM).trim();
  if (!names.has(root)) return root;
  root = root.replace(/ \d+$/, '') || root;
  let n = 2;
  while (names.has(`${root} ${n}`)) n++;
  return `${root} ${n}`;
}

/** Joins the parts with " + ", whole parts only, ending "+ more" when they don't all fit */
function joinParts(parts: string[]): string {
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    const next = out ? `${out} + ${parts[i]}` : parts[i];
    const tail = i < parts.length - 1 ? ' + more' : '';
    if (next.length + tail.length > SUGGEST_ROOM && out) return `${out} + more`;
    out = next;
  }
  return out;
}

/**
 * The name Save fills in (owner, 2026-11-07: Save fills in a name for you,
 * like "Catan 2" or "2 d6"). In order: the loaded game's name; dice named in
 * Dice Settings ("Lunch die + 2 d6"); a count of each plain kind
 * ("2 d6 + 1 d20"); custom-face dice with no name are "Custom dice". A taken
 * name gets the next free number.
 */
export function suggestSaveName(dice: Partial<DiceData>[], loaded: LoadedSet | null, taken: Iterable<string>): string {
  const names = new Set(taken);
  if (dice.length === 0) return '';
  const game = currentSetName(dice, loaded);
  if (game) return freeName(game, names);
  // Named dice first, then plain kinds smallest first, then unnamed custom dice
  const named = new Map<string, number>();
  const plain = new Map<number, number>();
  let custom = 0;
  for (const d of dice) {
    const own = givenName(d);
    if (own) named.set(own, (named.get(own) ?? 0) + 1);
    else if ((d.customFaces?.length ?? 0) > 0) custom++;
    else plain.set(Number(d.faces) || 6, (plain.get(Number(d.faces) || 6) ?? 0) + 1);
  }
  const parts = [
    ...[...named].map(([n, c]) => (c > 1 ? `${c} ${n}` : n)),
    ...[...plain].sort((a, b) => a[0] - b[0]).map(([f, c]) => `${c} d${f}`),
    ...(custom > 0 ? ['Custom dice'] : []),
  ];
  return freeName(joinParts(parts), names);
}
