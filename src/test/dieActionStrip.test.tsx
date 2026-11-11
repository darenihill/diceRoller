import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createEvent, act } from '@testing-library/react';
import { DieActionStrip, SHEET_EXIT_MS } from '../components/DieActionStrip';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

const die: DiceData = { id: 'd1', numberValue: 4, faces: 6, customFaces: [], color: '#6750A4', held: true };

describe('Buttons for a tapped die with many dice out', () => {
  it('names the die and runs each action from a labelled button', () => {
    const fns = { onRollOne: vi.fn(), onToggleHold: vi.fn(), onClone: vi.fn(), onOpenSettings: vi.fn(), onRemove: vi.fn() };
    render(<DieActionStrip die={die} rpgMode={false} {...fns} />);
    expect(screen.getByRole('group', { name: 'Actions for d6' })).toHaveTextContent('d6 showing 4, held');
    // A held die can't be rolled on its own until it is released (owner, 2026-11-05)
    expect(screen.getByRole('button', { name: 'Roll one' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Release' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(fns.onRollOne).not.toHaveBeenCalled();
    expect(fns.onToggleHold).toHaveBeenCalledWith('d1');
    expect(fns.onClone).toHaveBeenCalledWith(die);
    expect(fns.onOpenSettings).toHaveBeenCalledWith('d1');
    expect(fns.onRemove).toHaveBeenCalledWith('d1');
  });

  it('rolls a die that is not held', () => {
    const onRollOne = vi.fn();
    render(<DieActionStrip die={{ ...die, held: false }} rpgMode={false} onRollOne={onRollOne} onToggleHold={vi.fn()} onClone={vi.fn()} onOpenSettings={vi.fn()} onRemove={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll one' }));
    expect(onRollOne).toHaveBeenCalledWith('d1');
  });

  it('keeps the buttons round the die when dice are big, and drops them when compact', () => {
    const props = { dice: die, isRolling: false, isRevealed: true, onReveal: () => {}, onToggleHold: () => {}, onRemove: () => {}, onOpenSettings: () => {}, onClone: () => {}, onRollOne: () => {} };
    const { rerender } = render(<Dice {...props} />);
    expect(screen.getByTitle('Die settings')).toBeInTheDocument();
    rerender(<Dice {...props} compactActions />);
    expect(screen.queryByTitle('Die settings')).toBeNull();
    expect(screen.queryByTitle('Remove this die')).toBeNull();
  });
});

describe('Where and when the strip shows (owner, 2026-11-10)', () => {
  it('starts at a smaller die size than before', async () => {
    const { COMPACT_DIE_SIZE } = await import('../utils/constants');
    expect(COMPACT_DIE_SIZE).toBe(120);
  });

  it('always comes up from the bottom edge over the Roll button, never jumping to the top', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/components/DieActionStrip.module.css', 'utf8');
    expect(css).not.toMatch(/\.strip\.top/);
    expect(css).not.toMatch(/\btop:/);
    // A sheet from the bottom edge, over the Roll button, with a handle (owner, 2026-11-10)
    expect(css).toMatch(/\.strip {[^}]*bottom: 0;[^}]*z-index: 101;/);
    expect(css).toMatch(/\.strip::before/);
    // No 5-second timer for the sheet: it stays until you tap away
    expect(readFileSync('src/App.tsx', 'utf8')).toMatch(/const timer = compactDieActions \? undefined : setTimeout/);
    // A keyboard closes it with Escape or by moving on (second read, 2026-11-10)
    expect(readFileSync('src/App.tsx', 'utf8')).toMatch(/e\.key === 'Escape'\) setRevealedDiceId\(null\)/);
    expect(readFileSync('src/App.tsx', 'utf8')).toMatch(/addEventListener\('focusin', handleFocus\)/);
    render(<DieActionStrip die={die} rpgMode={false} onToggleHold={vi.fn()} onClone={vi.fn()} onOpenSettings={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Actions for d6' }).className).not.toMatch(/top/);
  });
});

describe('Swiping the sheet down closes it (owner, 2026-11-10)', () => {
  // jsdom's pointer events drop clientX/Y and pointerId, so set them by hand
  const ptr = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', el: Element, x: number, y: number) => {
    const ev = createEvent[type](el);
    Object.assign(ev, { clientX: x, clientY: y, pointerId: 1 });
    fireEvent(el, ev);
  };
  const sheet = (onClose: () => void, onRemove = vi.fn()) => {
    render(<DieActionStrip die={die} rpgMode={false} onToggleHold={vi.fn()} onClone={vi.fn()} onOpenSettings={vi.fn()} onRemove={onRemove} onClose={onClose} />);
    return screen.getByRole('group', { name: 'Actions for d6' });
  };

  it('a swipe down past the line slides it away and closes it; a short slow one springs back', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const el = sheet(onClose);
    ptr('pointerDown', el, 100, 100);
    act(() => { vi.advanceTimersByTime(300); });
    ptr('pointerMove', el, 100, 130);
    act(() => { vi.advanceTimersByTime(200); });
    ptr('pointerUp', el, 100, 130);
    expect(onClose).not.toHaveBeenCalled();
    expect(el.style.translate).toBe('');
    ptr('pointerDown', el, 100, 100);
    act(() => { vi.advanceTimersByTime(300); });
    ptr('pointerMove', el, 100, 200);
    act(() => { vi.advanceTimersByTime(30); });
    ptr('pointerUp', el, 100, 200);
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('a quick flick down closes it even when short', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const el = sheet(onClose);
    ptr('pointerDown', el, 100, 100);
    act(() => { vi.advanceTimersByTime(16); });
    ptr('pointerMove', el, 100, 115);
    act(() => { vi.advanceTimersByTime(16); });
    ptr('pointerMove', el, 100, 145);
    ptr('pointerUp', el, 100, 145);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('sideways or upward moves are not a swipe, and a swipe that starts on Remove does not remove', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const onRemove = vi.fn();
    const el = sheet(onClose, onRemove);
    ptr('pointerDown', el, 100, 100);
    ptr('pointerMove', el, 200, 110);
    ptr('pointerMove', el, 100, 20);
    ptr('pointerUp', el, 100, 20);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).not.toHaveBeenCalled();
    const remove = screen.getByRole('button', { name: 'Remove' });
    ptr('pointerDown', remove, 100, 100);
    act(() => { vi.advanceTimersByTime(300); });
    ptr('pointerMove', remove, 100, 130);
    act(() => { vi.advanceTimersByTime(200); });
    ptr('pointerUp', remove, 100, 130);
    fireEvent.click(remove);
    expect(onRemove).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
