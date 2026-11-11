import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import App from '../App';
import { StatsModal } from '../components/modals/StatsModal';
import { HelpModal } from '../components/modals/HelpModal';
import { countSaved, eraseEverything, eraseQuestion } from '../utils/erase';
import { DIE_BUTTONS_SHOWN_KEY, isFirstVisit } from '../utils/firstVisit';
import { unfreezeSavesForTests } from '../hooks/useStorage';
import { resetFaceImageCache } from '../utils/faceImages';
import { reloadAfterErase } from '../utils/erase';
import { GA_MEASUREMENT_ID } from '../utils/constants';

// The real one opens the home page afresh; here it is only counted
vi.mock('../utils/erase', async (original) => ({ ...(await original<typeof import('../utils/erase')>()), reloadAfterErase: vi.fn() }));
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

// Erase everything at the bottom of Usage stats (owner, 2026-11-10, way
// "Bottom of Usage stats").

const PIC = 'data:image/png;base64,iVBORw0KGgo=';
const fill = () => {
  localStorage.setItem('diceConfigs', JSON.stringify({
    systemAutosave: { name: 'systemAutosave', config: [{ id: 'a', numberValue: 1, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false }] },
    'Friday night': { name: 'Friday night', config: [] },
    Kids: { name: 'Kids', config: [] },
    Tenzi: { name: 'Tenzi', config: [] },
  }));
  localStorage.setItem('rollHistory', JSON.stringify(Array.from({ length: 120 }, (_, i) => ({ id: `r${i}`, total: 7, details: ['7'] }))));
  localStorage.setItem('diceFaceImages', JSON.stringify({ p1: PIC, p2: PIC, p3: PIC, p4: PIC }));
  localStorage.setItem('diceAnalyticsStats', JSON.stringify({ totalRolls: 120 }));
  localStorage.setItem('defaultDiceSet', '[]');
  localStorage.setItem('savedRolls', '[]');
  localStorage.setItem('appTheme', 'theme-light');
  localStorage.setItem(DIE_BUTTONS_SHOWN_KEY, 'true');
};

