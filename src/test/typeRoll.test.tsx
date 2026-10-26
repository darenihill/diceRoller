import React from 'react';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import App from '../App';
import { parseRollNotation } from '../utils/rollNotation';
import { useDiceState } from '../hooks/useDiceState';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

const ok = (s: string) => {
  const r = parseRollNotation(s);
  if (!r.ok) throw new Error(`expected ${s} to parse, got: ${r.note}`);
  return r.roll;
};
const note = (s: string) => {
  const r = parseRollNotation(s);
  if (r.ok) throw new Error(`expected ${s} to be refused`);
  return r.note;
};

describe('Reading a typed roll', () => {
  it('reads dice with a plus', () => {
    expect(ok('2d6+3')).toMatchObject({ groups: [{ count: 2, faces: 6 }], modifier: 3, advantage: 'normal', text: '2d6+3' });
  });

  it('reads a lone die and a minus, including the phone minus sign', () => {
    expect(ok('d20')).toMatchObject({ groups: [{ count: 1, faces: 20 }], modifier: 0 });
    expect(ok('1d20-1').modifier).toBe(-1);
    expect(ok('1d20 − 2').modifier).toBe(-2);
  });

  it('reads mixed dice and spaces', () => {
    expect(ok(' 1d8 + 2d6 ').groups).toEqual([{ count: 1, faces: 8 }, { count: 2, faces: 6 }]);
    expect(ok('1D8+2D6').text).toBe('1d8+2d6');
  });

  it('reads advantage as two d20 and disadvantage the same way', () => {
    expect(ok('d20 adv')).toMatchObject({ groups: [{ count: 2, faces: 20 }], advantage: 'advantage', text: 'd20 adv' });
    expect(ok('d20+5 disadvantage')).toMatchObject({ groups: [{ count: 2, faces: 20 }], modifier: 5, advantage: 'disadvantage', text: 'd20+5 dis' });
  });

  it('gives a short note for typos and out-of-range rolls', () => {
    expect(note('')).toMatch(/Type a roll/);
    expect(note('2x6')).toMatch(/2d6\+3/);
    expect(note('5')).toMatch(/Add some dice/);
    expect(note('2d1')).toMatch(/2 to 1000 sides/);
    expect(note('60d6')).toMatch(/most is 50/);
    expect(note('1d8+2d6 adv')).toMatch(/one kind of die/);
    expect(note('d20-d4')).toMatch(/added/);
  });
});

describe('Rolling a typed roll', () => {
  it('rolls the typed dice and modifier at once and keeps the typed text in history', () => {
    vi.useFakeTimers();
    localStorage.setItem('rpgMode', 'true');
    const { result } = renderHook(() => useDiceState());
    const dice = [6, 6].map((faces, i) => ({ id: `t${i}`, numberValue: 1, faces, currentFaceIndex: 0, name: 'd6', customFaces: [], color: '#384050', held: false }));
    act(() => result.current.rollDice(undefined, undefined, { text: '2d6+3', dice, modifier: 3, advantage: 'normal' }));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS); });
    const entry = result.current.rollHistory[0];
    expect(entry.typed).toBe('2d6+3');
    expect(entry.modifier).toBe(3);
    expect(result.current.diceList).toHaveLength(2);
    const diceSum = result.current.diceList.reduce((n, d) => n + d.numberValue, 0);
    expect(entry.total).toBe(diceSum + 3);
  });
});

describe('Type a roll box', () => {
  it('shows only in RPG mode', () => {
    render(<App />);
    expect(screen.queryByRole('textbox', { name: /Type a roll/ })).toBeNull();
  });

  it('typing 2d6+3 puts out two d6 with +3 and rolls once; Undo brings the old dice back', () => {
    vi.useFakeTimers();
    localStorage.setItem('rpgMode', 'true');
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      { id: 'a', numberValue: 1, faces: 4, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false }
    ] } }));
    render(<App />);
    const box = screen.getByRole('textbox', { name: /Type a roll/ });
    fireEvent.change(box, { target: { value: '2d6+3' } });
    fireEvent.submit(box.closest('form')!);
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });

    const history = JSON.parse(localStorage.getItem('rollHistory') ?? '[]');
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ typed: '2d6+3', modifier: 3 });
    expect(screen.getAllByLabelText(/^d6 showing/)).toHaveLength(2);
    expect(screen.queryAllByLabelText(/^d4 showing/)).toHaveLength(0);
    expect(screen.getByRole('button', { name: /Reset modifier/i })).toBeEnabled();
    expect(screen.getByText('Rolled 2d6+3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getAllByLabelText(/^d4 showing/)).toHaveLength(1);
    expect(screen.queryAllByLabelText(/^d6 showing/)).toHaveLength(0);
    expect(screen.getByRole('button', { name: /Reset modifier/i })).toBeDisabled();
  });

  it('says what it could not read and does not roll', () => {
    localStorage.setItem('rpgMode', 'true');
    render(<App />);
    const box = screen.getByRole('textbox', { name: /Type a roll/ });
    fireEvent.change(box, { target: { value: '2x6' } });
    fireEvent.submit(box.closest('form')!);
    expect(screen.getByText(/can't read/)).toBeInTheDocument();
    expect(box).toHaveAttribute('aria-invalid', 'true');
  });
});
