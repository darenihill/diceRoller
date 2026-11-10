// The owner's five Build picks of 2026-11-10 (Dispatch-Item custom-dice-roller/ask-2026-11-10-*)
import React from 'react';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { HelpModal } from '../components/modals/HelpModal';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

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
