import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildBackup, restoreBackup, BACKUP_VERSION } from '../utils/backup';
import { SAVED } from '../utils/savedValues';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const die = { id: 'a', numberValue: 3, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false };

function seedEverything() {
  localStorage.setItem(SAVED.games, JSON.stringify({ 'Catan night': { name: 'Catan night', config: [die] } }));
  localStorage.setItem(SAVED.defaultSet, JSON.stringify([die]));
  localStorage.setItem(SAVED.rollHistory, JSON.stringify([{ id: 'r', total: 7, details: ['d6: 7'] }]));
  localStorage.setItem(SAVED.theme, 'theme-felt');
  localStorage.setItem(SAVED.sound, 'true');
  localStorage.setItem(SAVED.diceScale, '1.2');
  localStorage.setItem(SAVED.rpgMode, 'true');
  localStorage.setItem(SAVED.shakeToRoll, 'true');
  localStorage.setItem(SAVED.targetHighlight, '7, 11');
  localStorage.setItem(SAVED.telemetry, 'false');
  localStorage.setItem(SAVED.usageStats, JSON.stringify({ totalRolls: 42 }));
}

beforeEach(() => localStorage.clear());
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('Export backup', () => {
  it('round trip brings back games and every setting', () => {
    seedEverything();
    const before = Object.fromEntries(Object.values(SAVED).map(k => [k, localStorage.getItem(k)]));
    const backup = JSON.parse(JSON.stringify(buildBackup()));
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup).toMatchObject({ rpgMode: true, shakeToRoll: true, targetHighlight: '7, 11', telemetryEnabled: false });

    localStorage.clear();
    expect(restoreBackup(backup)).toBe('ok');
    for (const key of Object.values(SAVED)) {
      if (key === SAVED.faceImages) continue;
      // Dice lists are cleaned on the way in, so compare what they hold
      if (key === SAVED.games || key === SAVED.defaultSet) {
        const faces = (raw: string | null) => JSON.stringify(JSON.parse(raw!), (_k, v) =>
          v && typeof v === 'object' && 'faces' in v ? [v.faces, v.color, v.numberValue, v.customFaces] : v);
        expect(faces(localStorage.getItem(key)), key).toBe(faces(before[key]));
        continue;
      }
      expect(localStorage.getItem(key), key).toEqual(before[key]);
    }
  });

  it('a file that is not a backup saves nothing', () => {
    expect(restoreBackup([1, 2, 3])).toBe('invalid');
    expect(restoreBackup('hello')).toBe('invalid');
    expect(localStorage.length).toBe(0);
  });

  it('an older backup still imports and leaves newer settings as they are', () => {
    localStorage.setItem(SAVED.rpgMode, 'true');
    localStorage.setItem(SAVED.shakeToRoll, 'true');
    const old = { version: '1.0', configs: { Old: { name: 'Old', config: [die] } }, theme: 'theme-light', soundEnabled: false };
    expect(restoreBackup(old)).toBe('ok');
    expect(localStorage.getItem(SAVED.theme)).toBe('theme-light');
    expect(JSON.parse(localStorage.getItem(SAVED.games)!).Old).toBeDefined();
    expect(localStorage.getItem(SAVED.rpgMode)).toBe('true');
    expect(localStorage.getItem(SAVED.shakeToRoll)).toBe('true');
  });

  it('says so when storage is full', () => {
    seedEverything();
    const backup = buildBackup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    expect(restoreBackup(backup)).toBe('full');
  });

  it('a browser that blocks storage still shows the app', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    render(<App />);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeInTheDocument();
  });
});
