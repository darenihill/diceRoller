// The owner's five Build picks of 2026-11-10 (Dispatch-Item custom-dice-roller/ask-2026-11-10-*)
import React from 'react';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
// Closing things unmount at once, as they do once a phone's exit animation ends
vi.mock('framer-motion', async () => ({
  ...(await vi.importActual<object>('framer-motion')),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
import App from '../App';
import { resetFaceImageCache, pruneFaceImages, holdFaceImageForUndo, releaseFaceImageHolds } from '../utils/faceImages';
import { UNDO_WINDOW_MS } from '../hooks/useUndo';
import { HelpModal } from '../components/modals/HelpModal';
import { SetsModal } from '../components/modals/SetsModal';
import fs from 'fs';
import path from 'path';
import { runInNewContext } from 'node:vm';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

afterEach(() => { vi.useRealTimers(); localStorage.clear(); resetFaceImageCache(); releaseFaceImageHolds(); });

const oneD4 = () => localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
  { id: 'a', numberValue: 1, faces: 4, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false }
] } }));
const bigRoll = () => document.querySelector('[data-roll-button]') as HTMLElement;

describe('After you type a roll, the big Roll button rolls it (owner, 2026-11-10)', () => {
  it('rolls the typed roll, swapping in its dice with Undo', () => {
    vi.useFakeTimers();
    localStorage.setItem('rpgMode', 'true');
    oneD4();
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: /Type a roll/ }), { target: { value: '2d6+3' } });
    fireEvent.click(bigRoll());
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });

    const history = JSON.parse(localStorage.getItem('rollHistory') ?? '[]');
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ typed: '2d6+3', modifier: 3 });
    expect(screen.getAllByLabelText(/^d6 showing/)).toHaveLength(2);
    expect(screen.queryAllByLabelText(/^d4 showing/)).toHaveLength(0);
    expect(screen.getByText('Rolled 2d6+3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getAllByLabelText(/^d4 showing/)).toHaveLength(1);
    expect(screen.getByTestId('modifier-chip')).toHaveTextContent('±0');
  });

  it('with the box empty or holding a roll that does not read, rolls the dice out as before', () => {
    vi.useFakeTimers();
    localStorage.setItem('rpgMode', 'true');
    oneD4();
    render(<App />);
    fireEvent.click(bigRoll());
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    fireEvent.change(screen.getByRole('textbox', { name: /Type a roll/ }), { target: { value: '2x6' } });
    fireEvent.click(bigRoll());
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });

    const history = JSON.parse(localStorage.getItem('rollHistory') ?? '[]');
    expect(history).toHaveLength(2);
    expect(history.every((h: { typed?: string }) => !h.typed)).toBe(true);
    expect(screen.getAllByLabelText(/^d4 showing/)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it("Help's typed-roll line names the big Roll button", () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    expect(screen.getByText(/Type a roll:/).closest('li')).toHaveTextContent(/big Roll button/);
  });
});

