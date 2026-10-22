import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  // jsdom has no ResizeObserver; the dice layout only needs it to exist
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

describe('Empty screen', () => {
  it('offers Add die and Games with no dice, and goes away once a die is added', () => {
    localStorage.clear();
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [] } }));
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Clear All'));
    const confirm = screen.queryByRole('button', { name: 'Delete All' });
    if (confirm) fireEvent.click(confirm);
    expect(screen.getByText('No dice yet')).toBeInTheDocument();
    const empty = within(screen.getByText('No dice yet').parentElement!);
    expect(empty.getByRole('button', { name: 'Games' })).toBeInTheDocument();
    fireEvent.click(empty.getByRole('button', { name: 'Add die' }));
    expect(screen.queryByText('No dice yet')).toBeNull();
  });
});
