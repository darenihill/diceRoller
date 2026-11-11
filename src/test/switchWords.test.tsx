import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Each Customize switch says On or Off in words, so its state never rests on
// color alone (app standards: accessibility; the owner is colorblind)

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const word = (name: string) => screen.getByRole('button', { name }).parentElement?.textContent;

describe('Customize switches say On or Off', () => {
  it('every switch shows its state in words and the word follows a tap', () => {
    localStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByText('Customize'));
    for (const name of ['Sound effects', 'Shake to roll', 'Sort dice', 'Bright rings', 'Page metrics']) {
      const pressed = screen.getByRole('button', { name }).getAttribute('aria-pressed') === 'true';
      expect(word(name)).toBe(pressed ? 'On' : 'Off');
    }
    expect(word('Bright rings')).toBe('Off');
    fireEvent.click(screen.getByRole('button', { name: 'Bright rings' }));
    expect(word('Bright rings')).toBe('On');
  });
});
