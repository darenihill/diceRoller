import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { ActionBar } from '../components/ActionBar';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

const props = {
  onAdd: () => {}, onRoll: () => {}, onHoldAll: () => {}, allHeld: false, totalVisible: true,
  lastTotal: 8, modifier: 0, onChangeModifier: () => {}, rpgMode: false, rollAdvantage: 'normal' as const, onChangeRollAdvantage: () => {},
};
const pops = () => Number(screen.getAllByRole('button', { name: /roll again$/ })[0].querySelector('[data-pops]')?.getAttribute('data-pops') ?? 0);

describe('The total pops when the dice land', () => {
  it('pops once per newly landed roll, never while tumbling', () => {
    const { rerender } = render(<ActionBar {...props} />);
    rerender(<ActionBar {...props} totalKey="r1" rolling />);
    expect(pops()).toBe(0);
    rerender(<ActionBar {...props} totalKey="r1" />);
    expect(pops()).toBe(1);
    rerender(<ActionBar {...props} lastTotal={11} totalKey="r2" />);
    expect(pops()).toBe(2);
  });

  it('a single-die roll or Undo back to an older roll does not pop', () => {
    const { rerender } = render(<ActionBar {...props} />);
    rerender(<ActionBar {...props} totalKey="r1" />);
    rerender(<ActionBar {...props} totalKey="r2" />);
    expect(pops()).toBe(2);
    rerender(<ActionBar {...props} totalKey="r2" rolling />);
    rerender(<ActionBar {...props} totalKey="r2" />);
    rerender(<ActionBar {...props} totalKey="r1" />);
    expect(pops()).toBe(2);
  });

  it('in the app, Roll only on one die leaves the total still', () => {
    vi.useFakeTimers();
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      { id: 'a', numberValue: 1, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false },
      { id: 'b', numberValue: 1, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#00ff00', held: false }
    ] } }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Roll dice/ }));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(pops()).toBe(1);
    fireEvent.click(screen.getAllByRole('button', { name: /^Roll only/ })[0]);
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(pops()).toBe(1);
  });
});
