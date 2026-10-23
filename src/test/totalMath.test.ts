import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { totalMath, spokenTotal } from '../utils/totalMath';
import { useDiceState } from '../hooks/useDiceState';

describe('Total with its math', () => {
  it('shows the dice and the modifier in brackets', () => {
    expect(totalMath(9, 2)).toBe('(7+2)');
    expect(totalMath(5, -2)).toBe('(7−2)');
    expect(totalMath(9, 0)).toBeNull();
  });

  it('reads out the math for screen readers', () => {
    expect(spokenTotal(9, 2)).toBe('Rolled 9: 7 plus 2');
    expect(spokenTotal(5, -2)).toBe('Rolled 5: 7 minus 2');
    expect(spokenTotal(9, 0)).toBe('Rolled 9');
  });

  it('remembers the modifier a roll counted, even if it changes afterwards', async () => {
    localStorage.clear();
    localStorage.setItem('rpgMode', 'true');
    const { result } = renderHook(() => useDiceState());
    act(() => { result.current.addDice({ faces: 6 }); result.current.setModifier(2); });
    await act(async () => { result.current.rollDice(); await new Promise(r => setTimeout(r, 1500)); });
    const roll = result.current.rollHistory[0];
    expect(roll.modifier).toBe(2);
    expect(totalMath(roll.total, roll.modifier ?? 0)).toBe(`(${roll.total - 2}+2)`);
  });
});
