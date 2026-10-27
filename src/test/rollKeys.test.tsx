import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
    { id: 'a', numberValue: 1, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false }
  ] } }));
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

const rolls = () => {
  act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
  return JSON.parse(localStorage.getItem('rollHistory') ?? '[]').length as number;
};
const press = (key: string, code = key === ' ' ? 'Space' : `Key${key.toUpperCase()}`, extra = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, code, ...extra });

describe('Space or R rolls on a computer', () => {
  it('Space rolls from the main screen', () => {
    render(<App />);
    press(' ');
    expect(rolls()).toBe(1);
  });

  it('R rolls, and r does too', () => {
    render(<App />);
    press('r');
    expect(rolls()).toBe(1);
    press('R');
    expect(rolls()).toBe(2);
  });

  it('does nothing while typing in a box', () => {
    localStorage.setItem('rpgMode', 'true');
    render(<App />);
    const box = screen.getByRole('textbox', { name: /Type a roll/ });
    box.focus();
    press('r');
    press(' ');
    expect(rolls()).toBe(0);
  });

  it('does nothing with a window open', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    // Close the menu behind it, so only the window is open
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    press('r');
    expect(rolls()).toBe(0);
  });

  it('does nothing with the menu open', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    press('r');
    press(' ');
    expect(rolls()).toBe(0);
  });

  it('does nothing with a die selected, so Space stays that button\'s own press', () => {
    render(<App />);
    screen.getAllByRole('button', { name: /Press to hold/ })[0].focus();
    press(' ');
    press('r');
    expect(rolls()).toBe(0);
  });

  it('ignores a held-down key and Ctrl+R', () => {
    render(<App />);
    press('r', 'KeyR', { repeat: true });
    press('r', 'KeyR', { ctrlKey: true });
    press('r', 'KeyR', { metaKey: true });
    expect(rolls()).toBe(0);
  });

  it('Help lists the two keys', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    const help = screen.getByRole('dialog');
    expect(help).toHaveTextContent(/press Space or R to roll/i);
  });
});
