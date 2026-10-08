import LZString from 'lz-string';
import { dicePresets } from './presets';
import { sanitizeDiceList } from './diceUtils';
import { MAX_NAME_LENGTH } from './constants';
import type { DiceData } from '../types';

// What makes a dice set "the same game": each die's faces, symbols, colour and
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

// A share link is a hand-craftable URL, so its dice are treated as untrusted.
// Returns no dice when the link cannot be read.
export function readShareLink(hash: string): { dice: DiceData[]; name: string | null } {
  const { data, name } = splitShareHash(hash);
  try {
    const json = LZString.decompressFromEncodedURIComponent(data);
    return { dice: json ? sanitizeDiceList(JSON.parse(json)) : [], name };
  } catch (e) {
    console.error("Failed to load shared dice set from URL", e);
    return { dice: [], name };
  }
}
