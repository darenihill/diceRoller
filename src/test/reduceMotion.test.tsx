import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

const d6: DiceData = { id: 'a', numberValue: 3, faces: 6, customFaces: [], color: '#3366ff', held: false, targetValue: 5 };
const noop = () => {};
const props = { isRevealed: false, onReveal: noop, onToggleHold: noop, onRemove: noop, onOpenSettings: noop };

function setReduceMotion(on: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: on && query.includes('reduce'),
    media: query, onchange: null,
    addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop,
    dispatchEvent: () => false,
  }));
}

describe('Reduce motion', () => {
  const original = window.matchMedia;
  afterAll(() => { window.matchMedia = original; });

  describe('with the setting on', () => {
    beforeAll(() => setReduceMotion(true));

    it('keeps a rolling die still and dims its number until it lands', () => {
      vi.useFakeTimers();
      const { container, rerender } = render(<Dice dice={d6} isRolling {...props} />);
      expect(container.querySelector('.dice-shake')).toBeNull();
      const number = container.querySelector('[data-calm]')!;
      expect(number.getAttribute('data-calm')).toBe('rolling');
      // No flicker through random faces while it rolls
      act(() => { vi.advanceTimersByTime(1000); });
      expect(number.textContent).toBe('3');
      rerender(<Dice dice={{ ...d6, numberValue: 5 }} isRolling={false} {...props} />);
      expect(number.getAttribute('data-calm')).toBe('still');
      expect(number.textContent).toBe('5');
      vi.useRealTimers();
    });
  });

  it('stops the CSS shake and the sliding toast too', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.dice-shake\s*\{\s*animation: none/);
    const app = readFileSync(resolve(__dirname, '../App.module.css'), 'utf8');
    expect(app).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.toast\s*\{\s*animation: toastFadeIn/);
    const main = readFileSync(resolve(__dirname, '../main.tsx'), 'utf8');
    expect(main).toContain('<MotionConfig reducedMotion="user">');
  });
});
