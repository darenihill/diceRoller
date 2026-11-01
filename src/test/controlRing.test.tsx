import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    for (const b of ['ADV', 'NORM', 'DIS']) expect(ringed(b)).toBe(true);
    expect(document.querySelectorAll('.control-ring').length).toBeGreaterThanOrEqual(10);
  });

  it('each theme sets its own ring colour', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css.match(/--control-ring:/g)).toHaveLength(4);
    expect(css).toMatch(/\.control-ring \{\s*outline: 2px solid var\(--control-ring\);/);
  });
});
