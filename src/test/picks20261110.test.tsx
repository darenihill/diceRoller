// The owner's five Build picks of 2026-11-10 (Dispatch-Item custom-dice-roller/ask-2026-11-10-*)
import React from 'react';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
// Closing things unmount at once, as they do once a phone's exit animation ends
vi.mock('framer-motion', async () => ({
  ...(await vi.importActual<object>('framer-motion')),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
import App from '../App';
import { resetFaceImageCache, pruneFaceImages, holdFaceImageForUndo, releaseFaceImageHolds } from '../utils/faceImages';
import { UNDO_WINDOW_MS } from '../hooks/useUndo';
import { HelpModal } from '../components/modals/HelpModal';
import { SetsModal } from '../components/modals/SetsModal';
import fs from 'fs';
import path from 'path';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

afterEach(() => { vi.useRealTimers(); localStorage.clear(); resetFaceImageCache(); releaseFaceImageHolds(); });

const oneD4 = () => localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
  { id: 'a', numberValue: 1, faces: 4, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false }
] } }));
const bigRoll = () => document.querySelector('[data-roll-button]') as HTMLElement;

describe('After you type a roll, the big Roll button rolls it (owner, 2026-11-10)', () => {
  it('rolls the typed roll, swapping in its dice with Undo', () => {
    vi.useFakeTimers();
    localStorage.setItem('rpgMode', 'true');
    oneD4();
    render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: /Type a roll/ }), { target: { value: '2d6+3' } });
    fireEvent.click(bigRoll());
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });

    const history = JSON.parse(localStorage.getItem('rollHistory') ?? '[]');
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ typed: '2d6+3', modifier: 3 });
    expect(screen.getAllByLabelText(/^d6 showing/)).toHaveLength(2);
    expect(screen.queryAllByLabelText(/^d4 showing/)).toHaveLength(0);
    expect(screen.getByText('Rolled 2d6+3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getAllByLabelText(/^d4 showing/)).toHaveLength(1);
    expect(screen.getByTestId('modifier-chip')).toHaveTextContent('±0');
  });

  it('with the box empty or holding a roll that does not read, rolls the dice out as before', () => {
    vi.useFakeTimers();
    localStorage.setItem('rpgMode', 'true');
    oneD4();
    render(<App />);
    fireEvent.click(bigRoll());
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    fireEvent.change(screen.getByRole('textbox', { name: /Type a roll/ }), { target: { value: '2x6' } });
    fireEvent.click(bigRoll());
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });

    const history = JSON.parse(localStorage.getItem('rollHistory') ?? '[]');
    expect(history).toHaveLength(2);
    expect(history.every((h: { typed?: string }) => !h.typed)).toBe(true);
    expect(screen.getAllByLabelText(/^d4 showing/)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it("Help's typed-roll line names the big Roll button", () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    expect(screen.getByText(/Type a roll:/).closest('li')).toHaveTextContent(/big Roll button/);
  });
});

