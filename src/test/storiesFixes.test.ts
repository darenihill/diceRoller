import { describe, it, expect } from 'vitest';
import { percentileBonus, faceScores } from '../utils/diceUtils';
import { dicePresets } from '../utils/presets';

const tens = ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90'];
const units = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

describe('stories walk fixes (2026-10-29)', () => {
  it('reads percentile 00 + 0 as 100', () => {
    expect(percentileBonus([{ customFaces: tens, value: 0 }, { customFaces: units, value: 0 }])).toBe(100);
    expect(percentileBonus([{ customFaces: tens, value: 0 }, { customFaces: units, value: 7 }])).toBe(0);
    expect(percentileBonus([{ customFaces: tens, value: 30 }, { customFaces: units, value: 0 }])).toBe(0);
    // A plain d10 beside the tens die is not a units die
    expect(percentileBonus([{ customFaces: tens, value: 0 }, { customFaces: [], value: 0 }])).toBe(0);
  });

  it('knows word faces add nothing to a total', () => {
    expect(faceScores('YES:bg:#2E7D32')).toBe(false);
    expect(faceScores('7')).toBe(true);
    expect(faceScores('Star:val:6')).toBe(true);
  });

  it('starts every preset die on a face it can show', () => {
    for (const p of dicePresets) {
      for (const d of p.dice) {
        if (!d.customFaces || d.customFaces.length === 0) {
          expect(d.numberValue, `${p.name} d${d.faces}`).toBeLessThanOrEqual(d.faces ?? 6);
        }
      }
    }
  });
});
