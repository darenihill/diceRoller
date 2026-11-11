import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, createEvent, act, waitFor } from '@testing-library/react';
import App from '../App';
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

// A finger: touch events, which jsdom gives no touch lists, so set them by hand
const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', el: Element, y: number, x = 100) => {
  const ev = createEvent[type](el, { cancelable: true });
  const pt = [{ clientX: x, clientY: y, identifier: 7 }];
  Object.defineProperty(ev, 'touches', { value: type === 'touchEnd' ? [] : pt });
  Object.defineProperty(ev, 'changedTouches', { value: pt });
  fireEvent(el, ev);
  return ev;
};
const fingerSwipe = (el: Element, to: number, ms: number, x = 100) => {
  touch('touchStart', el, 100);
  act(() => { vi.advanceTimersByTime(300); });
  const moved = touch('touchMove', el, to, x);
  act(() => { vi.advanceTimersByTime(ms); });
  touch('touchEnd', el, to, x);
  return moved;
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

  it('a mouse drag in the content does not close it', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    swipe(screen.getByRole('button', { name: 'Done' }), 300, 30);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a finger swipe down anywhere in it closes it, as on the menu (owner, 2026-11-11)', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    const moved = fingerSwipe(screen.getByRole('button', { name: 'Done' }), 220, 30);
    expect(moved.defaultPrevented).toBe(true);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a long dialog scrolled down scrolls back up instead of closing; a text box keeps its own drags', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    const content = screen.getByRole('button', { name: 'Done' }).parentElement!;
    content.scrollTop = 80;
    const moved = fingerSwipe(screen.getByRole('button', { name: 'Done' }), 300, 30);
    expect(moved.defaultPrevented).toBe(false);
    content.scrollTop = 0;
    fingerSwipe(screen.getByRole('textbox', { name: 'Name' }), 300, 30);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a finger moving up or sideways first is left to scroll', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    const onClose = vi.fn();
    dialog(onClose);
    const done = screen.getByRole('button', { name: 'Done' });
    touch('touchStart', done, 100);
    expect(touch('touchMove', done, 80).defaultPrevented).toBe(false);
    expect(touch('touchMove', done, 300).defaultPrevented).toBe(false);
    touch('touchEnd', done, 300);
    fingerSwipe(done, 112, 30, 160);
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

describe('On a phone the menu is the same bottom sheet', () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  });
  afterEach(() => { localStorage.clear(); });
  const menuSheet = () => document.querySelector('[data-sheet]:not([role="dialog"])');

  it('opens as a sheet with a grab bar, and a drag down closes it', async () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const sheet = menuSheet();
    expect(sheet).not.toBeNull();
    const grab = sheet!.querySelector('[data-sheet-grab]')!;
    swipe(grab, 200, 30);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('a finger swipe down from anywhere in the menu closes it, not only the top (owner, 2026-11-11)', () => {
    vi.useFakeTimers();
    setScreen({ phone: true });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const tile = menuSheet()!.querySelector('button')!;
    expect(tile.closest('[data-sheet-grab]')).toBeNull();
    fingerSwipe(tile, 220, 30);
    act(() => { vi.advanceTimersByTime(SHEET_EXIT_MS); });
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('tapping History swaps the menu for the History sheet in the same spot', async () => {
    setScreen({ phone: true });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: /^History$/ }));
    const d = screen.getByRole('dialog');
    expect(d).toHaveAttribute('data-sheet');
    // The menu goes at once rather than sliding down under it
    await waitFor(() => expect(menuSheet()).toBeNull());
  });

  it('tapping Games does the same', async () => {
    setScreen({ phone: true });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: /^Games$/ }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-sheet');
    await waitFor(() => expect(menuSheet()).toBeNull());
  });

  it('a mouse press on the grab bar holds the pointer, so a drag that leaves the 28px bar still counts; a press on a button does not', () => {
    setScreen({ phone: true });
    const capture = vi.fn();
    const before = HTMLElement.prototype.setPointerCapture;
    HTMLElement.prototype.setPointerCapture = capture;
    try {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
      const grab = menuSheet()!.querySelector('[data-sheet-grab]')!;
      const press = (el: Element, pointerType: string) => {
        const ev = createEvent.pointerDown(el);
        Object.assign(ev, { clientX: 100, clientY: 100, pointerId: 1, pointerType });
        fireEvent(el, ev);
      };
      press(grab, 'mouse');
      expect(capture).toHaveBeenCalledTimes(1);
      // A finger is held by the browser itself
      press(grab, 'touch');
      expect(capture).toHaveBeenCalledTimes(1);
      // A press on a button inside the grab area (the dialog's ×) keeps its click
      render(<Modal isOpen onClose={() => {}} title="History"><button>Done</button></Modal>);
      press(screen.getByRole('button', { name: 'Close dialog' }), 'mouse');
      expect(capture).toHaveBeenCalledTimes(1);
    } finally {
      HTMLElement.prototype.setPointerCapture = before;
    }
  });

  it('stays the panel above its button on a computer', () => {
    setScreen({ phone: false });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: /^History$/ })).toBeInTheDocument();
    expect(document.querySelector('[data-sheet]')).toBeNull();
    expect(document.querySelector('[data-sheet-grab]')).toBeNull();
  });

  it('the sheet rule outranks the narrow screens\' menu offsets', () => {
    const css = readFileSync('src/components/SidebarMenu.module.css', 'utf8');
    expect(css).toMatch(/\.menu\.sheet \{\s*bottom: 0;\s*left: 0;\s*right: 0;/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.menu\.sheet \{ transition: none; \}/);
  });
});
