import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from '../App';
import { HelpModal } from '../components/modals/HelpModal';
import { ROLL_DURATION_MS, TOAST_DURATION_MS } from '../utils/constants';
import { UNDO_WINDOW_MS } from '../hooks/useUndo';
import { dicePresets, sevenNoteFor } from '../utils/presets';
import type { DiceData } from '../types';

// The new-version bar, switched on by a test
const version = vi.hoisted(() => ({ ready: false, later: () => { version.ready = false; } }));
vi.mock('../hooks/useNewVersion', () => ({ useNewVersion: () => ({ ready: version.ready, later: version.later }) }));

// Catan: a 7 shows a Robber note above the Roll button (owner, 2026-11-10,
// way "With the game, shown above Roll").

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const gameDice = (name: string): DiceData[] =>
  dicePresets.find(p => p.name === name)!.dice.map((d, i) => ({
    id: `${name}-${i}`, currentFaceIndex: 0, held: false, numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', ...d,
  }) as DiceData);

const startWith = (dice: DiceData[]) =>
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: dice } }));

// Each die rolls the next number in the queue, in list order
let queue: number[] = [];
beforeEach(() => {
  version.ready = false;
  vi.useFakeTimers();
  localStorage.clear();
  vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(arr: T) => {
    const face = queue.length ? queue.shift()! : 1;
    (arr as unknown as Uint32Array)[0] = Math.floor(2 ** 32 / 6) * (face - 1);
    return arr;
  });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });

const roll = (...faces: number[]) => {
  queue = faces;
  fireEvent.click(screen.getByRole('button', { name: /^Roll dice|roll again$/ }));
  act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
};
const note = () => screen.queryByTestId('seven-note');
const spoken = () => document.querySelector('[aria-live="polite"]')?.textContent ?? '';
const loadGame = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Games' }));
  fireEvent.click(screen.getByRole('button', { name }));
  act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 500); });
};

describe('The 7 note lives with the built-in games', () => {
  it('Catan and Cities & Knights carry their own words; no other game has one', () => {
    expect(sevenNoteFor('Catan')).toEqual({ title: '🎯 7 · Robber', text: 'Over 7 cards? Discard half, then move it' });
    expect(sevenNoteFor('Cities & Knights')).toEqual({ title: '🎯 7 · Robber', text: 'Over 7 cards? Discard half' });
    const others = dicePresets.filter(p => p.sevenNote).map(p => p.name);
    expect(others).toEqual(['Catan', 'Cities & Knights']);
    expect(sevenNoteFor(null)).toBeNull();
    expect(sevenNoteFor('My Catan night')).toBeNull();
  });
});

describe('Catan: a 7 shows the Robber note above Roll', () => {
  it('shows "🎯 7 · Robber" and what to do, and a screen reader hears it with the total', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    expect(screen.getByText('Catan', { selector: 'span' })).toBeInTheDocument();
    roll(3, 4);
    const shown = note();
    expect(shown).not.toBeNull();
    expect(shown).toHaveTextContent('🎯 7 · Robber');
    expect(shown).toHaveTextContent('Over 7 cards? Discard half, then move it');
    expect(spoken()).toBe('Rolled 7. Robber: Over 7 cards? Discard half, then move it');
  });

  it('a total other than 7 shows nothing', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 5);
    expect(note()).toBeNull();
    expect(spoken()).toBe('Rolled 8');
  });

  it('stays until the next roll, and the next roll takes it away', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(1, 6);
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(note()).not.toBeNull();
    // Gone while the dice tumble, and an 8 brings nothing back
    queue = [2, 6];
    fireEvent.click(screen.getByRole('button', { name: /roll again$/ }));
    expect(note()).toBeNull();
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(note()).toBeNull();
  });

  it('a die rolled on its own is a new roll too', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    expect(note()).not.toBeNull();
    // Tap a die, then its Roll this die button
    fireEvent.click(document.querySelector('[data-dice-id]')!);
    queue = [2];
    fireEvent.click(screen.getAllByRole('button', { name: /^Roll only/ })[0]);
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(note()).toBeNull();
  });
});

