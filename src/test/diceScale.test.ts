import { describe, it, expect } from 'vitest';
import {
  calculateGridDimensions,
  scaleGridDimensions,
  sanitizeDiceScale,
  DICE_SCALE_DEFAULT,
} from '../utils/diceUtils';

const fit = (count: number, w: number, h: number, scale: number) =>
  scaleGridDimensions(calculateGridDimensions(count, w, h), count, w, h, scale);

describe('dice size preference', () => {
  it('leaves the fitted layout unchanged at the default size', () => {
    for (const count of [1, 2, 6, 30]) {
      expect(fit(count, 390, 700, DICE_SCALE_DEFAULT)).toEqual(calculateGridDimensions(count, 390, 700));
    }
  });

  it('scales dice smaller and bigger', () => {
    const base = calculateGridDimensions(6, 1280, 800).optimalSize;
    expect(fit(6, 1280, 800, 0.6).optimalSize).toBeLessThan(base);
    expect(fit(6, 1280, 800, 1.6).optimalSize).toBeGreaterThan(base);
  });

  it('never makes a die wider or taller than the visible area', () => {
    for (const [count, w, h] of [[1, 390, 700], [30, 390, 700], [1, 1280, 800], [30, 1280, 800]]) {
      const { optimalSize, optimalColumns, dynamicGap } = fit(count, w, h, 1.6);
      expect(optimalSize).toBeLessThanOrEqual(Math.min(w, h) - 36);
      expect(optimalColumns * optimalSize + (optimalColumns - 1) * dynamicGap).toBeLessThanOrEqual(w - 36);
      expect(optimalColumns).toBeGreaterThanOrEqual(1);
      expect(optimalColumns).toBeLessThanOrEqual(count);
    }
  });

  it('reads stored and imported values safely', () => {
    expect(sanitizeDiceScale(null)).toBe(1);
    expect(sanitizeDiceScale(undefined)).toBe(1);
    expect(sanitizeDiceScale('1.3')).toBe(1.3);
    expect(sanitizeDiceScale(0.8)).toBe(0.8);
    expect(sanitizeDiceScale(9)).toBe(1.6);
    expect(sanitizeDiceScale(-2)).toBe(0.6);
    expect(sanitizeDiceScale('abc')).toBe(1);
  });
});
