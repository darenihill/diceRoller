import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiceState, MODIFIER_KEY, ADVANTAGE_KEY } from '../hooks/useDiceState';

describe('Your +2 and Advantage stay set after a reopen', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('rpgMode', 'true');
  });

  it('comes back with the modifier and the ADV / NORM / DIS pick', () => {
    const first = renderHook(() => useDiceState());
    act(() => { first.result.current.setModifier(2); first.result.current.setRollAdvantage('advantage'); });
    first.unmount();

    const reopened = renderHook(() => useDiceState());
    expect(reopened.result.current.modifier).toBe(2);
    expect(reopened.result.current.rollAdvantage).toBe('advantage');
  });

  it('keeps a minus modifier and Disadvantage', () => {
    const first = renderHook(() => useDiceState());
    act(() => { first.result.current.setModifier(-3); first.result.current.setRollAdvantage('disadvantage'); });
    first.unmount();

    const reopened = renderHook(() => useDiceState());
    expect(reopened.result.current.modifier).toBe(-3);
    expect(reopened.result.current.rollAdvantage).toBe('disadvantage');
  });

  it('a first visit starts at +0 and NORM', () => {
    const { result } = renderHook(() => useDiceState());
    expect(result.current.modifier).toBe(0);
    expect(result.current.rollAdvantage).toBe('normal');
  });

  it('ignores damaged stored values', () => {
    localStorage.setItem(MODIFIER_KEY, 'abc');
    localStorage.setItem(ADVANTAGE_KEY, 'sideways');
    const { result } = renderHook(() => useDiceState());
    expect(result.current.modifier).toBe(0);
    expect(result.current.rollAdvantage).toBe('normal');
  });

  it('turning RPG mode off still resets Advantage, and that is kept too', () => {
    const first = renderHook(() => useDiceState());
    act(() => first.result.current.setRollAdvantage('advantage'));
    act(() => first.result.current.toggleRpgMode());
    first.unmount();
    const reopened = renderHook(() => useDiceState());
    expect(reopened.result.current.rollAdvantage).toBe('normal');
  });
});
