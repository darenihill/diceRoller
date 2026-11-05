import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HistoryModal } from '../components/modals/HistoryModal';
import { luckSet } from '../utils/fairOdds';
import { diceSummary, gameKeyFor, gameKeyOf, recentGroups } from '../utils/rollGroups';
import { sanitizeRollHistory, type RollHistoryItem } from '../hooks/useDiceState';
import type { DiceData } from '../types';

const die = (faces: number, id = String(Math.random())): DiceData => ({ id, numberValue: 1, faces, customFaces: [], color: '#384050', held: false });
const catan = [die(6), die(6)];
const clever = [die(6), die(6), die(6), die(6), die(6), die(6)];
const d20 = [die(20)];
const d8 = [die(8)];
const d4 = [die(4)];
let n = 0;
const roll = (total: number, dice: DiceData[], game?: string, at?: number): RollHistoryItem =>
  ({ id: `r${n++}`, total, details: [String(total)], set: luckSet(dice), ...(game ? { game } : {}), ...(at ? { at } : {}) });

describe('Sorting rolls by game', () => {
  it('the same faces are the same game, whatever the color, holds or modifier', () => {
    const recoloured = catan.map(d => ({ ...d, color: '#E32227' }));
    expect(gameKeyFor(recoloured)).toBe(gameKeyFor(catan));
    expect(gameKeyOf({ id: 'a', total: 7, details: [], set: luckSet(catan, true, 3) })).toBe(gameKeyFor(catan));
    expect(gameKeyFor(clever)).not.toBe(gameKeyFor(catan));
  });

  it('a single die and a roll with no dice recorded belong to no game', () => {
    expect(gameKeyOf({ id: 'a', total: 3, details: [], single: true, set: luckSet(catan) })).toBeNull();
    expect(gameKeyOf({ id: 'b', total: 3, details: [] })).toBeNull();
  });

  it('names dice with no game by what they are', () => {
    expect(diceSummary(gameKeyFor(catan)!)).toBe('2d6');
    expect(diceSummary(gameKeyFor([die(20), die(8)])!)).toBe('d20 + d8');
  });

  it('keeps the game on the table now plus the last three before it', () => {
    const history = [roll(3, d4), roll(5, d8), roll(9, d20), roll(7, clever, "That's Pretty Clever"), roll(8, catan, 'Catan')];
    const groups = recentGroups(history, gameKeyFor(catan));
    expect(groups.map(g => g.label)).toEqual(['Catan', 'd4', 'd8', 'd20']);
  });

  it('keeps the dice, game and time of a roll across a reload', () => {
    const [item] = sanitizeRollHistory([{ id: 'x', total: 7, details: ['7'], set: luckSet(catan), game: 'Catan', at: 1000 }]);
    expect(item).toMatchObject({ set: luckSet(catan), game: 'Catan', at: 1000 });
  });
});

describe('History and Frequency by game', () => {
  const history = [
    roll(20, clever, "That's Pretty Clever", 3000),
    roll(22, clever, "That's Pretty Clever", 2000),
    roll(7, catan, 'Catan', 1000),
  ];
  const base = { isOpen: true, onClose: () => {}, onClearHistory: () => {}, rollHistory: history };

  it('Frequency counts the game on the table now, with chips for the others and All', () => {
    render(<HistoryModal {...base} dice={clever} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Frequency' }));
    const chips = screen.getByRole('group', { name: 'Which game' });
    expect(within(chips).getByRole('button', { name: "That's Pretty Clever (now)" })).toHaveAttribute('aria-pressed', 'true');
    // Catan's 7 is not counted for That's Pretty Clever (its row shows 0)
    expect(screen.getByText('Total 7:').parentElement).toHaveTextContent('0x');
    fireEvent.click(within(chips).getByRole('button', { name: 'Catan' }));
    expect(screen.getByText('Total 7:').parentElement).toHaveTextContent('1x');
    expect(screen.queryByText('Total 20:')).toBeNull();
    fireEvent.click(within(chips).getByRole('button', { name: 'All' }));
    expect(screen.getByText('Total 7:')).toBeInTheDocument();
    expect(screen.getByText('Total 20:')).toBeInTheDocument();
  });

  it('History marks where the game changed', () => {
    render(<HistoryModal {...base} dice={clever} />);
    const lines = screen.getAllByTestId('game-divider').map(d => d.textContent);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^That's Pretty Clever · from /);
    expect(lines[1]).toMatch(/^Catan · from /);
  });

  it('one game has no switch lines and no chips', () => {
    render(<HistoryModal {...base} rollHistory={[history[0], history[1]]} dice={clever} />);
    expect(screen.queryByTestId('game-divider')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Frequency' }));
    expect(screen.queryByRole('group', { name: 'Which game' })).toBeNull();
  });

  it('can clear just the game on the table', () => {
    const onClearGame = vi.fn();
    render(<HistoryModal {...base} dice={clever} onClearGame={onClearGame} />);
    fireEvent.click(screen.getByRole('button', { name: "Clear That's Pretty Clever" }));
    expect(onClearGame).toHaveBeenCalledWith(gameKeyFor(clever), "That's Pretty Clever");
  });
});