describe('Photos on removed dice are really deleted from the phone (owner, 2026-11-10)', () => {
  const png = 'data:image/png;base64,AAAA';
  const die = (id: string, name: string, customFaces: string[]) => ({ id, numberValue: 1, faces: customFaces.length, currentFaceIndex: 0, customFaces, color: '#E9EAEC', name, held: false });
  const stored = () => Object.keys(JSON.parse(localStorage.getItem('diceFaceImages') ?? '{}')).sort();
  const reload = (view: { unmount: () => void }) => {
    view.unmount();
    resetFaceImageCache();
    return render(<App />);
  };

  it('a picture nothing names is gone after a reload; pictures in a game, the default dice, History or on screen stay', () => {
    localStorage.setItem('diceFaceImages', JSON.stringify({
      gone: png, game: png, dflt: png, hist: png, shown: png,
    }));
    localStorage.setItem('diceConfigs', JSON.stringify({
      Kids: { name: 'Kids', config: [die('g', 'Kids', ['Mia:img:game', 'Leo'])] },
      systemAutosave: { name: 'systemAutosave', config: [die('s', 'Pets', ['Rex:img:shown', 'Tom'])] },
    }));
    localStorage.setItem('defaultDiceSet', JSON.stringify([die('d', 'Team', ['Ann:img:dflt', 'Bo'])]));
    localStorage.setItem('rollHistory', JSON.stringify([{ id: 'r1', total: 0, details: ['Old: Zed'], at: 1,
      set: JSON.stringify([[[2, ['Zed:img:hist', 'Ivy'], null]], null]) }]));
    const view = render(<App />);
    expect(stored()).toEqual(['dflt', 'game', 'hist', 'shown']);
    reload(view);
    expect(stored()).toEqual(['dflt', 'game', 'hist', 'shown']);
  });

  it('a removed picture stays while its Undo is up and the die settings are open, then goes, and stays gone after a reload', () => {
    vi.useFakeTimers();
    localStorage.setItem('diceFaceImages', JSON.stringify({ pic1: png }));
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      die('k', 'Kids', ['Mia:img:pic1', 'Leo']),
    ] } }));
    const view = render(<App />);
    expect(stored()).toEqual(['pic1']);
    fireEvent.click(screen.getByLabelText('Settings for Kids'));
    fireEvent.click(screen.getByRole('tab', { name: 'Custom Faces' }));
    fireEvent.click(screen.getByLabelText('Remove picture from face 1'));
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Removed picture');
    expect(stored()).toEqual(['pic1']);
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 50); });
    expect(screen.queryByTestId('undo-bar')).toBeNull();
    // Die settings still open: kept until they close
    expect(stored()).toEqual(['pic1']);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.queryByRole('tab', { name: 'Custom Faces' })).toBeNull();
    expect(stored()).toEqual([]);
    vi.useRealTimers();
    reload(view);
    expect(stored()).toEqual([]);
  });

  it('a removed die keeps its picture while Undo is up, Undo brings it back whole, and once Undo runs out it goes', () => {
    vi.useFakeTimers();
    localStorage.setItem('diceFaceImages', JSON.stringify({ pic1: png }));
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      die('k', 'Kids', ['Mia:img:pic1', 'Leo']), die('n', 'Other', ['A', 'B']),
    ] } }));
    render(<App />);
    const removeKids = () => {
      fireEvent.click(screen.getByLabelText('Settings for Kids'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    };
    removeKids();
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Removed Kids');
    expect(stored()).toEqual(['pic1']);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 50); });
    expect(screen.getByLabelText('Settings for Kids')).toBeInTheDocument();
    expect(stored()).toEqual(['pic1']);

    removeKids();
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 50); });
    expect(screen.queryByTestId('undo-bar')).toBeNull();
    expect(stored()).toEqual([]);
  });

  it('keeps everything when storage cannot be read, and keeps pictures held for an Undo', () => {
    localStorage.setItem('diceFaceImages', JSON.stringify({ held: png, loose: png }));
    holdFaceImageForUndo('held');
    expect(pruneFaceImages([])).toBe(1);
    expect(stored()).toEqual(['held']);
    const spy = vi.spyOn(Storage.prototype, 'key').mockImplementation(() => { throw new Error('blocked'); });
    releaseFaceImageHolds();
    expect(pruneFaceImages([])).toBe(0);
    spy.mockRestore();
    expect(stored()).toEqual(['held']);
  });
});

