import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { ROLL_DURATION_MS } from '../utils/constants';
import { arrangeDice, lowToHigh } from '../utils/sortDice';
import type { DiceData } from '../types';

// Sort dice after each roll (owner, 2026-11-06): a Customize switch, off by
// default and kept on this device; it moves only where the dice sit.

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const die = (id: string, numberValue: number): DiceData =>
  ({ id, numberValue, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false });

// Each die rolls the next number in the queue, in list order (a, b, c)
let queue: number[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
    die('a', 2), die('b', 4), die('c', 5),
  ] } }));
  vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(arr: T) => {
    const face = queue.length ? queue.shift()! : 1;
    (arr as unknown as Uint32Array)[0] = Math.floor(2 ** 32 / 6) * (face - 1);
    return arr;
  });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

// Loading gives the dice fresh ids, so name them a, b, c by their place in the saved list
const sitting = () => {
  const names = new Map<string, string>(savedOrder().map((id: string, i: number) => [id, 'abc'[i]]));
  return [...document.querySelectorAll('[data-dice-id]')].map(el => names.get(el.getAttribute('data-dice-id') ?? ''));
};
const shown = () => screen.getAllByLabelText(/^d6 showing/).map(el => Number(/showing (\d+)/.exec(el.getAttribute('aria-label') ?? '')?.[1]));
const roll = (...faces: number[]) => {
  queue = faces;
  fireEvent.click(screen.getByRole('button', { name: /^Roll dice|roll again$/ }));
  act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
};
const switchSort = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  fireEvent.click(screen.getByText('Customize'));
  fireEvent.click(screen.getByRole('button', { name: 'Sort dice' }));
};
// The dice list is written out when the page is hidden
const savedList = (): DiceData[] => {
  act(() => { window.dispatchEvent(new Event('pagehide')); });
  return JSON.parse(localStorage.getItem('diceConfigs') ?? '{}').systemAutosave?.config ?? [];
};
const savedOrder = () => savedList().map(d => d.id);

describe('Sort dice after each roll', () => {
  it('is off by default: the dice keep the order they were added', () => {
    render(<App />);
    roll(6, 1, 3);
    expect(sitting()).toEqual(['a', 'b', 'c']);
    expect(shown()).toEqual([6, 1, 3]);
  });

  it('when on, the dice take low-to-high places each time they land, and the switch stays on', () => {
    const { unmount } = render(<App />);
    switchSort();
    expect(screen.getByRole('button', { name: 'Sort dice' })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('sortDice')).toBe('true');
    roll(6, 1, 3);
    expect(sitting()).toEqual(['b', 'c', 'a']);
    expect(shown()).toEqual([1, 3, 6]);
    roll(2, 5, 4);
    expect(sitting()).toEqual(['a', 'c', 'b']);
    expect(shown()).toEqual([2, 4, 5]);
    unmount();
    render(<App />);
    expect(screen.getAllByLabelText(/^d6 showing/)).toHaveLength(3);
    expect(shown()).toEqual([2, 4, 5]);
  });

  it('changes only where they sit: the rolls, History and the saved order stay the same', () => {
    render(<App />);
    switchSort();
    roll(6, 1, 3);
    const history = JSON.parse(localStorage.getItem('rollHistory') ?? '[]');
    expect(history[0].total).toBe(10);
    expect(history[0].details).toEqual(['d6 #1: 6', 'd6 #2: 1', 'd6 #3: 3']);
    // The saved list keeps the order the dice were added: a 6, then 1, then 3
    expect(savedList().map(d => d.numberValue)).toEqual([6, 1, 3]);
  });

  it('turning it off puts the dice back in their own order', () => {
    render(<App />);
    switchSort();
    roll(6, 1, 3);
    expect(sitting()).toEqual(['b', 'c', 'a']);
    fireEvent.click(screen.getByRole('button', { name: 'Sort dice' }));
    expect(localStorage.getItem('sortDice')).toBe('false');
    expect(sitting()).toEqual(['a', 'b', 'c']);
  });
});

describe('Sort helpers', () => {
  it('equal rolls keep their own order', () => {
    expect(lowToHigh([die('x', 3), die('y', 1), die('z', 3), die('w', 1)])).toEqual(['y', 'w', 'x', 'z']);
  });

  it('a die added after the last landing waits at the end until the next roll', () => {
    const list = [die('a', 5), die('b', 1), die('new', 1)];
    expect(arrangeDice(list, ['b', 'a']).map(d => d.id)).toEqual(['b', 'a', 'new']);
    // A removed die simply drops out
    expect(arrangeDice([die('a', 5)], ['b', 'a']).map(d => d.id)).toEqual(['a']);
  });
});
