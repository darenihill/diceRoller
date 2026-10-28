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
    fireEvent.click(screen.getByRole('button', { name: 'Roll one' }));
    fireEvent.click(screen.getByRole('button', { name: 'Release' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(fns.onRollOne).toHaveBeenCalledWith('d1');
    expect(fns.onToggleHold).toHaveBeenCalledWith('d1');
    expect(fns.onClone).toHaveBeenCalledWith(die);
    expect(fns.onOpenSettings).toHaveBeenCalledWith('d1');
    expect(fns.onRemove).toHaveBeenCalledWith('d1');
  });

  it('keeps the buttons round the die when dice are big, and drops them when compact', () => {
    const props = { dice: die, isRolling: false, isRevealed: true, onReveal: () => {}, onToggleHold: () => {}, onRemove: () => {}, onOpenSettings: () => {}, onClone: () => {}, onRollOne: () => {} };
    const { rerender } = render(<Dice {...props} />);
    expect(screen.getByTitle('Dice Settings')).toBeInTheDocument();
    rerender(<Dice {...props} compactActions />);
    expect(screen.queryByTitle('Dice Settings')).toBeNull();
    expect(screen.queryByTitle('Remove Die')).toBeNull();
  });
});
