import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';

// Three Focus cards that were plain fixes, built as fixes (2026-11-10,
// reviews/2026-11-10-card-fixes.md). Owner: standards and fixes shouldn't be
// Desk cards.

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

// ---------------------------------------------------------------------------
// 1. Die settings face cards on Clean Light
// ---------------------------------------------------------------------------

const index = readFileSync('src/index.css', 'utf8');
const dieSettings = readFileSync('src/components/DiceSettingsModal.module.css', 'utf8');

const rule = (source: string, selector: string) => {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/(^|\n|\})([^{}]+)\{([^}]*)\}/g)]
    .filter(m => m[2].split(',').map(s => s.trim()).includes(selector))
    .map(m => m[3])
    .join('\n');
};

function tokens(selector: string): Record<string, string> {
  const css = index.replace(/\/\*[\s\S]*?\*\//g, '');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]+)\\}`));
  const out: Record<string, string> = {};
  if (!block) return out;
  for (const m of block[2].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const themes = ['theme-dark', 'theme-light', 'theme-felt', 'theme-midnight'];
const themeTokens = (theme: string) => ({ ...tokens(':root'), ...(theme === 'theme-dark' ? {} : tokens(`body.${theme}`)) });

describe('Die settings face cards use the theme\'s own colors', () => {
  it('face cards, − and + and the icon picker no longer paint a fixed black', () => {
    for (const selector of ['.faceCard', '.stepperBtn', '.iconBtn']) {
      const css = rule(dieSettings, selector);
      expect(css, selector).not.toMatch(/background-color:\s*rgba\(0,\s*0,\s*0/);
      expect(css, selector).toMatch(/background-color:\s*var\(--die-/);
    }
    expect(rule(dieSettings, '.faceCard')).toMatch(/border:\s*1px solid var\(--die-face-card-edge\)/);
  });

  it('on Clean Light a face card is white with a gray edge', () => {
    const t = themeTokens('theme-light');
    expect(t['--die-face-card']).toBe('#FFFFFF');
    expect(index).toMatch(/body\.theme-light\s*\{[^}]*--die-face-card-edge:\s*var\(--md-sys-color-outline-variant\)/);
  });

  for (const theme of themes) {
    it(`${theme}: the "counts as" box edge shows on a face card (3:1 or more)`, () => {
      const t = themeTokens(theme);
      expect(contrast(t['--md-sys-color-outline'], t['--die-face-card'])).toBeGreaterThanOrEqual(3);
    });
  }

  // Dark, Felt and Midnight keep the shade they had: 15% black over the panel
  // for a face card, 20% for the round buttons
  for (const theme of ['theme-dark', 'theme-felt', 'theme-midnight']) {
    it(`${theme} looks the same as before`, () => {
      const t = themeTokens(theme);
      const panel = rgb(t['--md-sys-color-surface-variant']);
      const near = (hex: string, keep: number) =>
        rgb(hex).forEach((v, i) => expect(Math.abs(v - panel[i] * keep)).toBeLessThanOrEqual(1));
      near(t['--die-face-card'], 0.85);
      near(t['--die-tonal-button'], 0.8);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Messages wait while the menu is open
// ---------------------------------------------------------------------------

describe('a message like "Saved" never sits on the open menu', () => {
  beforeEach(() => localStorage.clear());

  it('"Saved" steps aside while the menu is open and shows again when it closes', () => {
    render(<App />);
    const menu = () => screen.getAllByRole('button', { name: /menu/i })[0];
    fireEvent.click(menu());
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.change(screen.getByLabelText('Name for this game'), { target: { value: 'Board night' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' }).find(b => b.closest('[role="dialog"]'))!);
    expect(screen.getByText('Saved')).toBeInTheDocument();

    fireEvent.click(menu());
    expect(screen.getByRole('button', { name: /Clear all/ })).toBeInTheDocument();
    expect(screen.queryByText('Saved')).toBeNull();

    fireEvent.click(menu());
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('a message that ran out while the menu was open does not come back', () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      const menu = () => screen.getAllByRole('button', { name: /menu/i })[0];
      fireEvent.click(menu());
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      act(() => { vi.advanceTimersByTime(10); });
      fireEvent.change(screen.getByLabelText('Name for this game'), { target: { value: 'Board night' } });
      fireEvent.click(screen.getAllByRole('button', { name: 'Save' }).find(b => b.closest('[role="dialog"]'))!);
      fireEvent.click(menu());
      act(() => { vi.advanceTimersByTime(5000); });
      fireEvent.click(menu());
      expect(screen.queryByText('Saved')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. One offline copy per page, without ad IDs
// ---------------------------------------------------------------------------

const SW = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');

type Res = { status: number; body: string; clone: () => Res };
const res = (body: string, status = 200): Res => ({ status, body, clone: () => res(body, status) });
const keyOf = (req: unknown) => (typeof req === 'string' ? req : (req as { url: string }).url);

/** public/sw.js in a small fake service-worker world whose cache keeps each copy under its key */
function worker(fetchImpl: (url: string) => Promise<Res>) {
  const store = new Map<string, Res>();
  const listeners: Record<string, (e: unknown) => void> = {};
  const opened: string[] = [];
  const cache = {
    put: (req: unknown, r: Res) => { store.set(keyOf(req), r); return Promise.resolve(); },
    match: (req: unknown) => Promise.resolve(store.get(keyOf(req))),
    addAll: () => Promise.resolve(),
  };
  const ctx = {
    self: {
      addEventListener: (t: string, fn: (e: unknown) => void) => { listeners[t] = fn; },
      location: { origin: 'https://customdiceroller.com' },
      skipWaiting: () => Promise.resolve(), clients: { claim: () => Promise.resolve() },
    },
    caches: {
      open: (name: string) => { opened.push(name); return Promise.resolve(cache); },
      match: (req: unknown) => Promise.resolve(store.get(keyOf(req))),
      keys: () => Promise.resolve([]),
    },
    fetch: (req: unknown) => fetchImpl(keyOf(req)),
    URL, Promise, setTimeout, console,
  };
  runInNewContext(SW, ctx);
  const open = (url: string) => {
    let response: Promise<Res> | undefined;
    const waits: Promise<unknown>[] = [];
    listeners.fetch({
      request: { method: 'GET', url, mode: 'navigate', destination: 'document' },
      respondWith: (p: Promise<Res>) => { response = p; },
      waitUntil: (p: Promise<unknown>) => { waits.push(p); },
    });
    return Promise.all(waits).then(() => response!);
  };
  return { store, open, opened };
}

describe('the phone keeps one offline copy per page, without ad IDs', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('three links to the home page, two with ad IDs, leave one copy saved under the plain address', async () => {
    const sw = worker(() => Promise.resolve(res('page')));
    for (const url of [
      'https://customdiceroller.com/',
      'https://customdiceroller.com/?fbclid=IwAR3xAbc',
      'https://customdiceroller.com/?gclid=Cj0KDef&utm_source=google',
    ]) {
      const p = sw.open(url);
      await vi.advanceTimersByTimeAsync(10);
      await p;
    }
    expect([...sw.store.keys()]).toEqual(['https://customdiceroller.com/']);
    expect([...sw.store.keys()].join(' ')).not.toMatch(/clid|utm/);
  });

  it('offline, an ad link still opens the saved page', async () => {
    let online = true;
    const sw = worker(() => (online ? Promise.resolve(res('page')) : Promise.reject(new TypeError('offline'))));
    const first = sw.open('https://customdiceroller.com/');
    await vi.advanceTimersByTimeAsync(10);
    await first;
    online = false;
    const later = sw.open('https://customdiceroller.com/?gclid=Cj0KDef');
    await vi.advanceTimersByTimeAsync(10);
    expect((await (await later)).body).toBe('page');
  });

  it('each landing page keeps its own copy', async () => {
    const sw = worker((url) => Promise.resolve(res(new URL(url).pathname)));
    for (const url of ['https://customdiceroller.com/catan-dice-roller/?fbclid=x', 'https://customdiceroller.com/d20-roller/']) {
      const p = sw.open(url);
      await vi.advanceTimersByTimeAsync(10);
      await p;
    }
    expect([...sw.store.keys()].sort()).toEqual([
      'https://customdiceroller.com/catan-dice-roller/',
      'https://customdiceroller.com/d20-roller/',
    ]);
  });

  it('the cache version moved on, so the old copies with ad IDs are cleared', () => {
    const name = SW.match(/const CACHE_NAME = 'diceroller-v(\d+)'/);
    expect(Number(name![1])).toBeGreaterThanOrEqual(6);
    expect(SW).toMatch(/if \(key !== CACHE_NAME\)[\s\S]*caches\.delete\(key\)/);
  });
});
