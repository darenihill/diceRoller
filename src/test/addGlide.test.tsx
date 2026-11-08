import React, { StrictMode } from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  animate = vi.fn(() => ({ cancel: vi.fn() }));
  (HTMLElement.prototype as unknown as { animate: unknown }).animate = animate;
});
afterEach(() => {
  delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
});

const glides = () => animate.mock.calls.filter(([frames]) => String(frames?.[0]?.transform).startsWith('translate('));

describe('A new die glides out of the + button', () => {
  it('a die added with + rises from the button into its place', () => {
    render(<App />);
    const before = screen.getAllByRole('group', { name: / showing / }).length;
    fireEvent.click(screen.getByRole('button', { name: 'Add a die' }));
    expect(screen.getAllByRole('group', { name: / showing / })).toHaveLength(before + 1);
    expect(glides()).toHaveLength(1);
    expect(glides()[0][1]).toMatchObject({ duration: 450, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  });

  it('dice already out on opening, and a copied die, do not glide', () => {
    render(<App />);
    expect(glides()).toHaveLength(0);
    fireEvent.click(screen.getAllByRole('button', { name: /^Copy / })[0]);
    expect(glides()).toHaveLength(0);
  });

  it('under strict mode the glide still starts from the + button', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return (this.hasAttribute('data-add-button') ? { left: 100, top: 700, width: 56, height: 56 } : { left: 150, top: 200, width: 100, height: 100 }) as DOMRect;
    });
    render(<StrictMode><App /></StrictMode>);
    fireEvent.click(screen.getByRole('button', { name: 'Add a die' }));
    const all = glides();
    expect(all.length).toBeGreaterThan(0);
    expect(all.at(-1)![0][0].transform).toBe('translate(-72px, 478px) scale(0.3)');
    expect(animate.mock.results[0].value.cancel).toHaveBeenCalledTimes(all.length - 1);
    vi.restoreAllMocks();
  });

  it('the dice area hides its scroll bar while the die flies in, then gives it back', () => {
    const listeners: Record<string, () => void> = {};
    animate.mockImplementation(() => ({ cancel: vi.fn(), addEventListener: (t: string, f: () => void) => { listeners[t] = f; } }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a die' }));
    const area = document.querySelector('[data-dice-id]')!.parentElement as HTMLElement;
    // jsdom has no layout, so everything "fits": the bar is hidden during the glide
    expect(area.style.overflow).toBe('hidden');
    listeners.finish();
    expect(area.style.overflow).toBe('');
  });

  it('two dice in flight at once: the scroll bar comes back only after both land', () => {
    const finishes: Array<() => void> = [];
    animate.mockImplementation(() => ({ cancel: vi.fn(), addEventListener: (t: string, f: () => void) => { if (t === 'finish') finishes.push(f); } }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a die' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a die' }));
    const area = document.querySelector('[data-dice-id]')!.parentElement as HTMLElement;
    expect(finishes.length).toBeGreaterThanOrEqual(2);
    finishes[0]();
    expect(area.style.overflow).toBe('hidden');
    finishes.slice(1).forEach(f => f());
    expect(area.style.overflow).toBe('');
  });
});
