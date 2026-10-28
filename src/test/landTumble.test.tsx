import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
    { id: 'a', numberValue: 1, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false },
    { id: 'b', numberValue: 1, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#00ff00', held: false }
  ] } }));
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

const history = () => JSON.parse(localStorage.getItem('rollHistory') ?? '[]') as { total: number }[];
const tapRoll = () => fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const shownTotal = () => screen.getAllByLabelText(/^d6 showing/)
  .reduce((sum, el) => sum + Number(/showing (\d+)/.exec(el.getAttribute('aria-label') ?? '')?.[1] ?? 0), 0);

describe('Tapping Roll while the dice tumble', () => {
  it('lands the dice at once with one History entry', () => {
    render(<App />);
    tapRoll();
    wait(200);
    expect(history()).toHaveLength(0);
    tapRoll();
    // Landed straight away, not after the rest of the tumble
    expect(history()).toHaveLength(1);
    expect(history()[0].total).toBe(shownTotal());
    // Nothing more arrives when the first roll's time would have ended
    wait(ROLL_DURATION_MS + 50);
    expect(history()).toHaveLength(1);
  });

  it('keeps the result picked when the roll started', () => {
    const random = vi.spyOn(Math, 'random');
    random.mockReturnValue(0.99); // the roll picks 6 and 6
    render(<App />);
    tapRoll();
    random.mockReturnValue(0); // a second roll would pick 1 and 1
    wait(100);
    tapRoll();
    expect(history()[0].total).toBe(12);
    random.mockRestore();
  });

  it('without a second tap, the roll lasts the usual tumble', () => {
    render(<App />);
    tapRoll();
    wait(ROLL_DURATION_MS - 50);
    expect(history()).toHaveLength(0);
    wait(100);
    expect(history()).toHaveLength(1);
  });

  it('a tap after the dice land starts a new roll', () => {
    render(<App />);
    tapRoll();
    wait(100);
    tapRoll();
    tapRoll();
    wait(ROLL_DURATION_MS + 50);
    expect(history()).toHaveLength(2);
  });
});
