import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from '../App';
import { sanitizeSavedRolls, withSavedRoll } from '../utils/savedRolls';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('rpgMode', 'true');
  vi.useFakeTimers();
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

const typeRoll = (text: string) =>
  fireEvent.change(screen.getByRole('textbox', { name: /type a roll/i }), { target: { value: text } });

const saveAs = (text: string, name: string) => {
  typeRoll(text);
  fireEvent.click(screen.getByRole('button', { name: 'Save this roll' }));
  const form = screen.getByRole('form', { name: 'Name this roll' });
  fireEvent.change(within(form).getByRole('textbox'), { target: { value: name } });
  fireEvent.click(within(form).getByRole('button', { name: 'Save' }));
};

const savedList = () => screen.queryByRole('list', { name: 'Saved rolls' });

describe('Saved rolls, kept and checked', () => {
  it('keeps only readable rolls with names, tidied, no repeats', () => {
    expect(sanitizeSavedRolls([
      { name: 'Sword', text: '2D6 + 3' },
      { name: 'Sword', text: 'd20' },
      { name: '', text: 'd20' },
      { name: 'Bad', text: 'two dice' },
      'junk',
    ])).toEqual([{ name: 'Sword', text: '2d6+3' }]);
    expect(sanitizeSavedRolls('nope')).toEqual([]);
  });

  it('updates a roll with the same name in place', () => {
    const list = [{ name: 'A', text: 'd20' }, { name: 'B', text: 'd6' }];
    expect(withSavedRoll(list, { name: 'A', text: 'd8' })).toEqual([{ name: 'A', text: 'd8' }, { name: 'B', text: 'd6' }]);
  });
});

describe('Save this roll', () => {
  it('names a typed roll and adds a button under the box', () => {
    render(<App />);
    saveAs('2d6+3', 'Sword');
    const button = within(savedList()!).getByRole('button', { name: 'Roll Sword: 2d6+3' });
    expect(button).toBeInTheDocument();
  });

  it('uses the roll itself as the label when no name is typed', () => {
    render(<App />);
    saveAs('d20 adv', '');
    expect(within(savedList()!).getByRole('button', { name: 'Roll d20 adv' })).toBeInTheDocument();
  });

  it('tapping a saved button rolls it like typing it', () => {
    render(<App />);
    saveAs('2d6+3', 'Sword');
    typeRoll('');
    fireEvent.click(within(savedList()!).getByRole('button', { name: /Roll Sword/ }));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(screen.getAllByRole('button', { name: /^d6 showing/ })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Roll dice' }).textContent).toMatch(/\(\d+\+3\)/);
  });

  it('stays after a reload and only shows in RPG mode', () => {
    const { unmount } = render(<App />);
    saveAs('d8+1', 'Dagger');
    unmount();
    render(<App />);
    expect(within(savedList()!).getByRole('button', { name: /Roll Dagger/ })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('RPG Mode'));
    expect(savedList()).toBeNull();
  });

  it('removing one offers Undo, which puts it back', () => {
    render(<App />);
    saveAs('d8+1', 'Dagger');
    saveAs('d20', 'Check');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Dagger' }));
    expect(within(savedList()!).queryByRole('button', { name: /Roll Dagger/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    const names = within(savedList()!).getAllByRole('button', { name: /^Roll / }).map(b => b.getAttribute('aria-label'));
    expect(names).toEqual(['Roll Dagger: 1d8+1', 'Roll Check: 1d20']);
  });

  it('a full list says so instead of dropping an older roll', () => {
    localStorage.setItem('savedRolls', JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ name: `R${i}`, text: 'd6' }))));
    render(<App />);
    saveAs('d20', 'One more');
    expect(screen.getByText(/You can keep 20 saved rolls/)).toBeInTheDocument();
    expect(within(savedList()!).getAllByRole('listitem')).toHaveLength(20);
  });
});

describe('Backups carry saved rolls', () => {
  it('exports them and an import puts them back', async () => {
    vi.useRealTimers();
    let exported = '';
    const origBlob = globalThis.Blob;
    globalThis.Blob = class extends origBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) { super(parts, opts); exported = String(parts[0]); }
    } as typeof Blob;
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { unmount } = render(<App />);
    saveAs('2d6+3', 'Sword');
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Games'));
    fireEvent.click(screen.getByRole('button', { name: /export/i }));
    expect(JSON.parse(exported).savedRolls).toEqual([{ name: 'Sword', text: '2d6+3' }]);
    unmount();
    globalThis.Blob = origBlob;
    click.mockRestore();

    localStorage.removeItem('savedRolls');
    vi.useFakeTimers();
    render(<App />);
    expect(savedList()).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Games'));
    const file = new File([exported], 'backup.json', { type: 'application/json' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    vi.useRealTimers();
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise(r => setTimeout(r, 50));
    });
    expect(JSON.parse(localStorage.getItem('savedRolls')!)).toEqual([{ name: 'Sword', text: '2d6+3' }]);
  });
});
