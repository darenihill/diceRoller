import React from 'react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => { localStorage.clear(); });

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
const menuIsOpen = () => screen.queryByRole('button', { name: 'Close menu' }) !== null;

describe('The menu closes when a window opens', () => {
  it.each(['Help', 'Games', 'History', 'Usage Stats', 'Customize'])('%s closes the menu as its window opens', (item) => {
    render(<App />);
    openMenu();
    expect(menuIsOpen()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${item}$`) }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(menuIsOpen()).toBe(false);
  });

  it('closing Help lands on the dice, not the menu', async () => {
    render(<App />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /^Help$/ }));
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(menuIsOpen()).toBe(false);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeInTheDocument();
  });

  it('RPG Mode stays a switch inside the menu', () => {
    render(<App />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /RPG Mode/ }));
    expect(menuIsOpen()).toBe(true);
  });
});
