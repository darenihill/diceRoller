/**
 * A hand-edited or damaged backup could store Usage stats of the wrong kind.
 * Opening Usage stats then blanked the whole app (security review, 2026-11-07).
 */
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cleanStats, getLocalStats } from '../utils/analytics';
import { restoreBackup } from '../utils/backup';
import { SAVED } from '../utils/savedValues';
import { StatsModal } from '../components/modals/StatsModal';

beforeEach(() => localStorage.clear());

describe('Usage stats from a damaged backup', () => {
  it('drops values of the wrong kind and keeps the good ones', () => {
    const stats = cleanStats({ totalRolls: null, highestRoll: {}, presetsLoadedCount: null, totalSessions: 4, favoriteTheme: 7 });
    expect(stats.totalRolls).toBe(0);
    expect(stats.highestRoll).toBe(0);
    expect(stats.presetsLoadedCount).toEqual({});
    expect(stats.totalSessions).toBe(4);
    expect(stats.favoriteTheme).toBe('theme-dark');
  });

  it('keeps only number counts per game', () => {
    expect(cleanStats({ presetsLoadedCount: { Catan: 3, Bad: 'x', Worse: {} } }).presetsLoadedCount).toEqual({ Catan: 3 });
  });

  it('a stats value that is not an object falls back to fresh stats', () => {
    expect(cleanStats([1, 2]).totalRolls).toBe(0);
    expect(cleanStats('hello').totalRolls).toBe(0);
  });

  it('Usage stats still opens after importing a backup with broken stats', () => {
    expect(restoreBackup({ version: '1.1', usageStats: { totalRolls: null, presetsLoadedCount: null, highestRoll: {}, totalDiceRolled: 'lots' } })).toBe('ok');
    expect(localStorage.getItem(SAVED.usageStats)).not.toBeNull();
    expect(getLocalStats().totalDiceRolled).toBe(0);
    render(<StatsModal isOpen onClose={() => {}} />);
    expect(screen.getByText('Total rolls')).toBeInTheDocument();
  });
});
