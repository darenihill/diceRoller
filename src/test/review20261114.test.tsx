import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';

/*
 * Deep review, 2026-11-14 (stories walked at 390px): saving a typed roll
 * under a name already in use replaced the old roll silently. Now it says so,
 * with Undo (standard 2).
 */

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('rpgMode', 'true');
  vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

const saveAs = (text: string, name: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: /type a roll/i }), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Save this roll' }));
  const form = screen.getByRole('form', { name: 'Name this roll' });
  fireEvent.change(within(form).getByRole('textbox'), { target: { value: name } });
  fireEvent.click(within(form).getByRole('button', { name: 'Save' }));
};
const saved = () => within(screen.getByRole('list', { name: 'Saved rolls' }))
  .getAllByRole('button', { name: /^Roll / }).map(b => b.getAttribute('aria-label'));

describe('Saving a roll under a name already in use', () => {
  it('says it replaced the old roll, and Undo brings the old one back in its place', () => {
    render(<App />);
    saveAs('2d6+3', 'Sword');
    saveAs('d20', 'Check');
    saveAs('d8+1', 'Sword');
    expect(saved()).toEqual(['Roll Sword: 1d8+1', 'Roll Check: 1d20']);
    expect(screen.getByText('Replaced Sword (was 2d6+3)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(saved()).toEqual(['Roll Sword: 2d6+3', 'Roll Check: 1d20']);
  });

  it('saving the same roll again under its name just says Saved', () => {
    render(<App />);
    saveAs('2d6+3', 'Sword');
    saveAs('2d6+3', 'Sword');
    expect(saved()).toEqual(['Roll Sword: 2d6+3']);
    expect(screen.queryByText(/Replaced/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });
});
