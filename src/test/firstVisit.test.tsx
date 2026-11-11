import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import App from '../App';
import { ROLL_DURATION_MS } from '../utils/constants';
import { DIE_BUTTONS_SHOWN_KEY, isFirstVisit } from '../utils/firstVisit';
import { buildBackup, restoreBackup } from '../utils/backup';

// First visit: the first die starts with its buttons open, once per phone
// (owner, 2026-11-10, way "Show the buttons once").

// The dice area's size, as the browser would report it
let area = { width: 0, height: 0 };
beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  area = { width: 0, height: 0 };
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe() { if (area.width) this.cb([{ contentRect: area } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); window.location.hash = ''; });

const dice = () => [...document.querySelectorAll('[data-dice-id]')] as HTMLElement[];
const opened = () => dice().map(d => /revealed/.test(d.className));
const sheet = () => document.querySelector('[data-die-actions]');

describe('First visit', () => {
  it('opens the first die\'s buttons, as a tap does, and saves the mark', () => {
    expect(isFirstVisit()).toBe(true);
    render(<App />);
    expect(opened()).toEqual([true, false]);
    expect(localStorage.getItem(DIE_BUTTONS_SHOWN_KEY)).toBe('true');
    // Its buttons are the ones a tap shows; nothing new is added
    expect(screen.getAllByRole('button', { name: /^Roll only/ })).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/tap a die|try|tip/i);
  });

  it('a tap on Roll closes them and rolls, as it does today', () => {
    vi.useFakeTimers();
    render(<App />);
    const roll = screen.getByRole('button', { name: /^Roll dice/ });
    fireEvent.pointerDown(roll);
    expect(opened()).toEqual([false, false]);
    fireEvent.click(roll);
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(JSON.parse(localStorage.getItem('rollHistory') ?? '[]')).toHaveLength(1);
  });

  it('a tap anywhere else closes them, and so does the five seconds a tap gets', () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.pointerDown(document.body);
    expect(opened()).toEqual([false, false]);
    cleanup();
    localStorage.clear();
    render(<App />);
    expect(opened()).toEqual([true, false]);
    act(() => { vi.advanceTimersByTime(5100); });
    expect(opened()).toEqual([false, false]);
  });

  it('a second visit never opens them by itself', () => {
    render(<App />);
    expect(opened()).toEqual([true, false]);
    cleanup();
    expect(isFirstVisit()).toBe(false);
    render(<App />);
    expect(opened()).toEqual([false, false]);
  });
});

describe('Anyone with something saved never sees it', () => {
  it.each([
    ['saved dice', 'diceConfigs', '{}'],
    ['History', 'rollHistory', '[]'],
    ['a theme', 'appTheme', 'theme-light'],
    ['default dice', 'defaultDiceSet', '[]'],
    ['saved rolls', 'savedRolls', '[]'],
    ['usage stats', 'diceAnalyticsStats', '{}'],
  ])('%s', (_what, key, value) => {
    localStorage.setItem(key, value);
    render(<App />);
    expect(opened()).toEqual([false, false]);
    expect(localStorage.getItem(DIE_BUTTONS_SHOWN_KEY)).toBeNull();
  });

  it('a share link opens its own dice, with nothing open', () => {
    window.location.hash = '#share=not-a-real-link';
    render(<App />);
    expect(dice().length).toBeGreaterThan(0);
    expect(opened().some(Boolean)).toBe(false);
    expect(localStorage.getItem(DIE_BUTTONS_SHOWN_KEY)).toBeNull();
  });
});

describe('Small dice', () => {
  it('where the buttons would come up in the sheet over Roll, they wait for a tap', () => {
    // Short screen: the two dice are under the size that moves the buttons to the sheet
    area = { width: 300, height: 120 };
    render(<App />);
    expect(sheet()).toBeNull();
    expect(opened()).toEqual([false, false]);
    // A tap on the die still opens the sheet, as it does today
    fireEvent.click(dice()[0]);
    expect(sheet()).not.toBeNull();
  });
});

describe('Backups and Reduce motion', () => {
  it('the mark stays out of backups, and an import leaves it as it is', () => {
    render(<App />);
    const backup = buildBackup();
    expect(JSON.stringify(backup)).not.toMatch(/dieButtonsShown/);
    expect(restoreBackup({ ...backup, dieButtonsShown: false })).not.toBe('invalid');
    expect(localStorage.getItem(DIE_BUTTONS_SHOWN_KEY)).toBe('true');
  });

  it('with Reduce motion the buttons and the sheet simply appear', () => {
    const diceCss = readFileSync(resolve(__dirname, '../components/Dice.module.css'), 'utf8');
    const reduce = diceCss.slice(diceCss.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduce).toMatch(/\.unlockIcon, \.settingsBtn, \.cloneBtn, \.rollOneBtn, \.removeBtn \{ transition: none; \}/);
    const stripCss = readFileSync(resolve(__dirname, '../components/DieActionStrip.module.css'), 'utf8');
    expect(stripCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.strip \{ animation: none; transition: none; \}/);
  });
});
