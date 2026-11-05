import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import { Dice } from '../components/Dice';
import { faceParts, joinFace, faceLabel, faceNumericValue, sanitizeDiceList } from '../utils/diceUtils';
import type { DiceData } from '../types';

const die: DiceData = { id: 'd1', numberValue: 1, faces: 2, customFaces: [':icon:Sword:bg:#E32227', 'Test'], color: '#6750A4', held: false };
const props = { isOpen: true, onClose: () => {}, onRemove: () => {}, onClone: () => {} };

describe('A face can hold a color, an icon and words together (owner, 2026-11-05)', () => {
  it('splits and joins a face', () => {
    expect(faceParts(':icon:Sword:text:Attack')).toEqual({ icon: 'Sword', text: 'Attack' });
    expect(faceParts(':icon:Sword')).toEqual({ icon: 'Sword', text: '' });
    expect(faceParts('Attack')).toEqual({ text: 'Attack' });
    expect(joinFace('Sword', 'Attack')).toBe(':icon:Sword:text:Attack');
    expect(joinFace('Sword', '')).toBe(':icon:Sword');
    expect(joinFace(undefined, 'Attack')).toBe('Attack');
    expect(faceLabel(':icon:Sword:text:Attack')).toBe('Attack');
    expect(faceLabel(':icon:Sword')).toBe('Sword');
    // Still counts as 0 unless a number is set, like any icon face
    expect(faceNumericValue(':icon:Sword:text:3')).toBe(0);
    expect(faceNumericValue(':icon:Sword:text:Hit:val:2')).toBe(2);
    // Survives a share link or backup with its color and number
    expect(sanitizeDiceList([{ ...die, customFaces: [':icon:Sword:text:Attack:bg:#E32227:val:2'] }])[0].customFaces[0]).toBe(':icon:Sword:text:Attack:bg:#E32227:val:2');
  });

  it('a tapped icon face takes words from Text, keeping its icon and color', () => {
    const onUpdate = vi.fn();
    render(<DiceSettingsModal dice={die} allDice={[die]} onUpdate={onUpdate} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    fireEvent.click(screen.getByRole('button', { name: /^Face 1:/ }));
    // Text stays open, now changing face 1
    fireEvent.change(screen.getByLabelText('Words on face 1'), { target: { value: 'Attack' } });
    expect(onUpdate).toHaveBeenLastCalledWith('d1', { customFaces: [':icon:Sword:text:Attack:bg:#E32227', 'Test'] });
  });

  it('a tapped word face takes an icon from Icons, and the same icon again takes it off', () => {
    const onUpdate = vi.fn();
    render(<DiceSettingsModal dice={die} allDice={[die]} onUpdate={onUpdate} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
    fireEvent.click(screen.getByRole('button', { name: /^Face 2:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Shield on face 2' }));
    expect(onUpdate).toHaveBeenLastCalledWith('d1', { customFaces: [':icon:Sword:bg:#E32227', ':icon:Shield:text:Test'] });
    // An icon-only face keeps its icon: it would have nothing left to show
    onUpdate.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /^Face 1:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sword on face 1' }));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('"Add a new face instead" goes back to adding', () => {
    render(<DiceSettingsModal dice={die} allDice={[die]} onUpdate={() => {}} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    fireEvent.click(screen.getByRole('button', { name: /^Face 1:/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a new face instead' }));
    expect(screen.getByLabelText('Custom face text')).toBeInTheDocument();
  });

  it('the die shows the icon with the words under it', () => {
    const d: DiceData = { ...die, customFaces: [':icon:Sword:text:Attack'], currentFaceIndex: 0 };
    const { container } = render(<Dice dice={d} isRolling={false} isRevealed={false} onReveal={() => {}} onToggleHold={() => {}} onRemove={() => {}} onOpenSettings={() => {}} onClone={() => {}} />);
    expect(container.querySelector('svg.lucide-sword')).not.toBeNull();
    expect(container).toHaveTextContent('Attack');
  });
});
