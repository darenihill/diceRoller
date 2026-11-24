import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { landingPages } from '../../landing/pages.mjs';
import { renderPage } from '../../scripts/landing-pages.mjs';
import { useStorage, unfreezeSavesForTests } from '../hooks/useStorage';
import { useDiceState } from '../hooks/useDiceState';
import { restoreBackup } from '../utils/backup';
import { ROLL_DURATION_MS } from '../utils/constants';
import type { DiceData } from '../types';

/*
 * Fixes from the 2026-11-21 code review (Gemini, checked by Opus):
 * reviews/2026-11-23-neon-fixes.md. Each test failed before its fix.
 */

const die = (over: Partial<DiceData> = {}): DiceData => ({ id: 'd1', numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', held: false, ...over });
const games = () => JSON.parse(localStorage.getItem('diceConfigs') ?? '{}');
/** What another tab's write looks like to this one */
const storageEventFromOtherTab = () => window.dispatchEvent(new StorageEvent('storage', {
  key: 'diceConfigs', newValue: localStorage.getItem('diceConfigs'), storageArea: localStorage,
}));

beforeEach(() => { localStorage.clear(); unfreezeSavesForTests(); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); });

describe('Two open tabs keep each other\'s saved games (high)', () => {
  it('a game saved in one tab survives the other tab\'s autosave', () => {
    const tabA = renderHook(() => useStorage());
    const tabB = renderHook(() => useStorage());
    act(() => tabA.result.current.saveConfig('Catan night', [die()]));
    // Tab B, opened before the save, is hidden: its autosave runs
    act(() => tabB.result.current.saveConfig('systemAutosave', [die({ faces: 20 })]));
    expect(games()['Catan night']).toBeTruthy();
    expect(games().systemAutosave.config[0].faces).toBe(20);
  });

  it('a game deleted in one tab stays deleted after the other tab saves', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ Old: { name: 'Old', config: [] } }));
    const tabA = renderHook(() => useStorage());
    const tabB = renderHook(() => useStorage());
    act(() => tabA.result.current.deleteConfig('Old'));
    act(() => tabB.result.current.saveConfig('systemAutosave', []));
    expect(games().Old).toBeUndefined();
  });

  it('the other tab\'s Games list picks up the new game', () => {
    const tabA = renderHook(() => useStorage());
    const tabB = renderHook(() => useStorage());
    act(() => tabA.result.current.saveConfig('Catan night', [die()]));
    act(() => { storageEventFromOtherTab(); });
    expect(tabB.result.current.savedConfigs['Catan night']).toBeTruthy();
  });

  it('a game kept on screen when storage was full is not dropped by the next save', () => {
    const tab = renderHook(() => useStorage());
    const full = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    act(() => tab.result.current.saveConfig('Catan night', [die()]));
    full.mockRestore();
    act(() => tab.result.current.saveConfig('systemAutosave', []));
    expect(tab.result.current.savedConfigs['Catan night']).toBeTruthy();
    expect(games()['Catan night']).toBeTruthy();
  });
});

describe('Landing pages carry their own description (medium)', () => {
  const template = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
  const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const homeDescription = template.match(/<meta name="description" content="([^"]*)"/)![1];

  it.each(landingPages.map(p => [p.slug, p] as const))('%s: description, og and twitter all say its own text', (slug, page) => {
    const html = renderPage(template, page);
    expect(html.split(`content="${attr(page.description)}"`).length - 1, slug).toBe(3);
    expect(html, slug).not.toContain(homeDescription);
    // The committed page is the generated one
    expect(readFileSync(join(process.cwd(), slug, 'index.html'), 'utf8')).toContain(`content="${attr(page.description)}"`);
  });
});

describe('A backup that runs out of room changes nothing (medium)', () => {
  it('stops at the first refused write and puts back what it had written', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ Mine: { name: 'Mine', config: [die()] } }));
    localStorage.setItem('appTheme', 'theme-light');
    localStorage.setItem('soundEnabled', 'true');
    const realSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'rollHistory') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      realSet.call(this, key, value);
    });
    const result = restoreBackup({
      version: '1.1',
      configs: { Theirs: { name: 'Theirs', config: [die()] } },
      rollHistory: [{ id: 'r', total: 3, details: [] }],
      theme: 'theme-dark',
      soundEnabled: false,
    });
    expect(result).toBe('full');
    expect(Object.keys(games())).toEqual(['Mine']);
    expect(localStorage.getItem('appTheme')).toBe('theme-light');
    expect(localStorage.getItem('soundEnabled')).toBe('true');
  });
});

describe('Removing or clearing dice mid-roll (low)', () => {
  const rollThen = (step: 'remove' | 'clear') => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDiceState());
    act(() => result.current.setDiceList([die(), die({ id: 'd2' })]));
    act(() => { result.current.rollDice(); });
    act(() => { if (step === 'remove') result.current.removeDice('d2'); else result.current.clearAllDice(); });
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 100); });
    return result;
  };

  it('removing a die while the dice tumble logs no roll with it in', () => {
    const result = rollThen('remove');
    expect(result.current.rollHistory).toHaveLength(0);
    expect(result.current.isRolling).toBe(false);
    expect(result.current.diceList.map(d => d.id)).toEqual(['d1']);
  });

  it('a die put back by Undo while another roll tumbles keeps its own value', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDiceState());
    act(() => result.current.setDiceList([die({ faces: 1000 }), die({ id: 'd2' })]));
    act(() => { result.current.rollDice(); });
    const copy = result.current.diceList[0];
    act(() => result.current.removeDice('d1'));
    act(() => { result.current.rollDice(); });
    act(() => result.current.insertDiceAt(copy, 0));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 100); });
    expect(result.current.diceList[0].numberValue).toBe(1);
    expect(result.current.diceList[0].targetValue).toBeUndefined();
  });

  it('Clear All while the dice tumble logs no roll', () => {
    const result = rollThen('clear');
    expect(result.current.rollHistory).toHaveLength(0);
    expect(result.current.isRolling).toBe(false);
    expect(result.current.diceList).toHaveLength(0);
  });
});

describe('Only a Dice Roller backup imports (low)', () => {
  it('a package.json-like file is refused and changes nothing', () => {
    localStorage.setItem('diceScale', '1.3');
    expect(restoreBackup({ name: 'my-app', version: '1.0.0', dependencies: {} })).toBe('invalid');
    expect(restoreBackup({ version: 2 })).toBe('invalid');
    expect(localStorage.getItem('diceScale')).toBe('1.3');
  });

  it('real backups, old and new, still import', () => {
    expect(restoreBackup({ version: '1.0', configs: {} })).toBe('ok');
    expect(restoreBackup({ version: '1.1', theme: 'theme-dark' })).toBe('ok');
  });
});

describe('A game named __proto__ (low)', () => {
  it('survives a reload', () => {
    localStorage.setItem('diceConfigs', '{"__proto__":{"name":"__proto__","config":[]}}');
    const { result } = renderHook(() => useStorage());
    expect(Object.keys(result.current.savedConfigs)).toContain('__proto__');
    act(() => result.current.saveConfig('Other', []));
    expect(Object.keys(games())).toEqual(['__proto__', 'Other']);
  });

  it('comes in from a backup', () => {
    restoreBackup(JSON.parse('{"version":"1.1","configs":{"__proto__":{"name":"__proto__","config":[]}}}'));
    expect(Object.keys(games())).toContain('__proto__');
  });
});
