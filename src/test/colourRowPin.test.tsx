import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import type { DiceData } from '../types';

const d: DiceData = { id: 'd1', numberValue: 1, faces: 3, customFaces: ['YES', 'NO', 'MAYBE'], color: '#6750A4', held: false };

describe('Colour row pinning in Dice settings', () => {
  it('sits in the list on open and pins after a face is tapped', () => {
    render(<DiceSettingsModal dice={d} isOpen onClose={() => {}} onUpdate={() => {}} onRemove={() => {}} onClone={() => {}} allDice={[d]} />);
    const row = screen.getByRole('group', { name: 'Colour for face 1' });
    expect(row).toHaveAttribute('data-pinned', 'false');
    fireEvent.click(screen.getByRole('button', { name: /^Face 2:/ }));
    expect(screen.getByRole('group', { name: 'Colour for face 2' })).toHaveAttribute('data-pinned', 'true');
  });
});
