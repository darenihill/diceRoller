import React from 'react';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => { localStorage.clear(); });

describe('A held die cannot be rolled on its own (owner, 2026-11-05)', () => {
  it('drops its Roll only button until it is released', () => {
    render(<App />);
    const first = screen.getAllByRole('button', { name: /^Roll only / })[0];
    const name = first.getAttribute('aria-label')!.replace('Roll only ', '');
    const count = screen.getAllByRole('button', { name: /^Roll only / }).length;
    fireEvent.click(screen.getAllByRole('button', { name: /^Hold / })[0]);
    expect(screen.queryAllByRole('button', { name: /^Roll only / })).toHaveLength(count - 1);
    fireEvent.click(screen.getAllByRole('button', { name: /^Hold / })[0]);
    expect(screen.getAllByRole('button', { name: `Roll only ${name}` }).length).toBeGreaterThan(0);
  });
});
