import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

const base: DiceData = { id: 'd1', numberValue: 20, faces: 20, customFaces: [], color: '#384050', held: false };
const props = { isRevealed: false, onReveal: () => {}, onToggleHold: () => {}, onRemove: () => {}, onOpenSettings: () => {} };
const die = (c: HTMLElement) => c.querySelector('[data-dice-id="d1"]') as HTMLElement;

describe('Natural 20 and natural 1 glow waits for the die to land', () => {
  it('no glow while the die is still rolling, glow once it lands', () => {
    const { container, rerender } = render(<Dice dice={{ ...base, isCrit20: true }} {...props} isRolling />);
    expect(die(container).className).not.toMatch(/crit20/);
    rerender(<Dice dice={{ ...base, isCrit20: true }} {...props} isRolling={false} />);
    expect(die(container).className).toMatch(/crit20/);
  });

  it('the same for a natural 1', () => {
    const one = { ...base, numberValue: 1, isCrit1: true };
    const { container, rerender } = render(<Dice dice={one} {...props} isRolling />);
    expect(die(container).className).not.toMatch(/crit1/);
    rerender(<Dice dice={one} {...props} isRolling={false} />);
    expect(die(container).className).toMatch(/crit1/);
  });

  it('a held die that sat out the roll keeps its glow', () => {
    const { container } = render(<Dice dice={{ ...base, isCrit20: true, held: true }} {...props} isRolling />);
    expect(die(container).className).toMatch(/crit20/);
  });
});
