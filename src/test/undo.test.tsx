import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndo, dieLabel, UNDO_WINDOW_MS, backMessage } from '../hooks/useUndo';
import { useDiceState } from '../hooks/useDiceState';
import { useStorage } from '../hooks/useStorage';

afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

describe('Undo offer', () => {
  it('runs the undo once and closes', () => {
    const undo = vi.fn();
    const { result } = renderHook(() => useUndo());
    act(() => result.current.offerUndo('Removed d6', undo));
    expect(result.current.offer?.message).toBe('Removed d6');
    act(() => result.current.runUndo());
    expect(undo).toHaveBeenCalledOnce();
    expect(result.current.offer).toBeNull();
  });

  it('goes away by itself after seven seconds', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useUndo());
    act(() => result.current.offerUndo('Removed d6', () => {}));
    act(() => { vi.advanceTimersByTime(UNDO_WINDOW_MS - 1); });
    expect(result.current.offer).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.offer).toBeNull();
  });

  it('is seven seconds, pauses while touched and picks up where it left off', () => {
    vi.useFakeTimers();
    expect(UNDO_WINDOW_MS).toBe(7000);
    const { result } = renderHook(() => useUndo());
    act(() => result.current.offerUndo('Removed d6', () => {}));
    act(() => { vi.advanceTimersByTime(3000); });
    act(() => result.current.pause());
    act(() => { vi.advanceTimersByTime(20000); });
    expect(result.current.offer).not.toBeNull();
    act(() => result.current.resume());
    act(() => { vi.advanceTimersByTime(3999); });
    expect(result.current.offer).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.offer).toBeNull();
  });

  it('says what came back', () => {
    const { result } = renderHook(() => useUndo());
    act(() => result.current.offerUndo('Removed d20', () => {}));
    let back: string | null = null;
    act(() => { back = result.current.runUndo(); });
    expect(back).toBe('d20 is back');
    expect(backMessage('Cleared 4 rolls')).toBe('4 rolls are back');
    expect(backMessage('Cleared 1 die')).toBe('1 die is back');
    expect(backMessage('Deleted Catan')).toBe('Catan is back');
    expect(backMessage('Loaded Catan')).toBe('Your dice are back');
  });

  it('names a die by its name, else by its faces', () => {
    expect(dieLabel({ name: 'Red', faces: 6 })).toBe('Red');
    expect(dieLabel({ name: '  ', faces: 20 })).toBe('d20');
  });
});

describe('Undo brings things back', () => {
  it('puts a removed die back in its place', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => { result.current.addDice({ faces: 4 }); result.current.addDice({ faces: 6 }); result.current.addDice({ faces: 8 }); });
    const middle = result.current.diceList[1];
    act(() => result.current.removeDice(middle.id));
    expect(result.current.diceList.map(d => d.faces)).toEqual([4, 8]);
    act(() => result.current.insertDiceAt(middle, 1));
    expect(result.current.diceList.map(d => d.faces)).toEqual([4, 6, 8]);
  });

  it('brings every die back after Clear all', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => { result.current.addDice({ faces: 6 }); result.current.addDice({ faces: 20 }); });
    const before = result.current.diceList;
    act(() => result.current.clearAllDice());
    expect(result.current.diceList).toHaveLength(0);
    act(() => result.current.restoreDice(before));
    expect(result.current.diceList).toEqual(before);
  });

  it('restores a deleted save', () => {
    const { result } = renderHook(() => useStorage());
    act(() => result.current.saveConfig('Friday', []));
    const saved = result.current.savedConfigs['Friday'];
    act(() => result.current.deleteConfig('Friday'));
    expect(result.current.savedConfigs['Friday']).toBeUndefined();
    act(() => result.current.saveConfig('Friday', saved.config));
    expect(result.current.savedConfigs['Friday']).toBeDefined();
  });
});
