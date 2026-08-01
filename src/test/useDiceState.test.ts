import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiceState } from '../hooks/useDiceState';

describe('useDiceState (Core State & Game Logic Regression Tests)', () => {
  it('should initialize with empty or custom dice list', () => {
    const { result } = renderHook(() => useDiceState());
    expect(Array.isArray(result.current.diceList)).toBe(true);
  });

  it('should allow adding new dice', () => {
    const { result } = renderHook(() => useDiceState());

    act(() => {
      result.current.addDice({ faces: 20, name: 'd20 test', numberValue: 1, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false });
    });

    expect(result.current.diceList.length).toBe(1);
    expect(result.current.diceList[0].faces).toBe(20);
  });

  it('should allow removing a die by ID', () => {
    const { result } = renderHook(() => useDiceState());

    act(() => {
      result.current.addDice({ faces: 6, name: 'd6 test', numberValue: 1, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false });
    });

    const firstId = result.current.diceList[0].id;

    act(() => {
      result.current.removeDice(firstId);
    });

    expect(result.current.diceList.length).toBe(0);
  });

  it('should toggle hold/lock status on a die', () => {
    const { result } = renderHook(() => useDiceState());

    act(() => {
      result.current.addDice({ faces: 6, name: 'd6 test', numberValue: 1, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false });
    });

    const firstId = result.current.diceList[0].id;
    expect(result.current.diceList[0].held).toBe(false);

    act(() => {
      result.current.toggleHold(firstId);
    });

    expect(result.current.diceList[0].held).toBe(true);
  });

  it('should adjust modifier correctly', () => {
    const { result } = renderHook(() => useDiceState());
    expect(result.current.modifier).toBe(0);

    act(() => {
      result.current.setModifier(3);
    });

    expect(result.current.modifier).toBe(3);

    act(() => {
      result.current.setModifier(0);
    });

    expect(result.current.modifier).toBe(0);
  });

  it('should toggle RPG mode state', () => {
    const { result } = renderHook(() => useDiceState());
    const initialMode = result.current.rpgMode;

    act(() => {
      result.current.toggleRpgMode();
    });

    expect(result.current.rpgMode).toBe(!initialMode);
  });

  it('should handle Advantage / Disadvantage state toggles', () => {
    const { result } = renderHook(() => useDiceState());
    expect(result.current.rollAdvantage).toBe('normal');

    act(() => {
      result.current.setRollAdvantage('advantage');
    });
    expect(result.current.rollAdvantage).toBe('advantage');

    act(() => {
      result.current.setRollAdvantage('disadvantage');
    });
    expect(result.current.rollAdvantage).toBe('disadvantage');
  });
});