describe('Photos on removed dice are really deleted from the phone (owner, 2026-11-10)', () => {
  const png = 'data:image/png;base64,AAAA';
  const die = (id: string, name: string, customFaces: string[]) => ({ id, numberValue: 1, faces: customFaces.length, currentFaceIndex: 0, customFaces, color: '#E9EAEC', name, held: false });
  const stored = () => Object.keys(JSON.parse(localStorage.getItem('diceFaceImages') ?? '{}')).sort();
  const reload = (view: { unmount: () => void }) => {
    view.unmount();
    resetFaceImageCache();
    return render(<App />);
  };

  it('a picture nothing names is gone after a reload; pictures in a game, the default dice, History or on screen stay', () => {
    localStorage.setItem('diceFaceImages', JSON.stringify({
      gone: png, game: png, dflt: png, hist: png, shown: png,
    }));
    localStorage.setItem('diceConfigs', JSON.stringify({
      Kids: { name: 'Kids', config: [die('g', 'Kids', ['Mia:img:game', 'Leo'])] },
      systemAutosave: { name: 'systemAutosave', config: [die('s', 'Pets', ['Rex:img:shown', 'Tom'])] },
    }));
    localStorage.setItem('defaultDiceSet', JSON.stringify([die('d', 'Team', ['Ann:img:dflt', 'Bo'])]));
    localStorage.setItem('rollHistory', JSON.stringify([{ id: 'r1', total: 0, details: ['Old: Zed'], at: 1,
      set: JSON.stringify([[[2, ['Zed:img:hist', 'Ivy'], null]], null]) }]));
    const view = render(<App />);
    expect(stored()).toEqual(['dflt', 'game', 'hist', 'shown']);
    reload(view);
    expect(stored()).toEqual(['dflt', 'game', 'hist', 'shown']);
  });

  it('a removed picture stays while its Undo is up and the die settings are open, then goes, and stays gone after a reload', () => {
    vi.useFakeTimers();
    localStorage.setItem('diceFaceImages', JSON.stringify({ pic1: png }));
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      die('k', 'Kids', ['Mia:img:pic1', 'Leo']),
    ] } }));
    const view = render(<App />);
    expect(stored()).toEqual(['pic1']);
    fireEvent.click(screen.getByLabelText('Settings for Kids'));
    fireEvent.click(screen.getByRole('tab', { name: 'Custom Faces' }));
    fireEvent.click(screen.getByLabelText('Remove picture from face 1'));
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Removed picture');
    expect(stored()).toEqual(['pic1']);
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 50); });
    expect(screen.queryByTestId('undo-bar')).toBeNull();
    // Die settings still open: kept until they close
    expect(stored()).toEqual(['pic1']);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.queryByRole('tab', { name: 'Custom Faces' })).toBeNull();
    expect(stored()).toEqual([]);
    vi.useRealTimers();
    reload(view);
    expect(stored()).toEqual([]);
  });

  it('a removed die keeps its picture while Undo is up, Undo brings it back whole, and once Undo runs out it goes', () => {
    vi.useFakeTimers();
    localStorage.setItem('diceFaceImages', JSON.stringify({ pic1: png }));
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      die('k', 'Kids', ['Mia:img:pic1', 'Leo']), die('n', 'Other', ['A', 'B']),
    ] } }));
    render(<App />);
    const removeKids = () => {
      fireEvent.click(screen.getByLabelText('Settings for Kids'));
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    };
    removeKids();
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Removed Kids');
    expect(stored()).toEqual(['pic1']);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 50); });
    expect(screen.getByLabelText('Settings for Kids')).toBeInTheDocument();
    expect(stored()).toEqual(['pic1']);

    removeKids();
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS + 50); });
    expect(screen.queryByTestId('undo-bar')).toBeNull();
    expect(stored()).toEqual([]);
  });

  it('keeps everything when storage cannot be read, and keeps pictures held for an Undo', () => {
    localStorage.setItem('diceFaceImages', JSON.stringify({ held: png, loose: png }));
    holdFaceImageForUndo('held');
    expect(pruneFaceImages([])).toBe(1);
    expect(stored()).toEqual(['held']);
    const spy = vi.spyOn(Storage.prototype, 'key').mockImplementation(() => { throw new Error('blocked'); });
    releaseFaceImageHolds();
    expect(pruneFaceImages([])).toBe(0);
    spy.mockRestore();
    expect(stored()).toEqual(['held']);
  });
});

describe('Saved games load from a tap anywhere on their row (owner, 2026-11-10)', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../App.module.css'), 'utf-8');
  const rule = (selector: string) => {
    const m = css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*]/g, '\\$&')}\\s*\\{([^}]+)\\}`));
    expect(m, selector).not.toBeNull();
    return m![1];
  };

  it('the load target fills the row: full height, everything left of the bin, at least 48px tall', () => {
    // The row gives its top, bottom and left padding to the load target
    expect(rule('.setsGrid .saveCard')).toMatch(/padding:\s*0 4px 0 0;/);
    const load = rule('.setsGrid .saveCardBtn');
    expect(load).toMatch(/align-self:\s*stretch/);
    expect(load).toMatch(/min-height:\s*48px/);
    expect(rule('.saveCardBtn')).toMatch(/flex-grow:\s*1/);
    // The text keeps its place: 4px row + 8px button before, 12px button now
    expect(load).toMatch(/padding:\s*12px 0 12px 12px/);
  });

  it('the bin stays 48 x 48 beside a long name', () => {
    const icon = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8').match(/\n\.md-icon-button\s*\{([^}]+)\}/)![1];
    expect(icon).toMatch(/width:\s*48px/);
    expect(icon).toMatch(/height:\s*48px/);
    const bin = rule('.saveCardBin');
    expect(bin).toMatch(/flex-shrink:\s*0/);
    expect(bin).toMatch(/margin:\s*4px 0/);

    render(<SetsModal isOpen onClose={() => {}} savedConfigs={{ 'A rather long game name that wraps': { name: 'A rather long game name that wraps', config: [] } }}
      onLoadSet={() => {}} onDeleteConfig={() => {}} onExportBackup={() => {}} onImportBackup={() => {}} />);
    const del = screen.getByLabelText('Delete A rather long game name that wraps');
    expect(del.className).toMatch(/saveCardBin/);
    const load = screen.getByRole('button', { name: 'A rather long game name that wraps' });
    expect(load.className).toMatch(/saveCardBtn/);
    expect(load.parentElement).toBe(del.parentElement);
  });
});
