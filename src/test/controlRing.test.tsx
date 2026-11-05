import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

describe('Bright ring on the bottom-bar buttons', () => {
  it('every round button and Roll carry the ring in RPG Mode', () => {
    localStorage.clear();
    localStorage.setItem('rpgMode', 'true');
    render(<App />);
    const ringed = (name: RegExp | string) => screen.getAllByRole('button', { name })[0].classList.contains('control-ring');
    expect(ringed('Roll dice')).toBe(true);
    expect(ringed(/menu/i)).toBe(true);
    expect(ringed(/^Roll type/)).toBe(true);
    expect(ringed(/^Modifier/)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^Roll type/ }));
    for (const b of ['ADV', 'NORM', 'DIS']) expect(ringed(b)).toBe(true);
    expect(document.querySelectorAll('.control-ring').length).toBeGreaterThanOrEqual(7);
  });

  it('each theme sets its own ring color', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css.match(/--control-ring:/g)).toHaveLength(4);
    expect(css).toMatch(/\.bright-rings \.control-ring:not\(:focus-visible\) \{\s*outline: 2px solid var\(--control-ring\);/);
    // The keyboard focus ring always wins over the bright ring
    expect(css).not.toMatch(/\.bright-rings \.control-ring \{/);
  });

  it('is off until turned on in Customize, and stays on next time', () => {
    localStorage.clear();
    const { unmount } = render(<App />);
    expect(document.body.classList.contains('bright-rings')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByText('Customize'));
    const toggle = screen.getByRole('button', { name: 'Bright rings' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(document.body.classList.contains('bright-rings')).toBe(true);
    unmount();
    document.body.classList.remove('bright-rings');
    render(<App />);
    expect(document.body.classList.contains('bright-rings')).toBe(true);
  });
});
