import React from 'react';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import App from '../App';

// Review 2026-10-26 (reviews/2026-10-26-access.md): a die was a button with
// buttons inside, which screen readers flatten, and its buttons all had the
// same name ("Remove Die" twice).

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('diceConfigs', JSON.stringify({
    systemAutosave: { name: 'systemAutosave', config: [
      { id: 'a', faces: 6, numberValue: 3, customFaces: [], color: '#E8E9EB', name: 'Red' },
      { id: 'b', faces: 20, numberValue: 1, customFaces: [], color: '#E8E9EB' },
    ] },
  }));
});

describe('Screen readers reach every die and its buttons', () => {
  it('a die is a named group, not a button holding other buttons', () => {
    render(<App />);
    const red = screen.getByRole('group', { name: /^Red showing/ });
    expect(within(red).getByRole('button', { name: 'Settings for Red' })).toBeInTheDocument();
    expect(within(red).getByRole('button', { name: 'Copy Red' })).toBeInTheDocument();
    expect(within(red).getByRole('button', { name: 'Remove Red' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove d20' })).toBeInTheDocument();
  });

  it('the hold button holds and releases, and says so', () => {
    render(<App />);
    const hold = screen.getByRole('button', { name: 'Hold Red' });
    expect(hold).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(hold);
    expect(screen.getByRole('button', { name: 'Hold Red' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('group', { name: /^Red showing 3, held$/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hold Red' }));
    expect(screen.getByRole('button', { name: 'Hold Red' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('RPG Mode and Advantage say whether they are on', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const rpg = screen.getByRole('button', { name: /RPG Mode/ });
    expect(rpg).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(rpg);
    expect(screen.getByRole('button', { name: /Normal Roll|NORM/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Advantage: Keep Highest|ADV/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('Escape closes the menu and puts focus back on the menu button', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(document.activeElement).toBe(toggle);
  });
});

describe('Bottom buttons on narrow screens', () => {
  it('shrinks below 380 px wide so Hold All and Add stop overlapping', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../components/ActionBar.module.css'), 'utf-8');
    const menuCss = fs.readFileSync(path.resolve(__dirname, '../components/SidebarMenu.module.css'), 'utf-8');
    // Left button (16 + 60) must end before the bar starts: width - 16 - (60 + 10 + 136)
    expect(css).toMatch(/@media \(max-width: 379px\)[\s\S]*width: 60px[\s\S]*min-width: 136px/);
    expect(menuCss).toMatch(/@media \(max-width: 379px\)[\s\S]*width: 60px/);
    expect(16 + 60).toBeLessThan(320 - 16 - (60 + 10 + 136));
  });
});
