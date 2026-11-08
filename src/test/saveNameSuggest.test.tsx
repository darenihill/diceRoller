import React from 'react';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { suggestSaveName } from '../utils/setName';
import { dicePresets } from '../utils/presets';
import type { DiceData } from '../types';

// Owner, 2026-11-07: Save fills in a name for you, like "Catan 2" or "2 d6"
beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => localStorage.clear());

const die = (faces: number, name = '', customFaces: string[] = []): Partial<DiceData> => ({ faces, name, customFaces, color: '#E9EAEC' });

describe('the name Save fills in', () => {
  it('a loaded game gives its name, numbered when taken', () => {
    const catan = dicePresets.find(p => p.name === 'Catan')!;
    expect(suggestSaveName(catan.dice, null, [])).toBe('Catan');
    expect(suggestSaveName(catan.dice, null, ['Catan'])).toBe('Catan 2');
    expect(suggestSaveName(catan.dice, null, ['Catan', 'Catan 2'])).toBe('Catan 3');
  });

  it('a die named in Dice Settings goes first, then plain dice counted by kind', () => {
    expect(suggestSaveName([die(6, 'Lunch die', ['Tacos', 'Pizza']), die(6), die(6, 'd6')], null, [])).toBe('Lunch die + 2 d6');
    expect(suggestSaveName([die(20), die(6), die(6), die(6)], null, [])).toBe('3 d6 + 1 d20');
  });

  it('unnamed custom-face dice are "Custom dice", and an empty table gives nothing', () => {
    expect(suggestSaveName([die(6, '', ['A', 'B'])], null, [])).toBe('Custom dice');
    expect(suggestSaveName([die(6, '', ['A', 'B'])], null, ['Custom dice'])).toBe('Custom dice 2');
    expect(suggestSaveName([], null, [])).toBe('');
  });

  it('keeps to the save name length', () => {
    const many = Array.from({ length: 9 }, (_, i) => die(6, `Long die name ${i}`));
    expect(suggestSaveName(many, null, []).length).toBeLessThanOrEqual(40);
  });
});

describe('in the app', () => {
  const openSave = () => {
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }));
  };

  it('Save opens with a name already in the box, selected', async () => {
    render(<App />);
    openSave();
    const box = screen.getByRole('textbox', { name: /name for this game/i }) as HTMLInputElement;
    expect(box.value).not.toBe('');
    await waitFor(() => expect([box.selectionStart, box.selectionEnd]).toEqual([0, box.value.length]));
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('a name the user typed stays when Save opens again', async () => {
    render(<App />);
    openSave();
    const box = screen.getByRole('textbox', { name: /name for this game/i }) as HTMLInputElement;
    fireEvent.change(box, { target: { value: 'Friday night' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('textbox', { name: /name for this game/i })).toBeNull());
    openSave();
    expect((screen.getByRole('textbox', { name: /name for this game/i }) as HTMLInputElement).value).toBe('Friday night');
  });
});
