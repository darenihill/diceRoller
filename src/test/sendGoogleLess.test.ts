import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getLocalStats, recordSessionStart, trackEvent } from '../utils/analytics';

// Send Google less (owner, 2026-11-10, way "Cut what isn't used"): rolls
// send how many dice and which mode, not the total or modifier; the second
// visit count and an unused second sender go.

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
type Gtag = (command: string, action: string, params?: Record<string, unknown>) => void;
let gtag: ReturnType<typeof vi.fn<Gtag>>;

beforeEach(() => {
  localStorage.clear();
  gtag = vi.fn<Gtag>();
  (window as unknown as { gtag?: Gtag }).gtag = gtag;
});
afterEach(() => { delete (window as unknown as { gtag?: Gtag }).gtag; localStorage.clear(); });

describe('A roll', () => {
  it('sends its dice count and mode, never its total or modifier', () => {
    trackEvent('roll_dice', { diceCount: 2, rpgMode: true, rollAdvantage: 'advantage' }, { sum: 11 });
    expect(gtag).toHaveBeenCalledTimes(1);
    const [, name, params] = gtag.mock.calls[0];
    expect(name).toBe('roll_dice');
    expect(params).toEqual({ diceCount: 2, rpgMode: true, rollAdvantage: 'advantage' });
    expect(JSON.stringify(params)).not.toMatch(/sum|modifier|11/);
  });

  it('still counts its total in Usage stats on the phone', () => {
    trackEvent('roll_dice', { diceCount: 2, rpgMode: false, rollAdvantage: 'normal' }, { sum: 11 });
    trackEvent('roll_dice', { diceCount: 2, rpgMode: false, rollAdvantage: 'normal' }, { sum: 4 });
    const stats = getLocalStats();
    expect(stats).toMatchObject({ totalRolls: 2, totalDiceRolled: 4, totalSumRolled: 15, highestRoll: 11 });
  });

  it('every roll the app sends leaves the total and modifier out', () => {
    const app = read('src/App.tsx');
    const rolls = [...app.matchAll(/trackEvent\('roll_dice', (\{[^}]*\})/g)].map(m => m[1]);
    expect(rolls.length).toBe(2);
    for (const payload of rolls) expect(payload).not.toMatch(/\bsum\b|\bmodifier\b/);
  });

  it('nothing is sent with Page metrics off', () => {
    localStorage.setItem('telemetryEnabled', 'false');
    trackEvent('roll_dice', { diceCount: 2 }, { sum: 7 });
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe('The duplicate visit count and the second sender are gone', () => {
  it('opening the app sends Google nothing of its own (Google counts the visit itself)', () => {
    const before = getLocalStats().totalSessions;
    recordSessionStart();
    expect(gtag).not.toHaveBeenCalled();
    expect(getLocalStats().totalSessions).toBe(before + 1);
  });

  it('no session_start, no custom endpoint, no event names that nothing sends', () => {
    const analytics = read('src/utils/analytics.ts');
    expect(analytics).not.toMatch(/session_start|VITE_ANALYTICS_ENDPOINT|sendBeacon|dispatchExternalEvent|getDeviceCategory/);
    for (const name of ['page_view', 'dice_removed', 'dice_customized', 'modifier_toggled']) {
      expect(analytics).not.toContain(`'${name}'`);
    }
    // Every name left in the list is one the app sends
    const names = [...analytics.slice(analytics.indexOf('export type AnalyticsEventName')).matchAll(/\| '([a-z_]+)'/g)].map(m => m[1]);
    const app = read('src/App.tsx');
    for (const name of names) expect(app, name).toContain(`trackEvent('${name}'`);
  });
});