describe('Saved games load from a tap anywhere on their row (owner, 2026-11-10)', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../App.module.css'), 'utf-8');
  const rule = (selector: string) => {
    const m = css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*]/g, '\\$&')}\\s*\\{([^}]+)\\}`));
    expect(m, selector).not.toBeNull();
    return m![1];
  };

  it('the load target fills the row: full height, everything left of the bin, at least 48px tall', () => {
    // The row gives its top, bottom and left padding to the load target
    expect(rule('.setsGrid .saveCard')).toMatch(/padding:\s*0 4px 0 0;/);
    const load = rule('.setsGrid .saveCardBtn');
    expect(load).toMatch(/align-self:\s*stretch/);
    expect(load).toMatch(/min-height:\s*48px/);
    expect(rule('.saveCardBtn')).toMatch(/flex-grow:\s*1/);
    // The text keeps its place: 4px row + 8px button before, 12px button now
    expect(load).toMatch(/padding:\s*12px 0 12px 12px/);
  });

  it('the bin stays 48 x 48 beside a long name', () => {
    const icon = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8').match(/\n\.md-icon-button\s*\{([^}]+)\}/)![1];
    expect(icon).toMatch(/width:\s*48px/);
    expect(icon).toMatch(/height:\s*48px/);
    const bin = rule('.saveCardBin');
    expect(bin).toMatch(/flex-shrink:\s*0/);
    expect(bin).toMatch(/margin:\s*4px 0/);

    render(<SetsModal isOpen onClose={() => {}} savedConfigs={{ 'A rather long game name that wraps': { name: 'A rather long game name that wraps', config: [] } }}
      onLoadSet={() => {}} onDeleteConfig={() => {}} onExportBackup={() => {}} onImportBackup={() => {}} />);
    const del = screen.getByLabelText('Delete A rather long game name that wraps');
    expect(del.className).toMatch(/saveCardBin/);
    const load = screen.getByRole('button', { name: 'A rather long game name that wraps' });
    expect(load.className).toMatch(/saveCardBtn/);
    expect(load.parentElement).toBe(del.parentElement);
  });
});

describe('With metrics off, the app no longer contacts Google for its font (owner, 2026-11-10)', () => {
  const root = path.resolve(__dirname, '../..');
  const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf-8');
  const pages = ['index.html', 'dnd-dice-roller/index.html', 'd20-roller/index.html', 'catan-dice-roller/index.html', 'classroom-dice-roller/index.html'];

  it('the home page and the four search pages load nothing from Google Fonts', () => {
    for (const page of pages) {
      const html = read(page);
      expect(html, page).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
      expect(html, page).toContain('<link rel="preload" href="/fonts/roboto-latin.woff2" as="font" type="font/woff2" crossorigin />');
    }
  });

  it('Roboto 400, 500 and 700 come from the site, with font-display: swap', () => {
    const css = read('src/index.css');
    const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(m => m[1]);
    expect(faces.map(f => f.match(/font-weight:\s*(\d+)/)![1])).toEqual(['400', '500', '700']);
    for (const f of faces) {
      expect(f).toMatch(/font-family:\s*'Roboto'/);
      expect(f).toMatch(/font-display:\s*swap/);
      expect(f).toMatch(/src:\s*url\('\/fonts\/roboto-latin\.woff2'\) format\('woff2'\)/);
    }
    const file = fs.readFileSync(path.join(root, 'public/fonts/roboto-latin.woff2'));
    expect(file.subarray(0, 4).toString('latin1')).toBe('wOF2');
    expect(file.length).toBeLessThan(100_000);
  });

  it('the service worker saves the font for offline and leaves other sites alone', () => {
    const sw = read('public/sw.js');
    expect(sw).toContain("'/fonts/roboto-latin.woff2'");
    expect(sw).not.toMatch(/googleapis|gstatic|GoogleFont/);

    const listeners: Record<string, (e: unknown) => void> = {};
    const added: string[] = [];
    const cache = { addAll: (list: string[]) => { added.push(...list); return Promise.resolve(); }, match: () => Promise.resolve(undefined), put: () => Promise.resolve() };
    runInNewContext(sw, {
      self: { addEventListener: (t: string, fn: (e: unknown) => void) => { listeners[t] = fn; }, location: { origin: 'https://customdiceroller.com' }, skipWaiting: () => {} },
      caches: { open: () => Promise.resolve(cache), match: () => Promise.resolve(undefined), keys: () => Promise.resolve([]) },
      fetch: () => Promise.resolve({ status: 200, text: () => Promise.resolve(''), clone() { return this; } }),
      URL, Promise, setTimeout, console,
    });
    let installing: Promise<unknown> | undefined;
    listeners.install({ waitUntil: (p: Promise<unknown>) => { installing = p; } });
    const handled = (url: string) => {
      let used = false;
      listeners.fetch({ request: { method: 'GET', url, mode: 'cors', destination: 'font' }, respondWith: () => { used = true; }, waitUntil: () => {} });
      return used;
    };
    expect(handled('https://customdiceroller.com/fonts/roboto-latin.woff2')).toBe(true);
    expect(handled('https://fonts.gstatic.com/s/roboto/v51/x.woff2')).toBe(false);
    expect(handled('https://fonts.googleapis.com/css2?family=Roboto')).toBe(false);
    return installing!.then(() => expect(added).toContain('/fonts/roboto-latin.woff2'));
  });
});

describe('Safety net: the site refuses code from anywhere except itself and Google (owner, 2026-11-10)', () => {
  const root = path.resolve(__dirname, '../..');
  const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf-8');
  const pages = ['index.html', 'dnd-dice-roller/index.html', 'd20-roller/index.html', 'catan-dice-roller/index.html', 'classroom-dice-roller/index.html'];
  const policyOf = (html: string) => {
    const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)" \/>/);
    expect(m).not.toBeNull();
    return Object.fromEntries(m![1].split(/;\s*/).map(d => { const [name, ...values] = d.trim().split(/\s+/); return [name, values]; }));
  };

  it.each(pages)('%s carries the policy before any script, and every inline script is allowed by its hash', async (page) => {
    const html = read(page);
    const { inlineScriptHashes, withCsp } = await import('../../scripts/landing-pages.mjs');
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<script'));
    // Up to date with the inline scripts (run npm run landing after editing one)
    expect(withCsp(html)).toBe(html);
    const p = policyOf(html);
    const hashes = inlineScriptHashes(html);
    expect(hashes).toHaveLength(2); // Google Analytics' start and the service worker sign-up
    expect(p['script-src']).toEqual(["'self'", ...hashes, 'https://www.googletagmanager.com']);
    expect(p['script-src']).not.toContain("'unsafe-inline'");
    expect(p['script-src']).not.toContain("'unsafe-eval'");
    expect(p['default-src']).toEqual(["'self'"]);
    expect(p['img-src']).toEqual(expect.arrayContaining(["'self'", 'data:', 'blob:', 'https://*.google-analytics.com', 'https://*.googletagmanager.com']));
    expect(p['connect-src']).toEqual(expect.arrayContaining(["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com']));
    expect(p['worker-src']).toEqual(["'self'"]);
    expect(p['manifest-src']).toEqual(["'self'"]);
    expect(p['font-src']).toEqual(["'self'"]);
    expect(p['object-src']).toEqual(["'none'"]);
    // A meta policy ignores frame-ancestors, so it isn't claimed
    expect(p['frame-ancestors']).toBeUndefined();
    // Nothing else that runs: no inline event handlers
    expect(html).not.toMatch(/\son[a-z]+="/);
  });

  it('natural 20 confetti draws on the page, not in a blob: worker the policy refuses', () => {
    const src = fs.readFileSync(path.join(root, 'src/utils/confetti.ts'), 'utf-8');
    expect(src).toMatch(/confetti\.create\(undefined, \{[^}]*useWorker: false/);
  });
});
