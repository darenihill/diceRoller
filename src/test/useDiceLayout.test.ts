import { describe, it, expect } from 'vitest';
import { calculateGridDimensions } from '../utils/diceUtils';

describe('calculateGridDimensions (Grid Layout Regression Tests)', () => {
  it('should calculate valid grid dimensions for single die', () => {
    const { optimalSize, optimalColumns, dynamicGap } = calculateGridDimensions(1, 1000, 800);
    expect(optimalColumns).toBe(1);
    expect(optimalSize).toBeGreaterThan(0);
    expect(dynamicGap).toBeGreaterThanOrEqual(16);
  });

  it('should calculate valid grid dimensions for 2 dice', () => {
    const { optimalSize, optimalColumns } = calculateGridDimensions(2, 1000, 800);
    expect(optimalColumns).toBeGreaterThanOrEqual(1);
    expect(optimalColumns).toBeLessThanOrEqual(2);
    expect(optimalSize).toBeGreaterThan(0);
  });

  it('should scale columns appropriately for 6 dice on desktop', () => {
    const { optimalSize, optimalColumns } = calculateGridDimensions(6, 1200, 900);
    expect(optimalColumns).toBeGreaterThanOrEqual(2);
    expect(optimalColumns).toBeLessThanOrEqual(6);
    expect(optimalSize).toBeGreaterThan(50);
  });

  it('should handle mobile screen dimensions gracefully', () => {
    const { optimalSize, optimalColumns } = calculateGridDimensions(4, 375, 667);
    expect(optimalColumns).toBeGreaterThanOrEqual(1);
    expect(optimalSize).toBeGreaterThan(30);
  });

  it('should never return NaN or zero size for any dice count up to 50', () => {
    for (let count = 1; count <= 50; count++) {
      const { optimalSize, optimalColumns } = calculateGridDimensions(count, 800, 600);
      expect(Number.isNaN(optimalSize)).toBe(false);
      expect(Number.isNaN(optimalColumns)).toBe(false);
      expect(optimalSize).toBeGreaterThan(0);
      expect(optimalColumns).toBeGreaterThan(0);
    }
  });
});
