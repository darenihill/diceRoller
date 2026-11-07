import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import App from '../App';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import { restoreBackup } from '../utils/backup';
import { useStorage, freezeSaves, unfreezeSavesForTests } from '../hooks/useStorage';
import type { DiceData } from '../types';

// Stories walk, 2026-11-06 (reviews/2026-11-06-stories.md)
const die = (over: Partial<DiceData> = {}): DiceData => ({ id: 'd1', numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', held: false, ...over });
const putOut = (dice: DiceData[]) =>
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: dice } }));

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => { localStorage.clear(); unfreezeSavesForTests(); });
afterEach(() => document.getElementById('root')?.remove());

describe('stories walk fixes, 2026-11-06', () => {
  it('a JSON file that is not a backup is refused, and changes nothing', () => {
    localStorage.setItem('diceScale', '1.3');
    expect(restoreBackup({ notes: 'shopping list' })).toBe('invalid');
    expect(localStorage.getItem('diceScale')).toBe('1.3');
  });

  it('after an import, this page saves no games over the imported ones', () => {
    const { result } = renderHook(() => useStorage());
    restoreBackup({ version: '1.1', configs: { 'Game A': { name: 'Game A', config: [die()] } } });
    freezeSaves();
    // What the leaving page's autosave does on pagehide
    act(() => { result.current.saveConfig('systemAutosave', [die({ faces: 20 })]); });
    const games = JSON.parse(localStorage.getItem('diceConfigs')!);
    expect(games['Game A']).toBeTruthy();
    expect(games.systemAutosave).toBeUndefined();
  });

  it('a landing page that replaces your dice offers Undo', () => {
    putOut([die({ faces: 12 }), die({ id: 'd2', faces: 12 })]);
    const root = document.createElement('div');
    root.id = 'root';
    root.dataset.start = JSON.stringify({ preset: 'Catan' });
    document.body.appendChild(root);
    render(<App />);
    expect(screen.getByTestId('undo-bar')).toHaveTextContent(/Opened/);
  });

  it('words typed in Add custom text are kept when Done is tapped', () => {
    const updates: Partial<DiceData>[] = [];
    render(<DiceSettingsModal dice={die()} isOpen onClose={() => {}} onUpdate={(_, u) => updates.push(u)} onRemove={() => {}} onClone={() => {}} allDice={[die()]} />);
    const custom = screen.queryByLabelText('Custom face text') ?? (() => { fireEvent.click(screen.getByRole('tab', { name: /custom/i })); return screen.getByLabelText('Custom face text'); })();
    fireEvent.change(custom, { target: { value: 'Burgers' } });
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(updates.some(u => u.customFaces?.includes('Burgers'))).toBe(true);
  });
});
