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

  it('no Hold All button; a Release chip shows only while dice are held, in both modes (owner, 2026-11-05: B)', () => {
    for (const rpg of ['true', 'false']) {
      localStorage.setItem('rpgMode', rpg);
      const { unmount } = render(<App />);
      expect(screen.queryByTitle('Toggle Hold All')).toBeNull();
      expect(screen.queryByTestId('release-chip')).toBeNull();
      const holds = screen.getAllByRole('button', { name: /^Hold / });
      fireEvent.click(holds[0]);
      expect(screen.getByTestId('release-chip')).toHaveTextContent(rpg === 'true' ? /^1$/ : 'Release 1');
      expect(screen.getByTestId('release-chip')).toHaveAccessibleName('Release 1 held die');
      if (holds[1]) {
        fireEvent.click(screen.getAllByRole('button', { name: /^Hold / })[1]);
        expect(screen.getByTestId('release-chip')).toHaveAccessibleName('Release 2 held dice');
        if (rpg === 'true') {
          // Steps aside while a chip is open, back when it closes
          fireEvent.click(screen.getByTestId('roll-type-chip'));
          expect(screen.queryByTestId('release-chip')).toBeNull();
          fireEvent.keyDown(screen.getByRole('button', { name: 'NORM' }), { key: 'Escape' });
          expect(screen.getByTestId('release-chip')).toBeInTheDocument();
        }
      }
      fireEvent.click(screen.getByTestId('release-chip'));
      expect(screen.queryByTestId('release-chip')).toBeNull();
      screen.getAllByRole('button', { name: /^Hold / }).forEach(b => expect(b).toHaveAttribute('aria-pressed', 'false'));
      unmount();
    }
  });

  it('a tap outside the chips shrinks an open one back', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('modifier-chip'));
    fireEvent.pointerDown(screen.getByTitle('Increase modifier'));
    expect(screen.getByRole('group', { name: 'Modifier' })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('group', { name: 'Modifier' })).toBeNull();
    expect(screen.getByTestId('modifier-chip')).toBeInTheDocument();
  });

  it('opening a chip moves focus into it, and Escape shrinks it back to the chip', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('roll-type-chip'));
    expect(document.activeElement).toHaveTextContent('NORM');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Roll type' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByTestId('roll-type-chip'));

    fireEvent.click(screen.getByTestId('modifier-chip'));
    expect(document.activeElement).toBe(screen.getByTitle('Increase modifier'));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(document.activeElement).toBe(screen.getByTestId('modifier-chip'));
  });
});
