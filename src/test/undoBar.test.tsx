import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { UndoBar } from '../components/UndoBar';

const offer = (big = false) => ({ message: 'Removed d20', undo: () => {}, back: 'd20 is back', big, key: 1 });
const props = { windowMs: 7000, paused: false, onUndo: () => {}, onDismiss: () => {}, onPause: () => {}, onResume: () => {} };
const css = readFileSync('src/components/UndoBar.module.css', 'utf8');
// jsdom's pointer events drop clientX and pointerId, so set them by hand
const ptr = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', el: Element, x: number, y: number, id: number) => {
  const ev = createEvent[type](el);
  Object.assign(ev, { clientX: x, clientY: y, pointerId: id });
  fireEvent(el, ev);
};

describe('The Undo bar follows the standard', () => {
  it('says what happened, then a filled Undo pill with its arrow, then ×', () => {
    const onDismiss = vi.fn();
    render(<UndoBar offer={offer()} {...props} onDismiss={onDismiss} />);
    const bar = screen.getByTestId('undo-bar');
    expect(bar).toHaveTextContent('Removed d20');
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo.querySelector('svg')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('a big change has × too, so it is always there (owner, 2026-11-10)', () => {
    render(<UndoBar offer={offer(true)} {...props} />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('a sideways swipe past the line dismisses; a short one springs back (owner, 2026-11-10)', () => {
    const onDismiss = vi.fn();
    render(<UndoBar offer={offer()} {...props} onDismiss={onDismiss} />);
    const bar = screen.getByTestId('undo-bar');
    ptr('pointerDown', bar, 100, 10, 1);
    ptr('pointerMove', bar, 140, 12, 1);
    ptr('pointerUp', bar, 140, 12, 1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(bar.style.translate).toBe('');
    ptr('pointerDown', bar, 100, 10, 2);
    ptr('pointerMove', bar, 220, 14, 2);
    ptr('pointerUp', bar, 220, 14, 2);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('an up-and-down drag is a scroll, not a swipe', () => {
    const onDismiss = vi.fn();
    render(<UndoBar offer={offer()} {...props} onDismiss={onDismiss} />);
    const bar = screen.getByTestId('undo-bar');
    ptr('pointerDown', bar, 100, 10, 1);
    ptr('pointerMove', bar, 130, 120, 1);
    ptr('pointerUp', bar, 200, 140, 1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('the countdown runs for the whole window and stops while touched', () => {
    const onPause = vi.fn();
    const { container, rerender } = render(<UndoBar offer={offer()} {...props} onPause={onPause} />);
    const line = container.querySelector('path') as SVGPathElement;
    expect(line.style.animationDuration).toBe('7000ms');
    fireEvent.pointerDown(screen.getByTestId('undo-bar'));
    expect(onPause).toHaveBeenCalled();
    rerender(<UndoBar offer={offer()} {...props} paused />);
    expect((container.querySelector('path') as SVGPathElement).style.animationPlayState).toBe('paused');
  });

  it('the line hugs the outside of the pill and drains clockwise from the top middle, 2px on a phone and 3px on a computer, with no track', () => {
    // A path from the top middle; one whole-line dash whose start slides clockwise to the end
    expect(css).toMatch(/stroke-dasharray:\s*1px 1px/);
    expect(css).toMatch(/from\s*{\s*stroke-dashoffset:\s*0px;\s*}/);
    expect(css).toMatch(/to\s*{\s*stroke-dashoffset:\s*-1px;\s*}/);
    expect(css).toMatch(/--line:\s*2px/);
    expect(css).toMatch(/@media \(min-width: 769px\)\s*{\s*\.undo\s*{\s*--line:\s*3px/);
    expect(css).toMatch(/stroke:\s*var\(--md-sys-color-on-primary\)/);
    // Hugs the pill's outside edge (owner, 2026-11-10)
    expect(readFileSync('src/components/UndoBar.tsx', 'utf8')).toMatch(/const i = -\(lw \/ 2 \+ 2\);/);
  });
});
