import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from '../App';
import { HistoryModal } from '../components/modals/HistoryModal';
import { sanitizeRollHistory, type RollHistoryItem } from '../hooks/useDiceState';
import { diceFromHistory, canReuse } from '../utils/historyReuse';
import { luckSet } from '../utils/fairOdds';
import type { DiceData } from '../types';

// Owner, 2026-11-07: "Tap a past roll in History to put those dice back out"
beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => localStorage.clear());

const die = (faces: number, color: string, name = '', customFaces: string[] = []): DiceData =>
  ({ id: Math.random().toString(36), numberValue: 1, faces, customFaces, color, name, held: false });

const rolled = (dice: DiceData[], extra: Partial<RollHistoryItem> = {}): RollHistoryItem => ({
  id: Math.random().toString(36), total: 9, details: ['a: 4', 'b: 5'],
  set: luckSet(dice), colors: dice.map(d => d.color), names: dice.map(d => d.name ?? ''), ...extra,
});

describe('putting a past roll back out', () => {
  it('rebuilds the dice with their faces, colors and names, unrolled and not held', () => {
    const dice = [die(8, '#B24BF3', 'Fire'), die(6, '#228B22', '', ['Tacos', 'Pizza'])];
    dice[0].held = true;
    const back = diceFromHistory(rolled(dice))!;
    expect(back).toHaveLength(2);
    expect(back[0]).toMatchObject({ faces: 8, color: '#B24BF3', name: 'Fire', held: false, numberValue: 1 });
    expect(back[1]).toMatchObject({ faces: 6, color: '#228B22', customFaces: ['Tacos', 'Pizza'] });
  });

  it('older rolls without colors still come back, and single dice or very old rolls cannot', () => {
    const old = rolled([die(20, '#fff')], { colors: undefined, names: undefined });
    expect(diceFromHistory(old)![0].color).toBeUndefined();
    expect(canReuse({ ...old, single: true })).toBe(false);
    expect(canReuse({ id: 'x', total: 3, details: [] })).toBe(false);
    expect(canReuse({ id: 'x', total: 3, details: [], typed: '2d6+3' })).toBe(true);
  });

  it('a backup keeps colors and names, trimmed, and drops ones of the wrong kind', () => {
    const [item] = sanitizeRollHistory([{ id: 'r', total: 4, details: [], colors: ['#123456', 7], names: ['x'.repeat(500)] }]);
    expect(item.colors).toEqual(['#123456', '']);
    expect(item.names![0].length).toBeLessThan(500);
    expect(sanitizeRollHistory([{ id: 'r', total: 4, details: [], colors: 'red' }])[0].colors).toBeUndefined();
  });

  it('History rows are buttons that hand back their roll', () => {
    const onReuse = vi.fn();
    const roll = rolled([die(6, '#E32227')]);
    render(<HistoryModal isOpen onClose={() => {}} rollHistory={[roll, { ...roll, id: 's', single: true }]} onClearHistory={() => {}} onReuse={onReuse} />);
    expect(screen.getByText('Tap a roll to put its dice back out.')).toBeTruthy();
    const buttons = screen.getAllByRole('button', { name: /Put these dice back out/ });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(onReuse).toHaveBeenCalledWith(roll);
  });
});

describe('in the app', () => {
  const openHistory = () => {
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
  };

  it('tapping a roll closes History and puts its dice out, with Undo', async () => {
    const three = [die(20, '#B24BF3'), die(20, '#B24BF3'), die(4, '#228B22')];
    localStorage.setItem('rollHistory', JSON.stringify([rolled(three)]));
    render(<App />);
    const before = screen.getAllByRole('group', { name: / showing / }).length;
    openHistory();
    fireEvent.click(screen.getByRole('button', { name: /Put these dice back out/ }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /Put these dice back out/ })).toBeNull());
    expect(screen.getAllByRole('group', { name: / showing / })).toHaveLength(3);
    const bar = screen.getByText('Loaded dice from History').closest('[role="status"], [role="alert"], div')!;
    fireEvent.click(within(bar.parentElement!).getByRole('button', { name: /undo/i }));
    expect(screen.getAllByRole('group', { name: / showing / })).toHaveLength(before);
  });

  it('a typed roll goes back into the roll box, ready to roll, turning RPG Mode on', () => {
    localStorage.setItem('rollHistory', JSON.stringify([rolled([die(6, '#384050'), die(6, '#384050')], { typed: '2d6+3' })]));
    render(<App />);
    openHistory();
    fireEvent.click(screen.getByRole('button', { name: /Put 2d6\+3 back in the roll box/ }));
    expect((screen.getByRole('textbox', { name: /Type a roll, like/ }) as HTMLInputElement).value).toBe('2d6+3');
  });
});
