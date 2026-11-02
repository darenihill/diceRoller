import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionBar } from '../components/ActionBar';

const props = {
  onAdd: () => {}, onRoll: () => {}, onHoldAll: () => {}, allHeld: false, totalVisible: true,
  lastTotal: 8, modifier: 0, onChangeModifier: () => {}, rpgMode: false, rollAdvantage: 'normal' as const, onChangeRollAdvantage: () => {},
};
const label = () => screen.getByRole('button', { name: /roll again$/ }).querySelector('[data-pop], span:last-child') as HTMLElement;

describe('The total pops when the dice land', () => {
  it('each landed roll gives the total a fresh pop', () => {
    const { rerender } = render(<ActionBar {...props} totalKey="r1" />);
    const first = label();
    expect(first).toHaveAttribute('data-pop', 'on');
    rerender(<ActionBar {...props} lastTotal={11} totalKey="r2" />);
    expect(label()).not.toBe(first);
    expect(label()).toHaveAttribute('data-pop', 'on');
  });

  it('no pop while the dice tumble, or under Reduce motion', async () => {
    render(<ActionBar {...props} />);
    expect(label()).not.toHaveAttribute('data-pop');
    vi.resetModules();
    vi.doMock('framer-motion', async () => ({ ...(await vi.importActual<object>('framer-motion')), useReducedMotion: () => true }));
    const { ActionBar: CalmBar } = await import('../components/ActionBar');
    render(<CalmBar {...props} totalKey="r3" />);
    expect(screen.getAllByRole('button', { name: /roll again$/ })[1].querySelector('[data-pop]')).toBeNull();
    vi.doUnmock('framer-motion');
  });
});
