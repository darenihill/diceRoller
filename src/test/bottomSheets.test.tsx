import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, createEvent, act } from '@testing-library/react';
import { Modal } from '../components/Modal';
import { SHEET_EXIT_MS } from '../hooks/useSheetDrag';

/*
 * Phone dialogs slide up from the bottom and swipe down to close (owner,
 * 2026-11-10, Build "sheet"), and the menu is the same sheet.
 */

const original = window.matchMedia;
const setScreen = ({ phone, reduce = false }: { phone: boolean; reduce?: boolean }) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: (phone && query.includes('468px')) || (reduce && query.includes('reduce')),
    media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
};
afterEach(() => {
  window.matchMedia = original;
  vi.useRealTimers();
});

// jsdom's pointer events drop clientX/Y and pointerId, so set them by hand
const ptr = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', el: Element, x: number, y: number) => {
  const ev = createEvent[type](el);
  Object.assign(ev, { clientX: x, clientY: y, pointerId: 1 });
  fireEvent(el, ev);
};
const swipe = (el: Element, to: number, ms: number) => {
  ptr('pointerDown', el, 100, 100);
  act(() => { vi.advanceTimersByTime(300); });
  ptr('pointerMove', el, 100, to);
  act(() => { vi.advanceTimersByTime(ms); });
  ptr('pointerUp', el, 100, to);
};

const dialog = (onClose: () => void) => render(
  <Modal isOpen onClose={onClose} title="History">
    <input aria-label="Name" />
    <button>Done</button>
  </Modal>,
);

describe('On a phone every dialog is a bottom sheet', () => {
  it('opens as a sheet with a grab bar and the close button', () => {
    setScreen({ phone: true });
    dialog(vi.fn());
    const d = screen.getByRole('dialog', { name: 'History' });
    expect(d).toHaveAttribute('data-sheet');
    expect(d.querySelector('[data-sheet-grab]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('a drag down on the grab bar past the line closes it; a short slow one springs back', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    const d = screen.getByRole('dialog');
    const grab = d.querySelector('[data-sheet-grab]')!;
    swipe(grab, 130, 200);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).not.toHaveBeenCalled();
    expect(d.style.translate).toBe('');
    swipe(grab, 200, 30);
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a quick flick down closes it even when short', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    const grab = screen.getByRole('dialog').querySelector('[data-sheet-grab]')!;
    ptr('pointerDown', grab, 100, 100);
    act(() => { vi.advanceTimersByTime(16); });
    ptr('pointerMove', grab, 100, 115);
    act(() => { vi.advanceTimersByTime(16); });
    ptr('pointerMove', grab, 100, 145);
    ptr('pointerUp', grab, 100, 145);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a drag in the content does not close it, so long dialogs still scroll', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    swipe(screen.getByRole('button', { name: 'Done' }), 300, 30);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('with Reduce motion on, a swipe closes it at once, with no slide', () => {
    vi.useFakeTimers();
    setScreen({ phone: true, reduce: true });
    const onClose = vi.fn();
    dialog(onClose);
    swipe(screen.getByRole('dialog').querySelector('[data-sheet-grab]')!, 200, 30);
    expect(onClose).toHaveBeenCalledTimes(1);
    const css = readFileSync('src/components/Modal.module.css', 'utf8');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.modal\.sheet\s*\{\s*transition: none/);
  });

  it('tapping above it closes it, and the close button still works', () => {
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('sits above the phone keyboard while a text box is in use', () => {
    setScreen({ phone: true });
    const vv = Object.assign(new EventTarget(), { height: 500, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
    try {
      dialog(vi.fn());
      const overlay = screen.getByRole('dialog').parentElement!;
      expect(overlay.style.getPropertyValue('--keyboard')).toBe(`${window.innerHeight - 500}px`);
      act(() => { vv.height = window.innerHeight; vv.dispatchEvent(new Event('resize')); });
      expect(overlay.style.getPropertyValue('--keyboard')).toBe('');
    } finally {
      Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
    }
    const css = readFileSync('src/components/Modal.module.css', 'utf8');
    expect(css).toMatch(/padding-bottom: var\(--keyboard, 0px\)/);
    expect(css).toMatch(/max-height: calc\(100dvh - 72px - var\(--keyboard, 0px\)\)/);
  });

  it('keeps the Undo bar off the sheet: it moves to the clear strip at the top', () => {
    const css = readFileSync('src/App.module.css', 'utf8');
    expect(css).toMatch(/\.toast\.toastBelowDialog \{\s*top: calc\(12px \+ env\(safe-area-inset-top, 0px\)\);\s*bottom: auto;/);
  });
});

describe('On a computer dialogs stay boxes in the middle', () => {
  it('has no grab bar, and a drag does nothing', () => {
    vi.useFakeTimers();
    setScreen({ phone: false });
    const onClose = vi.fn();
    dialog(onClose);
    const d = screen.getByRole('dialog');
    expect(d).not.toHaveAttribute('data-sheet');
    expect(d.querySelector('[data-sheet-grab]')).toBeNull();
    swipe(d.firstElementChild!, 300, 30);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).not.toHaveBeenCalled();
  });
});