describe('Cities & Knights', () => {
  it('shows its own words', () => {
    startWith(gameDice('Cities & Knights'));
    render(<App />);
    // Regular 3, Event 4, Progress lands a Barbarian (counts 0)
    roll(3, 4, 1);
    expect(note()).toHaveTextContent('🎯 7 · Robber');
    expect(note()).toHaveTextContent('Over 7 cards? Discard half');
    expect(note()).not.toHaveTextContent('move it');
  });

  it('loading it from Games carries its note', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    loadGame('Cities & Knights');
    roll(2, 5, 1);
    expect(note()?.textContent).toBe('🎯 7 · RobberOver 7 cards? Discard half');
  });
});

describe('The note stops when the game does', () => {
  it('adding a die takes it away, and a 7 then shows nothing', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    expect(note()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add a die' }));
    expect(note()).toBeNull();
    roll(1, 1, 5);
    expect(note()).toBeNull();
    expect(spoken()).toBe('Rolled 7');
  });

  it('removing a die takes it away, even once its Undo has gone', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    fireEvent.click(document.querySelector('[data-dice-id]')!);
    fireEvent.click(screen.getAllByRole('button', { name: /^Remove / })[0]);
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 500); });
    expect(note()).toBeNull();
  });

  it('loading another game takes it away, and a 7 there shows nothing', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    expect(note()).not.toBeNull();
    loadGame("That's Pretty Clever");
    expect(note()).toBeNull();
    roll(2, 1, 1, 1, 1, 1);
    expect(note()).toBeNull();
  });

  it('plain dice never show it', () => {
    const plain = gameDice('Catan').map(d => ({ ...d, color: '#384050', name: '' }));
    startWith(plain);
    render(<App />);
    roll(3, 4);
    expect(note()).toBeNull();
    expect(spoken()).toBe('Rolled 7');
  });

  it('other popular games never show it', () => {
    startWith(gameDice('Risk'));
    render(<App />);
    roll(1, 1, 1, 2, 2);
    expect(note()).toBeNull();
  });
});

describe('Target hit and the note share the spot', () => {
  it('"🎯 Target hit: 7" shows as before, and the note follows once it goes', () => {
    localStorage.setItem('targetHighlight', '7');
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    expect(screen.getByRole('status')).toHaveTextContent('🎯 Target hit: 7');
    expect(note()).toBeNull();
    act(() => { vi.advanceTimersByTime(TOAST_DURATION_MS + 50); });
    expect(screen.queryByText('🎯 Target hit: 7')).toBeNull();
    expect(note()).toHaveTextContent('Over 7 cards? Discard half, then move it');
  });

  it('waits under an open dialog and comes back when it closes', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(note()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(note()).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => { vi.advanceTimersByTime(500); });
    expect(note()).not.toBeNull();
  });
});

describe('Help', () => {
  it('has one line about the 7 note, right under Games', () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    const items = screen.getAllByRole('listitem').map(li => li.textContent ?? '');
    const games = items.findIndex(t => t.startsWith('Games:'));
    expect(items[games + 1]).toBe('A 7 in Catan: In Catan or Cities & Knights, a roll of 7 shows 🎯 and what to do just above Roll, until the next roll.');
    expect(items.filter(t => /Robber|roll of 7/.test(t))).toHaveLength(1);
  });
});

describe('RPG mode: the dice make the 7, not the bonus', () => {
  it('a 7 plus a bonus of 2 shows it', () => {
    localStorage.setItem('rpgMode', 'true');
    localStorage.setItem('rollModifier', '2');
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    expect(note()).toHaveTextContent('Over 7 cards? Discard half, then move it');
  });

  it('a 5 plus a bonus of 2, a total of 7, does not', () => {
    localStorage.setItem('rpgMode', 'true');
    localStorage.setItem('rollModifier', '2');
    startWith(gameDice('Catan'));
    render(<App />);
    roll(2, 3);
    expect(note()).toBeNull();
    expect(spoken()).toBe('Rolled 7: 5 plus 2');
  });
});

