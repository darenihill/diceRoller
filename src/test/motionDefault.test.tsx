import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

// Its own file: the animation library remembers the Reduce motion setting
// for the whole run, so the "on" case lives in reduceMotion.test.tsx
const d6: DiceData = { id: 'a', numberValue: 3, faces: 6, customFaces: [], color: '#3366ff', held: false };
const noop = () => {};

describe('Reduce motion off', () => {
  it('still shakes a rolling die as before', () => {
    const { container } = render(
      <Dice dice={d6} isRolling isRevealed={false} onReveal={noop} onToggleHold={noop} onRemove={noop} onOpenSettings={noop} />,
    );
    expect(container.querySelector('.dice-shake')).not.toBeNull();
    expect(container.querySelector('[data-calm]')).toBeNull();
  });
});
