import React from 'react';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import LZString from 'lz-string';
import App from '../App';
import { HelpModal } from '../components/modals/HelpModal';

// Review 2026-11-08 (stories, security, inversion)
beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const lunch = { id: 'l1', numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', name: 'Lunch', held: false };
const fire = [{ faces: 20, customFaces: [], color: '#E32227', name: 'Fire' }];

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

const dieNames = () => screen.queryAllByLabelText(/^Settings for /).map(b => b.getAttribute('aria-label'));

function openLinkInThisTab(hash: string) {
  act(() => {
    window.history.replaceState(null, '', '/' + hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('a share link opened in the tab Dice Roller is already in', () => {
  it('puts the shared dice out, with its name and Undo for the dice that were out', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [lunch] } }));
    render(<App />);
    expect(dieNames()).toEqual(['Settings for Lunch']);

    openLinkInThisTab('#share=' + LZString.compressToEncodedURIComponent(JSON.stringify(fire)) + '&name=Friday');
    expect(dieNames()).toEqual(['Settings for Fire']);
    expect(screen.getByText('Opened shared dice')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
    // The link isn't left in the address bar to load again on refresh
    expect(window.location.hash).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(dieNames()).toEqual(['Settings for Lunch']);
  });

  it('a link that cannot be read says so and leaves the dice as they were', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [lunch] } }));
    render(<App />);
    openLinkInThisTab('#share=not-a-real-link');
    expect(dieNames()).toEqual(['Settings for Lunch']);
    expect(screen.getByText(/That share link couldn't be read/)).toBeInTheDocument();
  });

  it('other changes after # are left alone', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [lunch] } }));
    render(<App />);
    openLinkInThisTab('#about');
    expect(dieNames()).toEqual(['Settings for Lunch']);
  });
});

describe('words match the buttons they point at (DESIGN.md §7)', () => {
  it('Help names the Hold and Settings buttons, not lock and gear', () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    const help = screen.getByRole('dialog').textContent ?? '';
    expect(help).toContain('Tap a die, then Hold.');
    expect(help).toContain('Tap a die, then Settings.');
    expect(help).not.toMatch(/\block\b|\bgear\b/i);
  });

  it('the empty screen says RPG mode, as the menu does', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Clear all'));
    const empty = within(screen.getByText('No dice yet').parentElement!);
    expect(empty.getByRole('button', { name: 'RPG mode' })).toBeInTheDocument();
  });
});

describe('a hand-edited History row, tapped (security, tampering)', () => {
  it('puts out only safe dice: faces in range, hex colors, short names', async () => {
    const { diceFromHistory } = await import('../utils/historyReuse');
    const { sanitizeRollHistory } = await import('../hooks/useDiceState');
    const { sanitizeDiceList } = await import('../utils/diceUtils');
    const [row] = sanitizeRollHistory([{
      total: 3, details: [], set: JSON.stringify([[[99999, []], [-4, []]]]),
      colors: ['url(javascript:alert(1))', '#123456'], names: ['x'.repeat(500), 'ok'],
    }]);
    const dice = sanitizeDiceList(diceFromHistory(row));
    expect(dice.map(d => d.faces)).toEqual([1000, 1]);
    expect(dice.map(d => d.color)).toEqual(['#E9EAEC', '#123456']);
    expect(dice[0].name.length).toBe(40);
  });
});