beforeEach(() => { localStorage.clear(); resetFaceImageCache(); unfreezeSavesForTests(); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); resetFaceImageCache(); unfreezeSavesForTests(); document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'; });

describe('The question counts what goes', () => {
  it('says the owner\'s sentence', () => {
    fill();
    expect(countSaved()).toEqual({ games: 3, rolls: 120, pictures: 4, stats: true });
    expect(eraseQuestion(countSaved())).toBe("Erase 3 games, 120 rolls, 4 pictures and your stats? This can't be undone.");
  });

  it('says one as one and leaves out what is zero', () => {
    expect(eraseQuestion({ games: 1, rolls: 1, pictures: 1, stats: false })).toBe("Erase 1 game, 1 roll and 1 picture? This can't be undone.");
    expect(eraseQuestion({ games: 0, rolls: 2, pictures: 0, stats: true })).toBe("Erase 2 rolls and your stats? This can't be undone.");
    expect(eraseQuestion({ games: 0, rolls: 0, pictures: 0, stats: true })).toBe("Erase your stats? This can't be undone.");
    expect(eraseQuestion({ games: 0, rolls: 0, pictures: 0, stats: false })).toBe("Erase everything saved on this phone? This can't be undone.");
    expect(eraseQuestion({ games: 1200, rolls: 0, pictures: 0, stats: false })).toBe("Erase 1,200 games? This can't be undone.");
  });

  it('a damaged value counts as nothing rather than breaking the panel', () => {
    localStorage.setItem('diceConfigs', '{oops');
    localStorage.setItem('rollHistory', '"x"');
    expect(countSaved()).toMatchObject({ games: 0, rolls: 0 });
  });
});

describe('Usage stats', () => {
  it('ends with the new line and an outlined Erase everything button in words', () => {
    render(<StatsModal isOpen onClose={() => {}} onEraseEverything={() => {}} />);
    expect(screen.getByText('Your games, History, pictures and these stats stay on this phone.')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Erase everything' });
    expect(button.className).toMatch(/eraseEverything/);
    const css = readFileSync(resolve(__dirname, '../components/modals/Modals.module.css'), 'utf8');
    const rule = css.slice(css.indexOf('.eraseEverything {'), css.indexOf('}', css.indexOf('.eraseEverything {')));
    expect(rule).toMatch(/border: 2px solid var\(--md-sys-color-error\)/);
    expect(rule).toMatch(/color: var\(--md-sys-color-error\)/);
  });

  it('asks first, with focus on Not now; Not now and Escape go back without erasing', () => {
    fill();
    const onErase = vi.fn();
    const onClose = vi.fn();
    render(<StatsModal isOpen onClose={onClose} onEraseEverything={onErase} />);
    fireEvent.click(screen.getByRole('button', { name: 'Erase everything' }));
    const ask = screen.getByRole('group', { name: "Erase 3 games, 120 rolls, 4 pictures and your stats? This can't be undone." });
    const notNow = within(ask).getByRole('button', { name: 'Not now' });
    const eraseAll = within(ask).getByRole('button', { name: 'Erase all' });
    expect(document.activeElement).toBe(notNow);
    // The red one says what it does; dialog buttons are 48px (one shared rule)
    expect(eraseAll.className).toMatch(/md-button-danger/);
    // Only the panel's buttons and the dialog's × can be reached
    expect(screen.queryByText('Total rolls')).toBeNull();
    fireEvent.keyDown(notNow, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId('erase-ask')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Erase everything' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erase everything' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByTestId('erase-ask')).toBeNull();
    expect(onErase).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Erase everything' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erase all' }));
    expect(onErase).toHaveBeenCalledTimes(1);
  });

  it('Tab stays inside the panel and the dialog\'s ×', () => {
    render(<StatsModal isOpen onClose={() => {}} onEraseEverything={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Erase everything' }));
    const dialog = screen.getByRole('dialog');
    const reachable = [...dialog.querySelectorAll('button')].map(b => b.getAttribute('aria-label') ?? b.textContent);
    expect(reachable).toEqual(['Close dialog', 'Not now', 'Erase all']);
  });
});

describe('Erase all', () => {
  it('takes every saved item off the phone, keeps the metrics switch and deletes Google\'s ID', () => {
    fill();
    localStorage.setItem('telemetryEnabled', 'false');
    document.cookie = '_ga=GA1.1.123.456; path=/';
    expect(eraseEverything()).toBe(true);
    expect(Object.keys(localStorage)).toEqual(['telemetryEnabled']);
    expect(localStorage.getItem('telemetryEnabled')).toBe('false');
    expect(document.cookie).not.toMatch(/_ga=/);
    // The app opens like a first visit
    expect(isFirstVisit()).toBe(true);
    expect(countSaved()).toEqual({ games: 0, rolls: 0, pictures: 0, stats: false });
  });

  it('metrics never set stays unset', () => {
    fill();
    eraseEverything();
    expect(localStorage.length).toBe(0);
  });

  it('from the app: nothing saves again before the reload, an Undo bar goes, and no Undo is offered', () => {
    vi.useFakeTimers();
    const reload = vi.mocked(reloadAfterErase);
    reload.mockClear();
    fill();
    render(<App />);
    // An Undo bar is up (a game deleted)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Games' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Kids' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Usage stats' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erase everything' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erase all' }));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    // The page leaving, or the bar's time running out, writes nothing back
    act(() => { window.dispatchEvent(new Event('pagehide')); vi.advanceTimersByTime(10_000); });
    const left = Object.keys(localStorage).filter(k => k !== 'telemetryEnabled');
    expect(left).toEqual([]);
  });
});

describe('Words and Help', () => {
  it('erase is in the word list beside clear and delete', () => {
    const design = readFileSync(resolve(__dirname, '../../DESIGN.md'), 'utf8');
    expect(design).toMatch(/\| erase \(everything on this phone[^|]*\| wipe, reset, delete all \|/);
  });

  it('Help has one line about it', () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    const lines = screen.getAllByRole('listitem').map(li => li.textContent ?? '').filter(t => /Erase everything/.test(t));
    expect(lines).toEqual(['Erase everything: At the bottom of Usage stats. It asks first, then takes your games, History, pictures, stats and settings off this phone.']);
  });
});

describe('Google can\'t write the old ID back (second read, 2026-11-11)', () => {
  const killSwitch = () => (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`];
  afterEach(() => { delete (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`]; });

  it('Google\'s kill switch is on before its cookies are deleted', () => {
    document.cookie = '_ga=GA1.1.123.456; path=/';
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    const real = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!;
    const switchAtDelete: unknown[] = [];
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => real.get!.call(document),
      set: (v: string) => { if (/^_ga.*expires=Thu, 01 Jan 1970/.test(v)) switchAtDelete.push(killSwitch()); real.set!.call(document, v); },
    });
    try {
      eraseEverything();
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie;
    }
    expect(switchAtDelete.length).toBeGreaterThan(0);
    expect(switchAtDelete.every(v => v === true)).toBe(true);
    expect(document.cookie).not.toMatch(/_ga=/);
  });
});

describe('Erase all in another tab', () => {
  it('this tab stops saving and reopens, so its autosave can\'t write games back', () => {
    const reload = vi.mocked(reloadAfterErase);
    reload.mockClear();
    fill();
    render(<App />);
    // The other tab empties storage; this tab hears it as a storage event with no key
    localStorage.clear();
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage })); });
    expect(reload).toHaveBeenCalledTimes(1);
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    expect(localStorage.getItem('diceConfigs')).toBeNull();
  });

  it('a single value changed in another tab does nothing of the kind', () => {
    const reload = vi.mocked(reloadAfterErase);
    reload.mockClear();
    fill();
    render(<App />);
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: 'appTheme', newValue: 'theme-dark', storageArea: localStorage })); });
    expect(reload).not.toHaveBeenCalled();
  });
});
