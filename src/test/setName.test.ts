import { describe, it, expect } from 'vitest';
import LZString from 'lz-string';
import { currentSetName, diceSignature, splitShareHash } from '../utils/setName';
import { sanitizeDiceList } from '../utils/diceUtils';
import { dicePresets } from '../utils/presets';

const catan = dicePresets.find(p => p.name === 'Catan')!;

describe('set name chip', () => {
  it('names a built-in game the dice match, after loading and after rolling', () => {
    const dice = sanitizeDiceList(catan.dice);
    expect(currentSetName(dice, null)).toBe('Catan');
    const rolled = dice.map(d => ({ ...d, currentFaceIndex: 3, held: true, numberValue: 5 }));
    expect(currentSetName(rolled, null)).toBe('Catan');
  });

  it('clears once the dice no longer match the game', () => {
    const dice = sanitizeDiceList(catan.dice);
    expect(currentSetName(dice.slice(1), null)).toBeNull();
    expect(currentSetName([...dice, { ...dice[0], id: 'x' }], null)).toBeNull();
    expect(currentSetName(dice.map((d, i) => i === 0 ? { ...d, color: '#123456' } : d), null)).toBeNull();
    expect(currentSetName([], null)).toBeNull();
  });

  it('keeps a saved set name only while the dice match it', () => {
    const dice = sanitizeDiceList([{ faces: 8, color: '#FF0000', name: 'Mine' }]);
    const loaded = { name: 'My game', signature: diceSignature(dice) };
    expect(currentSetName(dice, loaded)).toBe('My game');
    expect(currentSetName(dice.map(d => ({ ...d, faces: 10 })), loaded)).toBeNull();
  });

  it('gives the default two dice no game name', () => {
    const plain = sanitizeDiceList([{ faces: 6, color: '#E9EAEC' }, { faces: 6, color: '#E9EAEC' }]);
    expect(currentSetName(plain, null)).toBeNull();
  });

  it('every built-in game is told apart from the others', () => {
    const signatures = dicePresets.map(p => diceSignature(sanitizeDiceList(p.dice)));
    expect(new Set(signatures).size).toBe(signatures.length);
  });
});

describe('share link name', () => {
  const data = LZString.compressToEncodedURIComponent(JSON.stringify([{ faces: 6 }]));

  it('reads older links that carry no name', () => {
    expect(splitShareHash(`#share=${data}`)).toEqual({ data, name: null });
  });

  it('reads the name after the dice', () => {
    expect(splitShareHash(`#share=${data}&name=${encodeURIComponent('Friday night & co')}`))
      .toEqual({ data, name: 'Friday night & co' });
  });

  it('ignores a name that cannot be decoded', () => {
    expect(splitShareHash(`#share=${data}&name=%E0%A4%A`).name).toBeNull();
  });

  it('compressed dice never contain the name marker', () => {
    expect(data.includes('&')).toBe(false);
  });
});
