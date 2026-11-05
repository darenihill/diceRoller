import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { DiceData } from '../types';

// The real tray needs WebGL; here it stands in with fixed landings
const tray = vi.hoisted(() => ({
  rollInTray: vi.fn(),
  calm: false,
}));
vi.mock('../utils/dice3d', async () => ({
  ...(await vi.importActual<object>('../utils/dice3d')),
  rollInTray: tray.rollInTray,
  clearTray: vi.fn(),
}));
vi.mock('framer-motion', async () => ({
  ...(await vi.importActual<object>('framer-motion')),
  useReducedMotion: () => tray.calm,
}));

import App from '../App';
import { canRoll3D } from '../utils/dice3d';

const die = (over: Partial<DiceData>): DiceData => ({
  id: Math.random().toString(36).slice(2), numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', held: false, ...over,
});
const putOut = (dice: DiceData[]) =>
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: dice } }));
const history = () => JSON.parse(localStorage.getItem('rollHistory') || '[]');
const rollButton = () => screen.getByRole('button', { name: /roll dice|roll again/i });

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => {
  localStorage.clear();
  tray.rollInTray.mockReset();
  tray.calm = false;
});

describe('3D Dice (owner, 2026-11-02)', () => {
  it('only plain d4 to d20 dice roll in the tray', () => {
    expect([4, 6, 8, 10, 12, 20].every(faces => canRoll3D(die({ faces })))).toBe(true);
    expect(canRoll3D(die({ faces: 2 }))).toBe(false);
    expect(canRoll3D(die({ faces: 100 }))).toBe(false);
    expect(canRoll3D(die({ customFaces: ['A', 'B', 'C', 'D', 'E', 'F'] }))).toBe(false);
  });

  it('Customize has a 3D Dice switch, off until turned on, and it is kept', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Customize'));
    const sw = screen.getByRole('button', { name: '3D dice' });
    expect(sw).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('dice3D')).toBe('true');
  });

  it('with 3D off, a roll never touches the tray', () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(rollButton());
    act(() => { vi.advanceTimersByTime(2000); });
    expect(tray.rollInTray).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dice-tray')).toBeNull();
    expect(history()).toHaveLength(1);
    vi.useRealTimers();
  });

  it('with 3D on, unheld plain dice tumble in the tray and the total uses what they landed on', async () => {
    localStorage.setItem('dice3D', 'true');
    localStorage.setItem('rpgMode', 'true');
    const red = die({ id: 'red', faces: 20, color: '#E32227' });
    const held = die({ id: 'held', faces: 6, numberValue: 5, held: true });
    const words = die({ id: 'words', faces: 6, customFaces: ['A', 'B', 'C', 'D', 'E', 'F'] });
    const green = die({ id: 'green', faces: 8, color: '#228B22' });
    putOut([red, held, words, green]);
    // Loading gives each die a fresh id, so the stand-in tray goes by color
    const lands: Record<string, number> = { '#E32227': 17, '#228B22': 3 };
    tray.rollInTray.mockImplementation(async (_: string, dice: DiceData[]) =>
      Object.fromEntries(dice.map(d => [d.id, lands[d.color]])));
    render(<App />);

    fireEvent.click(rollButton());
    await waitFor(() => expect(tray.rollInTray).toHaveBeenCalledTimes(1));
    // Only the plain dice that roll: not the held one, not the one with its own faces
    expect(tray.rollInTray.mock.calls[0][1].map((d: DiceData) => d.faces)).toEqual([20, 8]);
    await waitFor(() => expect(history()).toHaveLength(1));

    const entry = history()[0];
    expect(entry.details).toContain('d20 #1: 17');
    expect(entry.details).toContain('d8 #1: 3');
    expect(entry.details).toContain('d6 #1: 5');
    // 17 + 5 + 3, and the words die counts 0
    expect(entry.total).toBe(25);
    expect(screen.getByRole('button', { name: /^25, roll again/ })).toBeInTheDocument();
  });

  it('a second tap while the dice tumble waits for them to land', async () => {
    localStorage.setItem('dice3D', 'true');
    putOut([die({ id: 'a' })]);
    let land: (r: Record<string, number>) => void = () => {};
    // One die out, so the stand-in tray lands it on a 4 whatever its id
    tray.rollInTray.mockReturnValue(new Promise(resolve => { land = resolve; }));
    render(<App />);
    fireEvent.click(rollButton());
    await waitFor(() => expect(tray.rollInTray).toHaveBeenCalledTimes(1));
    fireEvent.click(rollButton());
    expect(tray.rollInTray).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('dice-tray')).toBeVisible();
    await act(async () => { land({ [tray.rollInTray.mock.calls[0][1][0].id]: 4 }); });
    expect(history()).toHaveLength(1);
    expect(history()[0].total).toBe(4);
  });

  it('a typed roll tumbles in the tray too, with its modifier added', async () => {
    localStorage.setItem('dice3D', 'true');
    localStorage.setItem('rpgMode', 'true');
    tray.rollInTray.mockImplementation(async (_: string, dice: DiceData[]) =>
      Object.fromEntries(dice.map(d => [d.id, 2])));
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: /type a roll/i }), { target: { value: '2d6+3' } });
    fireEvent.click(screen.getByRole('button', { name: /^roll$/i }));
    await waitFor(() => expect(history()).toHaveLength(1));
    expect(tray.rollInTray.mock.calls[0][1]).toHaveLength(2);
    expect(history()[0].total).toBe(7);
  });

  it('when the tray cannot start, the dice roll flat and say so', async () => {
    localStorage.setItem('dice3D', 'true');
    tray.rollInTray.mockRejectedValue(new Error('no WebGL'));
    render(<App />);
    fireEvent.click(rollButton());
    expect(await screen.findByText(/3D dice couldn't start on this device/)).toBeInTheDocument();
    await waitFor(() => expect(history()).toHaveLength(1), { timeout: 2000 });
  });

  it('when the device asks for less motion, the dice stay flat', () => {
    vi.useFakeTimers();
    tray.calm = true;
    localStorage.setItem('dice3D', 'true');
    render(<App />);
    fireEvent.click(rollButton());
    act(() => { vi.advanceTimersByTime(2000); });
    expect(tray.rollInTray).not.toHaveBeenCalled();
    expect(history()).toHaveLength(1);
    vi.useRealTimers();
  });

  it('the 3D code loads only when it is used, never with the first page', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const tray3d = readFileSync('src/utils/dice3d.ts', 'utf8');
    expect(app).not.toMatch(/from '@3d-dice\/dice-box'/);
    expect(tray3d).not.toMatch(/^import .*@3d-dice\/dice-box/m);
    expect(tray3d).toMatch(/import\('@3d-dice\/dice-box'\)/);
  });
});
