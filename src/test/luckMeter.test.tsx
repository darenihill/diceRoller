import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { fairOdds, luckRows, furthestFromFair, luckSet } from '../utils/fairOdds';
import { performance } from 'node:perf_hooks';
import { HistoryModal } from '../components/modals/HistoryModal';
import type { DiceData } from '../types';
import type { RollHistoryItem } from '../hooks/useDiceState';

const die = (faces: number, id = String(Math.random())): DiceData => ({
  id, numberValue: 1, faces, customFaces: [], color: '#fff', held: false,
});

const near = (a: number | undefined, b: number) => expect(a ?? 0).toBeCloseTo(b, 10);

describe('fair-dice odds', () => {
  it('works out 2d6 exactly', () => {
    const odds = fairOdds([die(6), die(6)], false, 0, 'normal');
    near(odds.get(7), 6 / 36);
    near(odds.get(2), 1 / 36);
    expect(odds.has(13)).toBe(false);
    near([...odds.values()].reduce((a, b) => a + b, 0), 1);
  });

  it('keeps the best die with Advantage', () => {
    const odds = fairOdds([die(20), die(20)], true, 0, 'advantage');
    near(odds.get(20), 39 / 400);
    near(odds.get(1), 1 / 400);
  });

  it('keeps the worst die with Disadvantage', () => {
    const odds = fairOdds([die(20), die(20)], true, 0, 'disadvantage');
    near(odds.get(1), 39 / 400);
  });

  it('adds the modifier in RPG Mode only', () => {
    expect(fairOdds([die(6)], true, 2, 'normal').has(8)).toBe(true);
    expect(fairOdds([die(6)], false, 2, 'normal').has(8)).toBe(false);
  });

  it('counts custom faces by their value', () => {
    const d = { ...die(3), customFaces: ['1', '1', '5'] };
    const odds = fairOdds([d], false, 0, 'normal');
    near(odds.get(1), 2 / 3);
    near(odds.get(5), 1 / 3);
  });
});

describe('held dice and big tables', () => {
  it('counts a held die at its value', () => {
    const odds = fairOdds([{ ...die(6), held: true, numberValue: 6 }, die(6)], false, 0, 'normal');
    expect([...odds.keys()].sort((a, b) => a - b)).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it('lets a held d20 take part in Advantage', () => {
    const odds = fairOdds([{ ...die(20), held: true, numberValue: 15 }, die(20)], true, 0, 'advantage');
    near(odds.get(15), 15 / 20);
    near(odds.get(20), 1 / 20);
    expect(odds.has(3)).toBe(false);
  });

  it('skips the marks rather than stall on a huge table', () => {
    const start = performance.now();
    const odds = fairOdds(Array.from({ length: 20 }, () => die(1000)), false, 0, 'normal');
    expect(odds.size).toBe(0);
    expect(performance.now() - start).toBeLessThan(200);
  });

  it('still works out a big but fair-sized table', () => {
    expect(fairOdds(Array.from({ length: 10 }, () => die(20)), false, 0, 'normal').size).toBe(191);
  });

  it('notices a change to held dice or RPG settings', () => {
    const d = [die(6, 'a')];
    expect(luckSet(d, true, 2, 'normal')).not.toBe(luckSet(d, true, 3, 'normal'));
    expect(luckSet(d)).not.toBe(luckSet([{ ...d[0], held: true }]));
    expect(luckSet(d, false, 2, 'advantage')).toBe(luckSet(d, false, 0, 'normal'));
  });
});

describe('Luck Meter rows', () => {
  it('lists totals not rolled yet as zero rows', () => {
    const odds = fairOdds([die(6)], false, 0, 'normal');
    const rows = luckRows(new Map([[3, 2]]), odds, 2);
    expect(rows.map(r => r.total)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows.find(r => r.total === 1)?.count).toBe(0);
    near(rows[0].fair, 2 / 6);
  });

  it('skips zero rows when there are too many totals', () => {
    const odds = fairOdds([die(100)], false, 0, 'normal');
    expect(luckRows(new Map([[50, 1]]), odds, 1).map(r => r.total)).toEqual([50]);
  });

  it('names the total furthest from fair', () => {
    const odds = fairOdds([die(6)], false, 0, 'normal');
    const rows = luckRows(new Map([[6, 5], [1, 1]]), odds, 6);
    expect(furthestFromFair(rows)?.total).toBe(6);
  });
});

const roll = (total: number, set?: string): RollHistoryItem =>
  ({ id: String(Math.random()), total, details: [String(total)], set });

describe('History modal', () => {
  const dice = [die(6, 'a')];
  const set = luckSet(dice);

  it('draws a fair-dice mark on each bar and names the odd total', () => {
    const { container } = render(
      <HistoryModal isOpen onClose={() => {}} onClearHistory={() => {}} dice={dice}
        rollHistory={[roll(6, set), roll(6, set), roll(6, set), roll(2, set)]} />,
    );
    expect(container.ownerDocument.querySelectorAll('[data-fair]').length).toBe(6);
    expect(container.ownerDocument.querySelector('[data-furthest]')?.getAttribute('data-furthest')).toBe('6');
    expect(container.ownerDocument.body.textContent).not.toContain('they changed');
  });

  it('says so when the dice changed since some rolls', () => {
    const { container } = render(
      <HistoryModal isOpen onClose={() => {}} onClearHistory={() => {}} dice={dice}
        rollHistory={[roll(9, luckSet([die(6), die(6)])), roll(3, set)]} />,
    );
    expect(container.ownerDocument.body.textContent).toContain('they changed since some of these rolls');
  });
});
