import React from 'react';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

// jsdom's history.back fires popstate asynchronously, like a phone's Back
const pressBack = () => window.history.back();
const tick = () => new Promise(r => setTimeout(r, 30));

describe('Phone Back closes what is open first', () => {
  beforeEach(() => localStorage.clear());

  it('closes Help and keeps you in the app', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const depth = window.history.length;
    pressBack();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(window.history.length).toBe(depth);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeInTheDocument();
  });

  it('closes the menu', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    pressBack();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument());
  });

  it('closing with the X takes the extra step back off, so the next Back leaves as before', async () => {
    render(<App />);
    const start = window.history.state?.diceOverlay;
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(window.history.state?.diceOverlay).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    const closeMenu = screen.queryByRole('button', { name: 'Close menu' });
    if (closeMenu) fireEvent.click(closeMenu);
    await waitFor(() => expect(window.history.state?.diceOverlay).toBe(start));
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('with the menu still open behind Help, Back closes Help, then the menu', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    pressBack();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    if (screen.queryByRole('button', { name: 'Close menu' })) {
      pressBack();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument());
    }
    await tick();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeInTheDocument();
  });
});
