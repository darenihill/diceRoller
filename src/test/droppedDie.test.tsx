import React from 'react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

const base: DiceData = { id: 'd1', numberValue: 7, faces: 20, customFaces: [], color: '#384050', held: false };
const props = { isRolling: false, isRevealed: false, onReveal: () => {}, onToggleHold: () => {}, onRemove: () => {}, onOpenSettings: () => {} };
const css = readFileSync('src/components/Dice.module.css', 'utf8');

describe('Dropped die with Advantage or Disadvantage', () => {
  it('a dropped die shows the DROPPED stamp; a kept one does not', () => {
    const { rerender } = render(<Dice dice={base} {...props} />);
    expect(screen.queryByTestId('dropped-stamp')).toBeNull();
    rerender(<Dice dice={{ ...base, dropped: true }} {...props} />);
    expect(screen.getByTestId('dropped-stamp')).toHaveTextContent('DROPPED');
  });

  it('the stamp drops in with emphasized easing, and stays still under Reduce motion', () => {
    expect(css).toMatch(/\.droppedBadge\s*{[^}]*animation:\s*stampIn 0\.4s cubic-bezier\(0\.2, 0, 0, 1\)/);
    expect(css).toMatch(/@keyframes stampIn/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*{\s*\.droppedBadge\s*{\s*animation:\s*none/);
  });

  it('dimming eases in rather than snapping', () => {
    expect(css).toMatch(/transition:[^;]*opacity 0\.4s cubic-bezier\(0\.2, 0, 0, 1\)/);
  });
});
