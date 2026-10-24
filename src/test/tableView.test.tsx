import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from '../App';
import { needsUnderline, tableMath, tableTiles } from '../utils/tableView';
import { ROLL_DURATION_MS } from '../utils/constants';
import type { DiceData } from '../types';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const die = (over: Partial<DiceData>): DiceData => ({
  id: Math.random().toString(36).slice(2), numberValue: 1, faces: 6, currentFaceIndex: 0,
  name: '', customFaces: [], color: '#E9EAEC', held: false, ...over,
});

describe('Table view helpers', () => {
  it('underlines 6 and 9 and numbers that flip into another number, not 8', () => {
    expect(needsUnderline('6')).toBe(true);
    expect(needsUnderline('9')).toBe(true);
    expect(needsUnderline('16')).toBe(true);
    expect(needsUnderline('8')).toBe(false);
    expect(needsUnderline('69')).toBe(false); // reads 69 either way
    expect(needsUnderline('7')).toBe(false);
    expect(needsUnderline('Star')).toBe(false);
  });

  it('writes the math from the dice, then the modifier', () => {
    const tiles = tableTiles([die({ numberValue: 4 }), die({ numberValue: 3 })]);
    expect(tableMath(tiles, 0)).toBe('4 + 3');
    expect(tableMath(tiles, 2)).toBe('4 + 3 + 2');
    expect(tableMath(tiles, -2)).toBe('4 + 3 − 2');
    expect(tableMath(tableTiles([die({ numberValue: 5 })]), 0)).toBeNull();
  });

  it('leaves a dropped die out of the math', () => {
    const tiles = tableTiles([die({ numberValue: 4 }), die({ numberValue: 2, dropped: true }), die({ numberValue: 5 })]);
    expect(tableMath(tiles, 0)).toBe('4 + 5');
  });

  it('shows a custom face as its text', () => {
    const [tile] = tableTiles([die({ faces: 2, customFaces: ['Heads', 'Tails:val:1'], currentFaceIndex: 1 })]);
    expect(tile.text).toBe('Tails');
    expect(tile.value).toBe(1);
  });
});

describe('Table view switch and big total', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  const openMenu = () => fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
  const roll = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
  };

  it('is off by default, turns on from the menu and stays on after a reload', () => {
    const { unmount } = render(<App />);
    openMenu();
    const toggle = screen.getByRole('button', { name: 'Table view' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    unmount();
    render(<App />);
    openMenu();
    expect(screen.getByRole('button', { name: 'Table view' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a roll big with its math and a flipped copy; tapping it shows the dice; the next roll is big again', () => {
    localStorage.setItem('tableView', 'true');
    render(<App />);
    expect(screen.queryByTestId('table-view')).toBeNull();
    roll();
    const view = screen.getByTestId('table-view');
    const big = within(view).getByRole('button', { name: /^Total \d+\. Show the dice$/ });
    const total = big.textContent!;
    // Two dice: the math adds them up to the total, and the flipped copy repeats it
    const math = view.querySelector('p')!.textContent!;
    expect(math.split(' + ').map(Number).reduce((a, b) => a + b, 0)).toBe(Number(total));
    const flipped = view.querySelector('[aria-hidden="true"]')!;
    expect(flipped.textContent).toBe(`${total}${math}`);
    expect(within(view).getAllByRole('listitem')).toHaveLength(2);

    fireEvent.click(big);
    expect(screen.queryByTestId('table-view')).toBeNull();
    roll();
    expect(screen.getByTestId('table-view')).toBeInTheDocument();
  });

  it('keeps the dice view when it is off', () => {
    render(<App />);
    roll();
    expect(screen.queryByTestId('table-view')).toBeNull();
  });
});
