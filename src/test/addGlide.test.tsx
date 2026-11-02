import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

let animate: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  animate = vi.fn();
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
    fireEvent.click(screen.getByRole('button', { name: 'Add Dice' }));
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
});
