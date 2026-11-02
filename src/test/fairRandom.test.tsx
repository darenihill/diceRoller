import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { randomBelow } from '../utils/fairRandom';
import { HelpModal } from '../components/modals/HelpModal';

afterEach(() => { vi.restoreAllMocks(); });

describe('Fair dice from secure random numbers', () => {
  it('draws from crypto.getRandomValues, not Math.random', () => {
    const secure = vi.spyOn(globalThis.crypto, 'getRandomValues');
    const everyday = vi.spyOn(Math, 'random');
    for (let i = 0; i < 50; i++) randomBelow(6);
    expect(secure).toHaveBeenCalled();
    expect(everyday).not.toHaveBeenCalled();
  });

  it('no roll code calls Math.random', () => {
    for (const file of ['src/hooks/useDiceState.ts', 'src/components/Dice.tsx']) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/Math\.random/);
    }
  });

  it('stays in range and redraws the uneven top end', () => {
    const draws = [2 ** 32 - 1, 0]; // the first is past the even part for a d6, so it is drawn again
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(arr: T) => {
      (arr as unknown as Uint32Array)[0] = draws.shift() ?? 0;
      return arr;
    });
    expect(randomBelow(6)).toBe(0);
    expect(draws).toHaveLength(0);
  });

  it.each([6, 20])('every face of a d%i comes up evenly', (faces) => {
    const rolls = 60000;
    const counts = new Array(faces).fill(0);
    for (let i = 0; i < rolls; i++) {
      const face = randomBelow(faces);
      expect(face).toBeGreaterThanOrEqual(0);
      expect(face).toBeLessThan(faces);
      counts[face]++;
    }
    const expected = rolls / faces;
    // Each face within 10% of an even share (far outside chance for a fair die)
    for (const c of counts) expect(Math.abs(c - expected)).toBeLessThan(expected * 0.1);
  });

  it('Help says how the dice are rolled', () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    expect(screen.getByText(/secure random numbers/)).toBeInTheDocument();
  });
});
