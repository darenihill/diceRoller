import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => ({ ...(await vi.importActual<object>('framer-motion')), useReducedMotion: () => true }));
import { ActionBar } from '../components/ActionBar';

const props = {
  onAdd: () => {}, onRoll: () => {}, onHoldAll: () => {}, allHeld: false, totalVisible: true,
  lastTotal: 8, modifier: 0, onChangeModifier: () => {}, rpgMode: false, rollAdvantage: 'normal' as const, onChangeRollAdvantage: () => {},
};

describe('Reduce motion and the total', () => {
  it('keeps the total still when the dice land', () => {
    const { rerender } = render(<ActionBar {...props} />);
    rerender(<ActionBar {...props} totalKey="r1" />);
    expect(screen.getByRole('button', { name: /roll again$/ }).querySelector('[data-pops]')).toBeNull();
  });
});
