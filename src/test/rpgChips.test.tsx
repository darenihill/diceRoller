import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => { localStorage.clear(); localStorage.setItem('rpgMode', 'true'); });

describe('RPG roll type and modifier as chips that open', () => {
  it('the chips say what is set, open on a tap and shrink back after a roll', () => {
    vi.useFakeTimers();
    render(<App />);
    const type = screen.getByTestId('roll-type-chip');
    expect(type).toHaveTextContent('NORM');
    expect(screen.getByTestId('modifier-chip')).toHaveTextContent('±0');

    fireEvent.click(type);
    fireEvent.click(screen.getByRole('button', { name: 'ADV' }));
    // Stays open until the roll, so it can still be changed
    expect(screen.getByRole('group', { name: 'Roll type' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modifier-chip'));
    expect(screen.queryByRole('group', { name: 'Roll type' })).toBeNull();
    fireEvent.click(screen.getByTitle('Increase modifier'));
    fireEvent.click(screen.getByTitle('Increase modifier'));

    fireEvent.click(screen.getByRole('button', { name: /^Roll dice/ }));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(screen.queryByRole('group', { name: 'Modifier' })).toBeNull();
    expect(screen.getByTestId('roll-type-chip')).toHaveTextContent('ADV');
    expect(screen.getByTestId('modifier-chip')).toHaveTextContent('+2');
    vi.useRealTimers();
  });

  it('Hold All moves into the menu in RPG Mode', () => {
    render(<App />);
    expect(screen.queryByTitle('Toggle Hold All')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hold all' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Release all' })).toHaveAttribute('aria-pressed', 'true');
  });
});
