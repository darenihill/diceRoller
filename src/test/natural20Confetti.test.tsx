import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiceState, type RollSummary } from '../hooks/useDiceState';

const confettiMock = vi.fn();
vi.mock('canvas-confetti', () => ({ default: (opts: unknown) => confettiMock(opts) }));

import { celebrateNatural20 } from '../utils/confetti';

function setReducedMotion(on: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: on && q.includes('reduce'),
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia;
}

async function roll(rpg: boolean, setup: (r: ReturnType<typeof useDiceState>) => void): Promise<RollSummary> {
  localStorage.clear();
  localStorage.setItem('rpgMode', String(rpg));
  const { result } = renderHook(() => useDiceState());
  act(() => setup(result.current));
  let summary: RollSummary | undefined;
  await act(async () => {
    result.current.rollDice(s => { summary = s; });
    await new Promise(r => setTimeout(r, 1500));
  });
  return summary!;
}

describe('Natural 20 confetti', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    confettiMock.mockClear();
    setReducedMotion(false);
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.999); // every die lands on its top face
  });
  afterEach(() => randomSpy.mockRestore());

  it('a d20 rolling 20 in RPG Mode fires one burst', async () => {
    const s = await roll(true, r => r.addDice({ faces: 20 }));
    expect(s.natural20Ids).toHaveLength(1);
    expect(await celebrateNatural20(s.natural20Ids)).toBe(true);
    expect(confettiMock).toHaveBeenCalledTimes(1);
  });

  it('no burst outside RPG Mode', async () => {
    const s = await roll(false, r => r.addDice({ faces: 20 }));
    expect(s.natural20Ids).toEqual([]);
  });

  it('no burst for a held die that already shows 20', async () => {
    const s = await roll(true, r => r.restoreDice([{ id: 'h1', faces: 20, numberValue: 20, currentFaceIndex: 0, name: '', customFaces: [], color: '#0056D2', held: true }]));
    expect(s.natural20Ids).toEqual([]);
  });

  it('no burst for the 20 that Disadvantage drops', async () => {
    let n = 0;
    randomSpy.mockImplementation(() => (n++ % 2 === 0 ? 0.999 : 0.3)); // first d20 rolls 20, second 7
    const s = await roll(true, r => {
      r.addDice({ faces: 20 });
      r.addDice({ faces: 20 });
      r.setRollAdvantage('disadvantage');
    });
    expect(s.natural20Ids).toEqual([]);
  });

  it('with Reduce motion on, the glow stays and no confetti fires', async () => {
    setReducedMotion(true);
    expect(await celebrateNatural20(['any'])).toBe(false);
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it('a d6 rolling its top face fires nothing', async () => {
    const s = await roll(true, r => r.addDice({ faces: 6 }));
    expect(s.natural20Ids).toEqual([]);
  });
});
