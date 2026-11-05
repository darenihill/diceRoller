import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

// Owner's pick, 2026-11-03: a held die lifts and a gold HELD tag drops onto it
const base: DiceData = { id: 'd1', numberValue: 4, faces: 6, customFaces: [], color: '#E9EAEC', held: false };
const props = { isRolling: false, isRevealed: false, onReveal: () => {}, onToggleHold: () => {}, onRemove: () => {}, onOpenSettings: () => {} };

describe('Held die: lift and tag', () => {
  it('a held die wears the HELD tag; a loose one does not', () => {
    const { rerender } = render(<Dice dice={base} {...props} />);
    expect(screen.queryByTestId('held-tag')).toBeNull();
    rerender(<Dice dice={{ ...base, held: true }} {...props} />);
    expect(screen.getByTestId('held-tag')).toHaveTextContent('HELD');
    rerender(<Dice dice={base} {...props} />);
    expect(screen.queryByTestId('held-tag')).toBeNull();
  });

  it('a die that loads already held shows the tag in place, with nothing hidden', () => {
    render(<Dice dice={{ ...base, held: true }} {...props} />);
    const tag = screen.getByTestId('held-tag');
    expect(tag.style.opacity).not.toBe('0');
  });

  it('screen readers still hear "held" from the die itself', () => {
    render(<Dice dice={{ ...base, held: true }} {...props} />);
    expect(screen.getByRole('group')).toHaveAccessibleName(/held/);
    expect(screen.getByTestId('held-tag')).toHaveAttribute('aria-hidden', 'true');
  });
});
