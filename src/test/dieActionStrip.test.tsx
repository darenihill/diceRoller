import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DieActionStrip } from '../components/DieActionStrip';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

const die: DiceData = { id: 'd1', numberValue: 4, faces: 6, customFaces: [], color: '#6750A4', held: true };

describe('Buttons for a tapped die with many dice out', () => {
  it('names the die and runs each action from a labelled button', () => {
    const fns = { onRollOne: vi.fn(), onToggleHold: vi.fn(), onClone: vi.fn(), onOpenSettings: vi.fn(), onRemove: vi.fn() };
    render(<DieActionStrip die={die} rpgMode={false} {...fns} />);
    expect(screen.getByRole('group', { name: 'Actions for d6' })).toHaveTextContent('d6 showing 4, held');
    // A held die can't be rolled on its own until it is released (owner, 2026-11-05)
    expect(screen.getByRole('button', { name: 'Roll one' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Release' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(fns.onRollOne).not.toHaveBeenCalled();
    expect(fns.onToggleHold).toHaveBeenCalledWith('d1');
    expect(fns.onClone).toHaveBeenCalledWith(die);
    expect(fns.onOpenSettings).toHaveBeenCalledWith('d1');
    expect(fns.onRemove).toHaveBeenCalledWith('d1');
  });

  it('rolls a die that is not held', () => {
    const onRollOne = vi.fn();
    render(<DieActionStrip die={{ ...die, held: false }} rpgMode={false} onRollOne={onRollOne} onToggleHold={vi.fn()} onClone={vi.fn()} onOpenSettings={vi.fn()} onRemove={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll one' }));
    expect(onRollOne).toHaveBeenCalledWith('d1');
  });

  it('keeps the buttons round the die when dice are big, and drops them when compact', () => {
    const props = { dice: die, isRolling: false, isRevealed: true, onReveal: () => {}, onToggleHold: () => {}, onRemove: () => {}, onOpenSettings: () => {}, onClone: () => {}, onRollOne: () => {} };
    const { rerender } = render(<Dice {...props} />);
    expect(screen.getByTitle('Die settings')).toBeInTheDocument();
    rerender(<Dice {...props} compactActions />);
    expect(screen.queryByTitle('Die settings')).toBeNull();
    expect(screen.queryByTitle('Remove this die')).toBeNull();
  });
});

describe('Where and when the strip shows (owner, 2026-11-10)', () => {
  it('starts at a smaller die size than before', async () => {
    const { COMPACT_DIE_SIZE } = await import('../utils/constants');
    expect(COMPACT_DIE_SIZE).toBe(120);
  });

  it('always comes up from the bottom edge over the Roll button, never jumping to the top', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/components/DieActionStrip.module.css', 'utf8');
    expect(css).not.toMatch(/\.strip\.top/);
    expect(css).not.toMatch(/\btop:/);
    // A sheet from the bottom edge, over the Roll button, with a handle (owner, 2026-11-10)
    expect(css).toMatch(/\.strip {[^}]*bottom: 0;[^}]*z-index: 101;/);
    expect(css).toMatch(/\.strip::before/);
    // No 5-second timer for the sheet: it stays until you tap away
    expect(readFileSync('src/App.tsx', 'utf8')).toMatch(/const timer = compactDieActions \? undefined : setTimeout/);
    render(<DieActionStrip die={die} rpgMode={false} onToggleHold={vi.fn()} onClone={vi.fn()} onOpenSettings={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Actions for d6' }).className).not.toMatch(/top/);
  });
});
