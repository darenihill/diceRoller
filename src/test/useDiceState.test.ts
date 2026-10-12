import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiceState } from '../hooks/useDiceState';
import { ROLL_DURATION_MS } from '../utils/constants';

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

describe('rollDice (Roll Resolution, Advantage & Modifier Logic)', () => {
  // Deterministic Math.random: values are consumed from a queue, falling back
  // to 0.5 for incidental calls (generateId etc.)
  let randQueue: number[];

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    randQueue = [];
    vi.spyOn(Math, 'random').mockImplementation(() => (randQueue.length ? randQueue.shift()! : 0.5));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const plainDie = (faces: number, name: string) => ({
    faces, name, numberValue: 1, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false
  });

  const setupRpg = (result: { current: ReturnType<typeof useDiceState> }, advantage: 'advantage' | 'disadvantage' | 'normal') => {
    act(() => {
      if (!result.current.rpgMode) result.current.toggleRpgMode();
      result.current.setRollAdvantage(advantage);
    });
  };

  it('applies the modifier to the roll total in RPG mode', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => result.current.addDice(plainDie(6, 'd6')));
    setupRpg(result, 'normal');
    act(() => result.current.setModifier(3));

    randQueue = [0.5]; // floor(0.5 * 6) + 1 = 4
    act(() => result.current.rollDice());
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    expect(result.current.rollHistory[0].total).toBe(7); // 4 + 3
  });

  it('advantage keeps the highest of two plain d20s and drops the other', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => {
      result.current.addDice(plainDie(20, 'd20 A'));
      result.current.addDice(plainDie(20, 'd20 B'));
    });
    setupRpg(result, 'advantage');

    randQueue = [0.9, 0.1]; // 19 and 3
    act(() => result.current.rollDice());
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    expect(result.current.rollHistory[0].total).toBe(19);
    expect(result.current.diceList.filter(d => d.dropped).length).toBe(1);
  });

  it('disadvantage keeps the lowest of two plain d20s', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => {
      result.current.addDice(plainDie(20, 'd20 A'));
      result.current.addDice(plainDie(20, 'd20 B'));
    });
    setupRpg(result, 'disadvantage');

    randQueue = [0.9, 0.1]; // 19 and 3
    act(() => result.current.rollDice());
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    expect(result.current.rollHistory[0].total).toBe(3);
    expect(result.current.diceList.filter(d => d.dropped).length).toBe(1);
  });

  it('advantage does NOT group custom-faced dice (percentile d100 stays intact)', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => {
      result.current.addDice({
        faces: 10, name: 'Tens', numberValue: 10, currentFaceIndex: 0,
        customFaces: ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"], color: '#384050', held: false
      });
      result.current.addDice({
        faces: 10, name: 'Units', numberValue: 1, currentFaceIndex: 0,
        customFaces: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], color: '#D32F2F', held: false
      });
    });
    setupRpg(result, 'advantage');

    // Per die: one random for the numeric value (overridden), one for the face index
    randQueue = [0.5, 0.95, 0.5, 0.15]; // Tens -> "90", Units -> "1"
    act(() => result.current.rollDice());
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    // Both halves of the percentile pair must count: 90 + 1 = 91, nothing dropped
    expect(result.current.diceList.filter(d => d.dropped).length).toBe(0);
    expect(result.current.rollHistory[0].total).toBe(91);
  });

  it('reports the resolved total and unheld dice count via onComplete', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => {
      result.current.addDice(plainDie(6, 'a'));
      result.current.addDice(plainDie(6, 'b'));
    });

    const onComplete = vi.fn();
    randQueue = [0.5, 0.5]; // 4 and 4
    act(() => result.current.rollDice(onComplete));
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ total: 8, diceCount: 2 }));
  });

  it('held dice keep their value and are excluded from re-rolling', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => {
      result.current.addDice({ ...plainDie(6, 'held die'), numberValue: 5 });
      result.current.addDice(plainDie(6, 'free die'));
    });
    act(() => result.current.toggleHold(result.current.diceList[0].id));

    randQueue = [0.1]; // free die -> 1
    act(() => result.current.rollDice());
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    expect(result.current.diceList[0].numberValue).toBe(5);
    expect(result.current.rollHistory[0].total).toBe(6); // 5 held + 1 rolled
  });

  it('persists roll history to localStorage and clears it', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => result.current.addDice(plainDie(6, 'd6')));

    act(() => result.current.rollDice());
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    expect(JSON.parse(localStorage.getItem('rollHistory') || '[]').length).toBe(1);

    act(() => result.current.clearHistory());
    expect(result.current.rollHistory.length).toBe(0);
    expect(JSON.parse(localStorage.getItem('rollHistory') || '[]').length).toBe(0);
  });
});

describe('rollDice for one die', () => {
  let randQueue: number[];

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    randQueue = [];
    vi.spyOn(Math, 'random').mockImplementation(() => (randQueue.length ? randQueue.shift()! : 0.5));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const plainDie = (faces: number, name: string, numberValue: number) => ({
    faces, name, numberValue, currentFaceIndex: 0, customFaces: [], color: '#384050', held: false
  });

  it('rolls only the chosen die and logs it as its own single entry', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => {
      result.current.addDice(plainDie(6, 'Red', 2));
      result.current.addDice(plainDie(6, 'Yellow', 3));
    });
    // Math.random is mocked, so both got the same generated id; give them their own
    act(() => result.current.setDiceList(list => list.map((d, i) => ({ ...d, id: `die-${i}` }))));
    if (!result.current.rpgMode) act(() => result.current.toggleRpgMode());
    act(() => result.current.setModifier(5));
    const [red, yellow] = result.current.diceList;

    randQueue = [0.99]; // floor(0.99 * 6) + 1 = 6
    act(() => result.current.rollDice(undefined, yellow.id));
    expect(result.current.rollingId).toBe(yellow.id);
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    const [entry] = result.current.rollHistory;
    expect(entry.single).toBe(true);
    expect(entry.total).toBe(6); // the die alone: no modifier, other dice not counted
    expect(entry.details).toEqual(['Yellow: 6']);
    expect(result.current.diceList.find(d => d.id === red.id)?.numberValue).toBe(2);
    expect(result.current.diceList.find(d => d.id === yellow.id)?.numberValue).toBe(6);
    expect(result.current.rollingId).toBe(null);
  });

  it('rolls a held die when it is the one chosen, and keeps it held', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => result.current.addDice(plainDie(6, 'Red', 2)));
    const [red] = result.current.diceList;
    act(() => result.current.toggleHold(red.id));
    expect(result.current.diceList[0].held).toBe(true);

    randQueue = [0.99];
    act(() => result.current.rollDice(undefined, red.id));
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));

    expect(result.current.diceList[0].numberValue).toBe(6);
    expect(result.current.diceList[0].held).toBe(true);
  });

  it('leaves a whole-set roll unmarked', () => {
    const { result } = renderHook(() => useDiceState());
    act(() => result.current.addDice(plainDie(6, 'Red', 2)));
    act(() => result.current.rollDice());
    act(() => vi.advanceTimersByTime(ROLL_DURATION_MS));
    expect(result.current.rollHistory[0].single).toBeUndefined();
  });
});
