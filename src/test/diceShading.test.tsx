import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DICE_SHAPES } from '../utils/diceShapes';
import { PolyhedralWireframe } from '../components/PolyhedralWireframe';

const centreY = (points: string) => {
  const ys = points.split(' ').map(p => Number(p.split(',')[1]));
  return ys.reduce((a, b) => a + b, 0) / ys.length;
};

describe('Dice shading: each face of the RPG dice gets its own shade, lit from above', () => {
  for (const [n, shape] of Object.entries(DICE_SHAPES)) {
    it(`d${n}: every face has a gentle shade inside the die`, () => {
      expect(shape.faces.length).toBeGreaterThanOrEqual(3);
      for (const f of shape.faces) {
        expect(Math.abs(f.shade)).toBeLessThanOrEqual(0.3);
        for (const pt of f.points.split(' ')) {
          const [x, y] = pt.split(',').map(Number);
          expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(100);
          expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(100);
        }
      }
    });

    it(`d${n}: the lowest face is darker than the highest one`, () => {
      const byHeight = [...shape.faces].sort((a, b) => centreY(a.points) - centreY(b.points));
      expect(byHeight[byHeight.length - 1].shade).toBeLessThan(byHeight[0].shade);
      expect(Math.min(...shape.faces.map(f => f.shade))).toBe(byHeight[byHeight.length - 1].shade);
    });
  }

  it('draws the shaded faces under the lines, leaving the number alone', () => {
    const { container } = render(<PolyhedralWireframe faces={20} />);
    const svg = container.querySelector('svg')!;
    const shading = svg.querySelector('[data-face-shading]')!;
    expect(shading.querySelectorAll('polygon').length).toBe(DICE_SHAPES[20].faces.filter(f => f.shade !== 0).length);
    expect(svg.firstElementChild).toBe(shading);
    expect(svg.querySelectorAll('path').length).toBe(2);
  });
});
