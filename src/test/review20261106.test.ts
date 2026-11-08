import { describe, it, expect, beforeEach } from 'vitest';
import LZString from 'lz-string';
import { getLocalStats } from '../utils/analytics';
import { readShareLink, MAX_SHARE_JSON } from '../utils/setName';
import { restoreBackup, BACKUP_VERSION } from '../utils/backup';

// Security pass, 2026-11-06 (reviews/2026-11-06-security.md)
beforeEach(() => localStorage.clear());

describe('review fixes, 2026-11-06', () => {
  it('stats from a hand-edited backup are checked and can never turn analytics back on', () => {
    localStorage.setItem('telemetryEnabled', 'false');
    localStorage.setItem('diceAnalyticsStats', JSON.stringify({ telemetryEnabled: true, presetsLoadedCount: null, totalRolls: 'lots' }));
    const stats = getLocalStats();
    expect(stats.telemetryEnabled).toBe(false);
    expect(stats.presetsLoadedCount).toEqual({});
    expect(stats.totalRolls).toBe(0);
  });

  it('a share link that unpacks too big is refused before it is read', () => {
    const huge = '[' + '{},'.repeat(MAX_SHARE_JSON / 3) + '{}]';
    const { dice } = readShareLink('#share=' + LZString.compressToEncodedURIComponent(huge));
    expect(dice).toEqual([]);
    const ok = readShareLink('#share=' + LZString.compressToEncodedURIComponent(JSON.stringify([{ id: 'a', numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', held: false }])));
    expect(ok.dice).toHaveLength(1);
  });

  it('a backup cannot store a giant target list', () => {
    restoreBackup({ version: BACKUP_VERSION, configs: {}, defaultSet: [], rollHistory: [], targetHighlight: '7,'.repeat(5000) });
    expect(localStorage.getItem('targetHighlight')!.length).toBeLessThanOrEqual(200);
  });
});