describe('Each guard on its own', () => {
  it('same game name, new dice: loading Catan again after its 7 stops the note', () => {
    // The top line still says Catan; only the changed dice catch it
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    expect(note()).not.toBeNull();
    loadGame('Catan');
    expect(screen.getByText('Catan', { selector: 'span' })).toBeInTheDocument();
    expect(note()).toBeNull();
  });

  it("same dice, new name: saving Catan's dice as another game stops the note", () => {
    // The dice don't change; only the name on the top line catches it
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 4);
    expect(note()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }));
    fireEvent.change(screen.getByRole('textbox', { name: /name for this game/i }), { target: { value: 'Friday night' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 500); });
    expect(screen.getByText('Friday night', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^7, roll again$/ })).toBeInTheDocument();
    expect(note()).toBeNull();
  });
});

describe('Typed rolls', () => {
  it('a typed roll of 7 never shows it, before or after its Undo puts Catan back', () => {
    localStorage.setItem('rpgMode', 'true');
    startWith(gameDice('Catan'));
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: /Type a roll/ }), { target: { value: '2d6' } });
    roll(3, 4);
    expect(spoken()).toBe('Rolled 7');
    expect(note()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    act(() => { vi.advanceTimersByTime(TOAST_DURATION_MS + 50); });
    expect(screen.getByText('Catan', { selector: 'span' })).toBeInTheDocument();
    expect(note()).toBeNull();
  });
});

describe('Bars that come first', () => {
  it('the Undo bar keeps the spot; the note shows once it goes', () => {
    // Deleting a saved game offers Undo and leaves the dice as they are
    localStorage.setItem('diceConfigs', JSON.stringify({
      systemAutosave: { name: 'systemAutosave', config: gameDice('Catan') },
      Old: { name: 'Old', config: [{ id: 'o', numberValue: 1, faces: 20, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false }] },
    }));
    render(<App />);
    roll(3, 4);
    expect(note()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Games' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Old' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(note()).toBeNull();
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 500); });
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    expect(note()).toHaveTextContent('🎯 7 · Robber');
  });

  it('the new-version bar keeps the spot; the note shows after Later', () => {
    startWith(gameDice('Catan'));
    version.ready = true;
    const { rerender } = render(<App />);
    roll(3, 4);
    expect(screen.getByTestId('new-version-bar')).toBeInTheDocument();
    expect(note()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    rerender(<App />);
    expect(screen.queryByTestId('new-version-bar')).toBeNull();
    expect(note()).toHaveTextContent('🎯 7 · Robber');
  });
});

describe('Room for the note under the dice (re-read, 2026-11-11)', () => {
  // jsdom lays nothing out, so give the dice area and the note their places
  // on a 640px phone: the area ends at 520; the note's top is 454, or 400
  // once the Release chip row lifts it
  const room = () => {
    const area = document.querySelector('[class*="diceContainer"]') as HTMLElement;
    return area.style.getPropertyValue('--note-room');
  };
  beforeEach(() => {
    const rect = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return /diceContainer/.test(this.className) ? ({ top: 68, bottom: 520, left: 0, right: 320, width: 320, height: 452 } as DOMRect) : rect.call(this);
    });
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid !== 'seven-note') return 0;
      return /toastAboveRpgBar/.test(this.className) ? 400 : 454;
    });
  });

  it('a 7 then Hold measures again, and Release gives the room back', () => {
    startWith(gameDice('Cities & Knights'));
    render(<App />);
    roll(3, 4, 1);
    expect(note()).not.toBeNull();
    // 520 - 52 - (454 - 8) = 22
    expect(room()).toBe('22px');
    fireEvent.click(screen.getAllByRole('button', { name: /^Hold / })[0]);
    expect(note()?.className).toMatch(/toastAboveRpgBar/);
    // 520 - 52 - (400 - 8) = 76
    expect(room()).toBe('76px');
    fireEvent.click(screen.getAllByRole('button', { name: /^Hold / })[0]);
    expect(note()?.className).not.toMatch(/toastAboveRpgBar/);
    expect(room()).toBe('22px');
  });

  it('no note, no room', () => {
    startWith(gameDice('Catan'));
    render(<App />);
    roll(3, 5);
    expect(room()).toBe('');
  });
});
