import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { UndoBar } from '../components/UndoBar';

const offer = (big = false) => ({ message: 'Removed d20', undo: () => {}, back: 'd20 is back', big, key: 1 });
const props = { windowMs: 7000, paused: false, onUndo: () => {}, onDismiss: () => {}, onPause: () => {}, onResume: () => {} };
const css = readFileSync('src/components/UndoBar.module.css', 'utf8');

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

  it('a big change has no ×', () => {
    render(<UndoBar offer={offer(true)} {...props} />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
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

  it('the line drains clockwise from the top middle, 2px on a phone and 3px on a computer, with no track', () => {
    // A path from the top middle; one whole-line dash whose start slides clockwise to the end
    expect(css).toMatch(/stroke-dasharray:\s*1px 1px/);
    expect(css).toMatch(/from\s*{\s*stroke-dashoffset:\s*0px;\s*}/);
    expect(css).toMatch(/to\s*{\s*stroke-dashoffset:\s*-1px;\s*}/);
    expect(css).toMatch(/--line:\s*2px/);
    expect(css).toMatch(/@media \(min-width: 769px\)\s*{\s*\.undo\s*{\s*--line:\s*3px/);
    expect(css).toMatch(/stroke:\s*currentColor/);
  });
});
