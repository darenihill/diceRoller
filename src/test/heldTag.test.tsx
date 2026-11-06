import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    // The tag is the hold button now, pressed, so it reads "Hold d6, pressed"
    expect(screen.getByTestId('held-tag')).toHaveAttribute('aria-pressed', 'true');
  });

  // Owner, 2026-11-06: a tap anywhere held the die, which got in the way of
  // Settings and Roll this die on a phone. Only the lock holds now.
  it('a tap on the die shows its buttons but does not hold it', () => {
    const onToggleHold = vi.fn();
    const onReveal = vi.fn();
    render(<Dice dice={base} {...props} onToggleHold={onToggleHold} onReveal={onReveal} />);
    fireEvent.click(screen.getByRole('group'));
    expect(onReveal).toHaveBeenCalled();
    expect(onToggleHold).not.toHaveBeenCalled();
  });

  it('the lock button holds the die, and the HELD tag releases it', () => {
    const onToggleHold = vi.fn();
    const { rerender } = render(<Dice dice={base} {...props} onToggleHold={onToggleHold} />);
    const lock = screen.getByRole('button', { name: 'Hold d6' });
    expect(lock).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(lock);
    expect(onToggleHold).toHaveBeenCalledWith('d1');
    rerender(<Dice dice={{ ...base, held: true }} {...props} onToggleHold={onToggleHold} />);
    fireEvent.click(screen.getByTestId('held-tag'));
    expect(onToggleHold).toHaveBeenCalledTimes(2);
  });

  it('the lock and the tag are one button, so the lock can fly up into the tag', () => {
    const { rerender } = render(<Dice dice={base} {...props} />);
    expect(screen.getAllByRole('button', { name: /^Hold / })).toHaveLength(1);
    rerender(<Dice dice={{ ...base, held: true }} {...props} />);
    expect(screen.getAllByRole('button', { name: /^Hold / })).toHaveLength(1);
  });
});
