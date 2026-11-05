import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import type { DiceData } from '../types';

const d: DiceData = { id: 'd1', numberValue: 1, faces: 3, customFaces: ['YES', 'NO', 'MAYBE'], color: '#6750A4', held: false };

describe('Color row pinning in Dice settings', () => {
  it('sits in the list when opened by its button and pins after a face is tapped', () => {
    render(<DiceSettingsModal dice={d} isOpen onClose={() => {}} onUpdate={() => {}} onRemove={() => {}} onClone={() => {}} allDice={[d]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Color' }));
    // The color picker is the group; the row around it is what pins
    const row = screen.getByRole('group', { name: 'Color for face 1' }).closest('[data-pinned]');
    expect(row).toHaveAttribute('data-pinned', 'false');
    fireEvent.click(screen.getByRole('button', { name: /^Face 2:/ }));
    expect(screen.getByRole('group', { name: 'Color for face 2' }).closest('[data-pinned]')).toHaveAttribute('data-pinned', 'true');
  });
});
